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

async function listStaff({ user, query }) {
  const schoolId = await resolveSchoolScope(user, query);
  const where = {
    ...(schoolId ? { schoolId } : {}),
    ...(query.dept ? { dept: query.dept } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { staffId: { contains: query.search, mode: "insensitive" } },
    ];
  }
  return prisma.staff.findMany({ where, orderBy: { name: "asc" } });
}

async function getStaff({ user, id }) {
  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) throw new ApiError(404, "Staff member not found");
  if (user.schoolId && staff.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return staff;
}

async function createStaff({ user, data }) {
  const schoolId = user.schoolId || data.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const staff = await prisma.staff.create({
    data: {
      schoolId,
      staffId: data.staffId,
      name: data.name,
      jobTitle: data.jobTitle,
      dept: data.dept,
      subject: data.subject,
      qualification: data.qualification,
      email: data.email,
      phone: data.phone,
      status: data.status || "Active",
      joined: data.joined,
    },
  });

  if (data.jobTitle === "Teacher" || data.role === "teacher") {
    const tempPassword = generateTempPassword();
    const username = await generateUsername(data.staffId, prisma);
    const teacherUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email?.toLowerCase().trim() || `${data.staffId.toLowerCase()}@vidyaloop.local`,
        username,
        passwordHash: await authService.hashPassword(tempPassword),
        role: "teacher",
        schoolId,
        staffId: staff.id,
        mustChangePassword: true,
      },
    });

    return {
      staff,
      credentials: {
        username: teacherUser.username,
        email: teacherUser.email,
        tempPassword,
      },
    };
  }

  return { staff };
}

async function bulkCreateStaff({ user, staff }) {
  const schoolId = user.schoolId;
  let count = 0;
  for (const s of staff) {
    const targetSchoolId = schoolId || s.schoolId;
    if (!targetSchoolId) continue;
    await prisma.staff.upsert({
      where: { schoolId_staffId: { schoolId: targetSchoolId, staffId: s.staffId } },
      create: {
        schoolId: targetSchoolId,
        staffId: s.staffId,
        name: s.name,
        jobTitle: s.jobTitle,
        dept: s.dept,
        subject: s.subject,
        qualification: s.qualification,
        email: s.email,
        phone: s.phone,
        status: s.status || "Active",
        joined: s.joined,
      },
      update: {
        name: s.name,
        jobTitle: s.jobTitle,
        dept: s.dept,
        subject: s.subject,
      },
    });
    count++;
  }
  return { successCount: count };
}

async function updateStaff({ user, id, data }) {
  const existing = await prisma.staff.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!existing) throw new ApiError(404, "Staff member not found");
  if (user.schoolId && existing.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  const updatedStaff = await prisma.staff.update({
    where: { id },
    data,
  });

  if (data.status && existing.user) {
    const isActive = data.status === "Active";
    await prisma.user.update({
      where: { id: existing.user.id },
      data: { isActive },
    });
  }

  return updatedStaff;
}

module.exports = {
  listStaff,
  getStaff,
  createStaff,
  bulkCreateStaff,
  updateStaff,
  resolveSchoolScope,
};