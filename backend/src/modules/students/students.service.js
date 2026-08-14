const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");
const authService = require("../auth/auth.service");
const { generateTempPassword, generateUsername } = require("../../utils/credentials");
const { TEACHER_EDITABLE } = require("./students.schema");

// Resolve effective school scope for a query.
function resolveSchoolScope(user, query = {}) {
  if (user.role === "superAdmin") return query.schoolId || null;
  return user.schoolId;
}

async function listStudents({ user, query }) {
  const schoolId = resolveSchoolScope(user, query);
  const where = {
    ...(schoolId ? { schoolId } : {}),
    ...(query.cls ? { cls: query.cls } : {}),
    ...(query.section ? { section: query.section } : {}),
    ...(query.session && query.session !== "all" ? { session: query.session } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { admNo: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const students = await prisma.student.findMany({
    where,
    orderBy: [{ session: "desc" }, { cls: "asc" }, { section: "asc" }, { roll: "asc" }],
    include: { school: { select: { name: true, session: true } } },
  });

  return students.map((s) => ({
    ...s,
    classSection: `${s.cls}-${s.section}`,
  }));
}

async function getStudent({ user, id }) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: { school: { select: { name: true, session: true } } },
  });
  if (!student) throw new ApiError(404, "Student not found");
  if (user.role === "parent") {
    if (user.studentId !== student.id) throw new ApiError(403, "You may only view your own child");
  } else if (user.schoolId && student.schoolId !== user.schoolId) {
    throw new ApiError(403, "Student does not belong to your school");
  }
  return { ...student, classSection: `${student.cls}-${student.section}` };
}

// Creates a student.
async function createStudent({ user, data }) {
  const schoolId = user.role === "superAdmin" ? data.schoolId : user.schoolId;
  if (!schoolId) throw new ApiError(400, "A school is required to add students");

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new ApiError(404, "School not found");

  const existing = await prisma.student.findUnique({
    where: { schoolId_admNo: { schoolId, admNo: data.admNo } },
  });
  if (existing) throw new ApiError(409, "Student with this admission number already exists");

  const wantParent = Boolean(data.parentName || data.parentEmail || data.parentPhone || data.fatherName);

  const res = await prisma.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: {
        schoolId,
        admNo: data.admNo,
        name: data.name,
        cls: data.cls,
        section: data.section,
        roll: Number(data.roll) || 1,
        session: data.session || school.session || "2024-2025",
        batch: data.batch || null,
        dob: data.dob || null,
        bloodGroup: data.bloodGroup || null,
        emergency: data.emergency || null,
        address: data.address || null,
        fatherName: data.fatherName || data.parentName || null,
        fatherEmail: data.fatherEmail || data.parentEmail || null,
        fatherPhone: data.fatherPhone || data.parentPhone || null,
        motherName: data.motherName || null,
        status: data.status || "Active",
      },
    });

    let credentials = null;
    if (wantParent) {
      const tempPassword = generateTempPassword();
      const username = await generateUsername(`${data.admNo}-parent`, tx);
      const syntheticEmail = (data.parentEmail || data.fatherEmail)
        ? (data.parentEmail || data.fatherEmail).toLowerCase().trim()
        : `${data.admNo.toLowerCase()}-parent@vidyaloop.local`;

      await tx.user.create({
        data: {
          name: data.parentName || data.fatherName || `Parent of ${data.name}`,
          email: syntheticEmail,
          username,
          passwordHash: await authService.hashPassword(tempPassword),
          role: "parent",
          schoolId,
          studentId: student.id,
          mustChangePassword: true,
        },
      });

      credentials = {
        username,
        email: syntheticEmail,
        password: tempPassword,
        note: "Parent portal login — ask them to change password on first login.",
      };
    }

    return { student, credentials };
  });

  return {
    ...res.student,
    classSection: `${res.student.cls}-${res.student.section}`,
    credentials: res.credentials,
  };
}

