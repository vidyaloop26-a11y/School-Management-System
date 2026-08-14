const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");
const authService = require("../auth/auth.service");

// Creates a School and, in the same transaction, auto-generates the schoolAdmin login credentials.
async function createSchool(data) {
  const code = data.code.toUpperCase().trim();
  const existing = await prisma.school.findUnique({ where: { code } });
  if (existing) throw new ApiError(409, `A school with code '${code}' already exists`);

  const adminName = data.adminName || `${data.name} Admin`;
  const adminEmail = (data.adminEmail || `admin.${code.toLowerCase()}@vidyaloop.in`).toLowerCase().trim();
  const adminUsername = (data.adminUsername || adminEmail).toLowerCase().trim();

  if (await authService.findUserByEmail(adminEmail)) {
    throw new ApiError(409, `User with email '${adminEmail}' already exists`);
  }

  const generatedPassword = data.adminPassword || `${code}@Admin2026`;
  const adminPasswordHash = await authService.hashPassword(generatedPassword);

  const school = await prisma.$transaction(async (tx) => {
    const created = await tx.school.create({
      data: {
        name: data.name,
        code,
        board: data.board || "CBSE",
        address: data.address || data.city || "India",
        session: data.session || "2024-2025",
      },
    });

    await tx.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        username: adminUsername,
        passwordHash: adminPasswordHash,
        role: "schoolAdmin",
        schoolId: created.id,
        mustChangePassword: true,
      },
    });

    return created;
  });

  return {
    school,
    credentials: {
      schoolName: school.name,
      schoolCode: school.code,
      adminName,
      email: adminEmail,
      username: adminUsername,
      password: generatedPassword,
    },
  };
}

async function listSchools() {
  return prisma.school.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { students: true, staff: true, users: true } },
    },
  });
}

async function getSchool(id) {
  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      _count: { select: { students: true, staff: true } },
    },
  });
  if (!school) throw new ApiError(404, "School not found");
  return school;
}

async function updateSchool(id, data) {
  const school = await prisma.school.findUnique({ where: { id } });
  if (!school) throw new ApiError(404, "School not found");
  return prisma.school.update({ where: { id }, data });
}

async function deleteSchool(id) {
  const school = await prisma.school.findUnique({ where: { id } });
  if (!school) throw new ApiError(404, "School not found");
  await prisma.school.delete({ where: { id } });
  return school;
}

module.exports = { createSchool, listSchools, getSchool, updateSchool, deleteSchool };