const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");
const authService = require("../auth/auth.service");
const { generateTempPassword, generateUsername } = require("../../utils/credentials");

function resolveSchoolScope(user, query = {}) {
  if (user.role === "superAdmin") return query.schoolId || null;
  return user.schoolId;
}

async function listStaff({ user, query }) {
  const schoolId = resolveSchoolScope(user, query);
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
    throw new ApiError(403, "Staff member does not belong to your school");
  }
  return staff;
}

// Creates a staff member. When the job title is "Teacher", a teacher portal
// account is generated with credentials (returned once).
async function createStaff({ user, data }) {
  const schoolId = user.role === "superAdmin" ? data.schoolId : user.schoolId;
  if (!schoolId) throw new ApiError(400, "A school is required to add staff");

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new ApiError(404, "School not found");

  const existing = await prisma.staff.findUnique({
    where: { schoolId_staffId: { schoolId, staffId: data.staffId } },
  });
  if (existing) throw new ApiError(409, "Staff member with this ID already exists");

  if (data.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (emailTaken) throw new ApiError(409, "A user with that email already exists");
  }

  const isTeacher = data.jobTitle.toLowerCase() === "teacher";

  const result = await prisma.$transaction(async (tx) => {
    const staff = await tx.staff.create({
      data: {
        schoolId,
        staffId: data.staffId,
        name: data.name,
        jobTitle: data.jobTitle,
        dept: data.dept,
        subject: data.subject,
        qualification: data.qualification,
        phone: data.phone,
        email: data.email || null,
        joined: data.joined,
        status: data.status || "Active",
      },
    });

    let credentials = null;
    if (isTeacher) {
      const tempPassword = generateTempPassword();
      const username = await generateUsername(data.staffId, tx);
      const syntheticEmail = data.email
        ? data.email.toLowerCase()
        : `${data.staffId.toLowerCase()}@vidyaloop.local`;

      await tx.user.create({
        data: {
          name: data.name,
          email: syntheticEmail,
          username,
          passwordHash: await authService.hashPassword(tempPassword),
          role: "teacher",
          schoolId,
          staffId: staff.id,
          mustChangePassword: true,
        },
      });

      credentials = {
        username,
        email: data.email || null,
        password: tempPassword,
        note: "Teacher portal login — ask them to change the password on first login.",
      };
    }

    return { staff, credentials };
  });

  return { ...result.staff, credentials: result.credentials };
}

async function updateStaff({ user, id, data }) {
  const existing = await prisma.staff.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Staff member not found");
  if (user.schoolId && existing.schoolId !== user.schoolId) {
    throw new ApiError(403, "Staff member does not belong to your school");
  }
  const staff = await prisma.staff.update({ where: { id }, data });
  return staff;
}

async function deleteStaff({ user, id }) {
  const existing = await prisma.staff.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Staff member not found");
  if (user.schoolId && existing.schoolId !== user.schoolId) {
    throw new ApiError(403, "Staff member does not belong to your school");
  }
  await prisma.staff.delete({ where: { id } });
  return existing;
}

// Regenerates the login for a staff member (school admin).
async function resetStaffPassword({ user, id }) {
  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) throw new ApiError(404, "Staff member not found");
  if (user.schoolId && staff.schoolId !== user.schoolId) {
    throw new ApiError(403, "Staff member does not belong to your school");
  }

  const staffUser = await prisma.user.findFirst({ where: { staffId: staff.id } });
  if (!staffUser) throw new ApiError(404, "No portal account linked to this staff member");

  const tempPassword = generateTempPassword();
  await prisma.user.update({
    where: { id: staffUser.id },
    data: { passwordHash: await authService.hashPassword(tempPassword), mustChangePassword: true },
  });

  return { staffId: staff.id, username: staffUser.username, password: tempPassword };
}

module.exports = {
  listStaff,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  resetStaffPassword,
};