// Bulk create students
async function bulkCreateStudents({ user, students }) {
  if (!Array.isArray(students) || students.length === 0) {
    throw new ApiError(400, "Please provide an array of student records to import");
  }

  const schoolId = user.role === "superAdmin" ? (students[0]?.schoolId || user.schoolId) : user.schoolId;
  if (!schoolId) throw new ApiError(400, "A school is required to add students");

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new ApiError(404, "School not found");

  const existingStudents = await prisma.student.findMany({
    where: { schoolId },
    select: { admNo: true },
  });
  const existingAdmNos = new Set(existingStudents.map((s) => s.admNo.toLowerCase()));

  const created = [];
  const errors = [];

  for (let i = 0; i < students.length; i++) {
    const data = students[i];
    const rowNum = i + 1;

    if (!data.admNo || !data.name || !data.cls || !data.section) {
      errors.push({ row: rowNum, admNo: data.admNo || "—", message: "Missing required fields (admNo, name, cls, section)" });
      continue;
    }

    const admClean = data.admNo.toString().trim();
    if (existingAdmNos.has(admClean.toLowerCase())) {
      errors.push({ row: rowNum, admNo: admClean, message: `Admission number ${admClean} already exists` });
      continue;
    }

    try {
      const studentObj = await prisma.student.create({
        data: {
          schoolId,
          admNo: admClean,
          name: data.name.toString().trim(),
          cls: data.cls.toString().trim(),
          section: data.section.toString().trim().toUpperCase(),
          roll: Number(data.roll) || 1,
          session: data.session || school.session || "2024-2025",
          batch: data.batch || null,
          dob: data.dob || null,
          bloodGroup: data.bloodGroup || null,
          emergency: data.emergency || null,
          address: data.address || null,
          fatherName: data.fatherName || data.parentName || null,
          fatherEmail: data.fatherEmail || data.parentEmail || null,
          fatherPhone: data.fatherPhone || data.parentPhone || null,
          motherName: data.motherName || null,
          status: data.status || "Active",
        },
      });

      existingAdmNos.add(admClean.toLowerCase());

      const tempPassword = generateTempPassword();
      const username = await generateUsername(`${admClean}-parent`, prisma);
      const parentEmail = (data.parentEmail || data.fatherEmail)
        ? (data.parentEmail || data.fatherEmail).toString().toLowerCase().trim()
        : `${admClean.toLowerCase()}-parent@vidyaloop.local`;

      await prisma.user.create({
        data: {
          name: data.parentName || data.fatherName || `Parent of ${data.name}`,
          email: parentEmail,
          username,
          passwordHash: await authService.hashPassword(tempPassword),
          role: "parent",
          schoolId,
          studentId: studentObj.id,
          mustChangePassword: true,
        },
      });

      created.push({
        student: { ...studentObj, classSection: `${studentObj.cls}-${studentObj.section}` },
        parentAccount: { username, email: parentEmail, password: tempPassword },
      });
    } catch (err) {
      errors.push({ row: rowNum, admNo: admClean, message: err.message || "Failed to create record" });
    }
  }

  return {
    totalRequested: students.length,
    successCount: created.length,
    errorCount: errors.length,
    created,
    errors,
  };
}

async function updateStudent({ user, id, data, isTeacherCorrection }) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Student not found");

  if (user.schoolId && existing.schoolId !== user.schoolId) {
    throw new ApiError(403, "Student does not belong to your school");
  }

  let payload = data;
  if (isTeacherCorrection) {
    const cleaned = {};
    for (const key of TEACHER_EDITABLE) {
      if (data[key] !== undefined) cleaned[key] = key === "fatherEmail" ? (data[key] || null) : data[key];
    }
    for (const k of ["dob", "bloodGroup", "emergency", "address", "fatherName", "fatherPhone", "motherName"]) {
      if (cleaned[k] === "") cleaned[k] = null;
    }
    payload = cleaned;
  }

  const student = await prisma.student.update({ where: { id }, data: payload });
  return { ...student, classSection: `${student.cls}-${student.section}` };
}

async function deleteStudent({ user, id }) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Student not found");
  if (user.schoolId && existing.schoolId !== user.schoolId) {
    throw new ApiError(403, "Student does not belong to your school");
  }
  await prisma.student.delete({ where: { id } });
  return existing;
}

async function resetParentPassword({ user, id }) {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw new ApiError(404, "Student not found");
  if (user.schoolId && student.schoolId !== user.schoolId) {
    throw new ApiError(403, "Student does not belong to your school");
  }

  const parentUser = await prisma.user.findFirst({ where: { studentId: student.id } });
  if (!parentUser) throw new ApiError(404, "No parent account linked to this student");

  const tempPassword = generateTempPassword();
  await prisma.user.update({
    where: { id: parentUser.id },
    data: { passwordHash: await authService.hashPassword(tempPassword), mustChangePassword: true },
  });

  return {
    studentId: student.id,
    username: parentUser.username,
    email: parentUser.email,
    password: tempPassword,
  };
}

module.exports = {
  listStudents,
  getStudent,
  createStudent,
  bulkCreateStudents,
  updateStudent,
  deleteStudent,
  resetParentPassword,
};