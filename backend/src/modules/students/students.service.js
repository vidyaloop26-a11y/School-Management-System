const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");
const authService = require("../auth/auth.service");
const { generateTempPassword, generateUsername } = require("../../utils/credentials");
const { TEACHER_EDITABLE } = require("./students.schema");

// Resolve effective school scope for a query.
// - superAdmin: any school via ?schoolId (or null = all schools)
// - everyone else: their own school
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
    ...(query.status ? { status: query.status } : {}),
  };

  // Parents only ever see their own child.
  if (user.role === "parent") {
    where.id = user.studentId || "000000000000000000000000";
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { admNo: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const students = await prisma.student.findMany({
    where,
    orderBy: [{ cls: "asc" }, { section: "asc" }, { roll: "asc" }],
    include: { school: { select: { name: true } } },
  });

  return students.map((s) => ({
    ...s,
    classSection: `${s.cls}-${s.section}`,
  }));
}

// A parent may only view their linked child's record; any school member can
// read any student in their school.
function assertCanView(user, student) {
  if (user.role === "parent") {
    if (user.studentId !== student.id) {
      throw new ApiError(403, "You may only view your own child");
    }
  } else if (user.schoolId && student.schoolId !== user.schoolId) {
    throw new ApiError(403, "Student does not belong to your school");
  }
}

async function getStudent({ user, id }) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: { school: { select: { name: true } } },
  });
  if (!student) throw new ApiError(404, "Student not found");
  assertCanView(user, student);
  return { ...student, classSection: `${student.cls}-${student.section}` };
}

// Creates a student. schoolAdmin (or superAdmin with schoolId). When parent
// details are supplied, a parent portal account is generated with creds.
async function createStudent({ user, data }) {
  const schoolId = user.role === "superAdmin" ? data.schoolId : user.schoolId;
  if (!schoolId) throw new ApiError(400, "A school is required to add students");

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new ApiError(404, "School not found");

  const existing = await prisma.student.findUnique({
    where: { schoolId_admNo: { schoolId, admNo: data.admNo } },
  });
  if (existing) throw new ApiError(409, "Student with this admission number already exists");

  const wantParent = Boolean(data.parentName || data.parentEmail || data.parentPhone);

  const result = await prisma.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: {
        schoolId,
        admNo: data.admNo,
        name: data.name,
        cls: data.cls,
        section: data.section,
        roll: data.roll,
        dob: data.dob || null,
        bloodGroup: data.bloodGroup,
        emergency: data.emergency,
        address: data.address,
        fatherName: data.fatherName,
        fatherEmail: data.fatherEmail || null,
        fatherPhone: data.fatherPhone,
        motherName: data.motherName,
        status: data.status || "Active",
      },
    });

    let credentials = null;
    if (wantParent) {
      const tempPassword = generateTempPassword();
      const username = await generateUsername(`${data.admNo}-parent`, tx);
      const syntheticEmail = data.parentEmail
        ? data.parentEmail
        : `${data.admNo.toLowerCase()}-parent@vidyaloop.local`;

      await tx.user.create({
        data: {
          name: data.parentName || `Parent of ${data.name}`,
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
        email: data.parentEmail || null,
        password: tempPassword,
        note: "Parent portal login — ask them to change the password on first login.",
      };
    }

    return { student, credentials };
  });

  return {
    ...result.student,
    classSection: `${result.student.cls}-${result.student.section}`,
    credentials: result.credentials,
  };
}

// Update a student.
// - schoolAdmin: any field
// - teacher: ONLY correction fields (name, dob, blood, guardians, contact…)
//   i.e. teachers may correct but never move/rename structural data.
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
    // Empty strings -> null for optional fields to keep DB clean
    for (const k of ["dob", "bloodGroup", "emergency", "address", "fatherName", "fatherPhone", "motherName"]) {
      if (cleaned[k] === "") cleaned[k] = null;
    }
    payload = cleaned;
    if (Object.keys(payload).length === 0) {
      throw new ApiError(400, "No editable (correction) fields provided");
    }
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

// Regenerates the password for a student's parent portal account (admin only).
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
  updateStudent,
  deleteStudent,
  resetParentPassword,
};