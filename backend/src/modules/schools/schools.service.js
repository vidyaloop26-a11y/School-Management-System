const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");
const authService = require("../auth/auth.service");

// Creates a School and, in the same transaction, the schoolAdmin login.
// Returns the admin credentials once — they are never stored in plaintext.
async function createSchool(data) {
  const existing = await prisma.school.findUnique({ where: { code: data.code } });
  if (existing) throw new ApiError(409, "A school with that code already exists");
  if (await authService.findUserByEmail(data.adminEmail)) {
    throw new ApiError(409, "A user with that email already exists");
  }

  const adminPasswordHash = await authService.hashPassword(data.adminPassword);

  const school = await prisma.$transaction(async (tx) => {
    const created = await tx.school.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        board: data.board,
        address: data.address,
        phone: data.phone,
        email: data.email,
        session: data.session,
      },
    });

    await tx.user.create({
      data: {
        name: data.adminName,
        email: data.adminEmail.toLowerCase().trim(),
        username: data.adminEmail.toLowerCase().trim(), // MongoDB unique index requires non-null username
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
      name: data.adminName,
      email: data.adminEmail,
      password: data.adminPassword,
      username: data.adminEmail,
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