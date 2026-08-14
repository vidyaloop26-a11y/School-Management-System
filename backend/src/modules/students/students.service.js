const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");
const authService = require("../auth/auth.service");
const { generateTempPassword, generateUsername } = require("../../utils/credentials");

async function resolveSchoolScope(user, query = {}) {
  if (user.role === "superAdmin") {
    if (!query.schoolId || query.schoolId === "all") return null;
    const cleanId = String(query.schoolId).replace(/^"|"$/g, "").trim();
    if (!cleanId || cleanId === "all") return null;

    const school = await prisma.school.findFirst({
      where: {
        OR: [{ id: cleanId }, { code: cleanId }],
      },
      select: { id: true },
    });
    return school ? school.id : cleanId;
  }
  return user.schoolId;
}

async function listStudents({ user, query }) {
  const schoolId = await resolveSchoolScope(user, query);
  const where = {
    ...(schoolId ? { schoolId } : {}),
    ...(query.cls ? { cls: query.cls } : {}),
    ...(query.section ? { section: query.section } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

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
    include: { school: { select: { name: true, code: true } } },
  });

  return { students };
}

async function getStudent({ user, id }) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: { school: { select: { name: true, code: true } } },
  });
  if (!student) throw new ApiError(404, "Student not found");
  if (user.schoolId && student.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied to other school's student");
  }
  return student;
}

async function createStudent({ user, data }) {
  const schoolId = user.schoolId || data.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const student = await prisma.student.create({
    data: {
      schoolId,
      admNo: data.admNo,
      name: data.name,
      cls: data.cls,
      section: data.section,
      roll: data.roll || 1,
      session: data.session || "2024-2025",
      batch: data.batch || "2020-2025",
      dob: data.dob,
      bloodGroup: data.bloodGroup,
      fatherName: data.fatherName,
      fatherPhone: data.fatherPhone,
      fatherEmail: data.fatherEmail,
      motherName: data.motherName,
      emergency: data.emergency,
      address: data.address,
      status: data.status || "Active",
    },
  });

  if (data.parentEmail) {
    const tempPassword = generateTempPassword();
    const username = await generateUsername(`${data.admNo}-parent`, prisma);
    const parentUser = await prisma.user.create({
      data: {
        name: data.fatherName || `Parent of ${data.name}`,
        email: data.parentEmail.toLowerCase().trim(),
        username,
        passwordHash: await authService.hashPassword(tempPassword),
        role: "parent",
        schoolId,
        studentId: student.id,
        mustChangePassword: true,
      },
    });

    return {
      student,
      parentAccount: {
        username: parentUser.username,
        email: parentUser.email,
        tempPassword,
      },
    };
  }

  return { student };
}

async function bulkCreateStudents({ user, students }) {
  const schoolId = user.schoolId;
  if (!schoolId && user.role !== "superAdmin") throw new ApiError(400, "School ID required");

  let count = 0;
  for (const s of students) {
    const targetSchoolId = schoolId || s.schoolId;
    if (!targetSchoolId) continue;
    await prisma.student.upsert({
      where: { schoolId_admNo: { schoolId: targetSchoolId, admNo: s.admNo } },
      create: {
        schoolId: targetSchoolId,
        admNo: s.admNo,
        name: s.name,
        cls: s.cls,
        section: s.section,
        roll: s.roll || 1,
        session: s.session || "2024-2025",
        batch: s.batch || "2020-2025",
        dob: s.dob,
        bloodGroup: s.bloodGroup,
        fatherName: s.fatherName,
        fatherPhone: s.fatherPhone,
        fatherEmail: s.fatherEmail,
        motherName: s.motherName,
        emergency: s.emergency,
        address: s.address,
        status: s.status || "Active",
      },
      update: {
        name: s.name,
        cls: s.cls,
        section: s.section,
        roll: s.roll || 1,
        session: s.session || "2024-2025",
        batch: s.batch || "2020-2025",
      },
    });
    count++;
  }

  return { successCount: count };
}

async function updateStudent({ user, id, data }) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Student not found");
  if (user.schoolId && existing.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  return prisma.student.update({
    where: { id },
    data,
  });
}

async function deleteStudent({ user, id }) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Student not found");
  if (user.schoolId && existing.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return prisma.student.delete({ where: { id } });
}

module.exports = {
  listStudents,
  getStudent,
  createStudent,
  bulkCreateStudents,
  updateStudent,
  deleteStudent,
  resolveSchoolScope,
};