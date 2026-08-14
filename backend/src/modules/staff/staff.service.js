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
    ...(query.dept && query.dept !== "all" ? { dept: query.dept } : {}),
    ...(query.status && query.status !== "all" ? { status: query.status } : {}),
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

// Creates a staff member. When job title is "Teacher", teacher portal credentials are generated.
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
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
    if (emailTaken) throw new ApiError(409, "A user with that email already exists");
  }

  const isTeacher = data.jobTitle.toLowerCase().includes("teacher");

  const result = await prisma.$transaction(async (tx) => {
    const staff = await tx.staff.create({
      data: {
        schoolId,
        staffId: data.staffId.toString().trim(),
        name: data.name.toString().trim(),
        jobTitle: data.jobTitle.toString().trim(),
        dept: data.dept || null,
        subject: data.subject || null,
        qualification: data.qualification || null,
        phone: data.phone || null,
        email: data.email ? data.email.toLowerCase().trim() : null,
        joined: data.joined || null,
        status: data.status || "Active",
      },
    });

    let credentials = null;
    if (isTeacher) {
      const tempPassword = generateTempPassword();
      const username = await generateUsername(data.staffId, tx);
      const syntheticEmail = data.email
        ? data.email.toLowerCase().trim()
        : `${data.staffId.toLowerCase().trim()}@vidyaloop.local`;

      await tx.user.create({
        data: {
          name: data.name,
          email: syntheticEmail,
          username,
          passwordHash: await authService.hashPassword(tempPassword),
          role: "teacher",
          schoolId,
          staffId: staff.id,
          isActive: data.status !== "Inactive",
          mustChangePassword: true,
        },
      });

      credentials = {
        username,
        email: data.email || null,
        password: tempPassword,
        note: "Teacher portal login credentials generated.",
      };
    }

    return { staff, credentials };
  });

  return { ...result.staff, credentials: result.credentials };
}

// Bulk create staff / teachers
async function bulkCreateStaff({ user, staffMembers }) {
  if (!Array.isArray(staffMembers) || staffMembers.length === 0) {
    throw new ApiError(400, "Please provide an array of staff members to import");
  }

  const schoolId = user.role === "superAdmin" ? (staffMembers[0]?.schoolId || user.schoolId) : user.schoolId;
  if (!schoolId) throw new ApiError(400, "A school is required to add staff");

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new ApiError(404, "School not found");

  const existingStaff = await prisma.staff.findMany({
    where: { schoolId },
    select: { staffId: true },
  });
  const existingStaffIds = new Set(existingStaff.map((s) => s.staffId.toLowerCase()));

  const created = [];
  const errors = [];

  for (let i = 0; i < staffMembers.length; i++) {
    const data = staffMembers[i];
    const rowNum = i + 1;

    if (!data.staffId || !data.name || !data.jobTitle) {
      errors.push({ row: rowNum, staffId: data.staffId || "—", message: "Missing required fields (staffId, name, jobTitle)" });
      continue;
    }

    const stfClean = data.staffId.toString().trim();
    if (existingStaffIds.has(stfClean.toLowerCase())) {
      errors.push({ row: rowNum, staffId: stfClean, message: `Staff ID ${stfClean} already exists` });
      continue;
    }

    try {
      const isTeacher = data.jobTitle.toString().toLowerCase().includes("teacher");
      const staffObj = await prisma.staff.create({
        data: {
          schoolId,
          staffId: stfClean,
          name: data.name.toString().trim(),
          jobTitle: data.jobTitle.toString().trim(),
          dept: data.dept || null,
          subject: data.subject || null,
          qualification: data.qualification || null,
          phone: data.phone || null,
          email: data.email ? data.email.toString().toLowerCase().trim() : null,
          joined: data.joined || null,
          status: data.status || "Active",
        },
      });

      existingStaffIds.add(stfClean.toLowerCase());

      let teacherAccount = null;
      if (isTeacher) {
        const tempPassword = generateTempPassword();
        const username = await generateUsername(stfClean, prisma);
        const email = data.email
          ? data.email.toString().toLowerCase().trim()
          : `${stfClean.toLowerCase()}@vidyaloop.local`;

        await prisma.user.create({
          data: {
            name: data.name,
            email,
            username,
            passwordHash: await authService.hashPassword(tempPassword),
            role: "teacher",
            schoolId,
            staffId: staffObj.id,
            isActive: data.status !== "Inactive",
            mustChangePassword: true,
          },
        });

        teacherAccount = { username, email, password: tempPassword };
      }

      created.push({
        staff: staffObj,
        teacherAccount,
      });
    } catch (err) {
      errors.push({ row: rowNum, staffId: stfClean, message: err.message || "Failed to create staff record" });
    }
  }

  return {
    totalRequested: staffMembers.length,
    successCount: created.length,
    errorCount: errors.length,
    created,
    errors,
  };
}

async function updateStaff({ user, id, data }) {
  const existing = await prisma.staff.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Staff member not found");
  if (user.schoolId && existing.schoolId !== user.schoolId) {
    throw new ApiError(403, "Staff member does not belong to your school");
  }
  const staff = await prisma.staff.update({ where: { id }, data });

  // Sync user account active status
  if (data.status) {
    await prisma.user.updateMany({
      where: { staffId: id },
      data: { isActive: data.status === "Active" },
    });
  }

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
  bulkCreateStaff,
  updateStaff,
  deleteStaff,
  resetStaffPassword,
};