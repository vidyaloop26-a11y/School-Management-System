const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");
const authService = require("../auth/auth.service");
const { generateUsername, ensureUniqueEmail, generateTempPassword } = require("../../utils/credentials");

async function resolveSchoolScope(user, query = {}) {
  const scopeInput = (user.role === "superAdmin")
    ? (query.schoolId !== "all" ? query.schoolId : null)
    : (user.schoolId || (query.schoolId !== "all" ? query.schoolId : null));

  if (!scopeInput || scopeInput === "all") return null;
  const cleanId = String(scopeInput).replace(/^"|"$/g, "").trim();
  if (!cleanId || cleanId === "all") return null;

  try {
    const school = await prisma.school.findFirst({
      where: { OR: [{ id: cleanId }, { code: cleanId }] },
      select: { id: true },
    });
    return school ? school.id : cleanId;
  } catch (e) {
    return cleanId;
  }
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

  const cleanStaffId = data.staffId.trim().toUpperCase();

  // Prevent duplicate staff ID within the same school
  const existingStaff = await prisma.staff.findFirst({
    where: { schoolId, staffId: cleanStaffId },
  });
  if (existingStaff) {
    throw new ApiError(409, `A staff member with Staff ID '${cleanStaffId}' already exists in this school.`);
  }

  const staff = await prisma.staff.create({
    data: {
      schoolId,
      staffId: cleanStaffId,
      name: data.name,
      jobTitle: data.jobTitle,
      dept: data.dept,
      subject: data.subject,
      qualification: data.qualification,
      email: data.email,
      phone: data.phone,
      assignedClass: data.assignedClass || null,
      assignedSection: data.assignedSection || null,
      status: data.status || "Active",
      joined: data.joined,
      salary: typeof data.salary === "number" ? data.salary : null,
    },
  });

  const isTeacher = data.jobTitle === "Teacher" || data.role === "teacher" || data.jobTitle?.includes("Teacher");
  if (isTeacher) {
    const tempPassword = `${cleanStaffId}@1234`;
    const username = await generateUsername(cleanStaffId, prisma);
    const emailBase = data.email?.toLowerCase().trim() || `${cleanStaffId.toLowerCase()}@vidyaloop.local`;
    const email = await ensureUniqueEmail(emailBase, prisma);

    const teacherUser = await prisma.user.create({
      data: {
        name: data.name,
        email,
        username,
        passwordHash: await authService.hashPassword(tempPassword),
        role: "staff",
        duties: Array.isArray(data.duties) && data.duties.length ? data.duties : ["teacher"],
        schoolId,
        staffId: staff.id,
        mustChangePassword: true,
      },
    });

    return {
      staff,
      credentials: {
        name: data.name,
        staffId: cleanStaffId,
        username: teacherUser.username,
        email: teacherUser.email,
        password: tempPassword,
        assignedClass: data.assignedClass,
        assignedSection: data.assignedSection,
      },
    };
  }

  return { staff };
}

async function bulkCreateStaff({ user, staff }) {
  const schoolId = user.schoolId;
  let count = 0;
  const createdCredentials = [];
  const processedStaffIds = new Set();

  for (const s of staff) {
    const targetSchoolId = schoolId || s.schoolId;
    if (!targetSchoolId || !s.staffId) continue;

    const cleanStaffId = s.staffId.trim().toUpperCase();

    if (processedStaffIds.has(cleanStaffId)) continue;
    processedStaffIds.add(cleanStaffId);

    const staffObj = await prisma.staff.upsert({
      where: { schoolId_staffId: { schoolId: targetSchoolId, staffId: cleanStaffId } },
      create: {
        schoolId: targetSchoolId,
        staffId: cleanStaffId,
        name: s.name,
        jobTitle: s.jobTitle,
        dept: s.dept,
        subject: s.subject,
        qualification: s.qualification,
        email: s.email,
        phone: s.phone,
        assignedClass: s.assignedClass || s.cls || null,
        assignedSection: s.assignedSection || s.section || null,
        status: s.status || "Active",
        joined: s.joined,
        salary: typeof s.salary === "number" ? s.salary : null,
      },
      update: {
        name: s.name,
        jobTitle: s.jobTitle,
        dept: s.dept,
        subject: s.subject,
        ...(typeof s.salary === "number" ? { salary: s.salary } : {}),
        assignedClass: s.assignedClass || s.cls || undefined,
        assignedSection: s.assignedSection || s.section || undefined,
      },
    });
    count++;

    const isTeacher = s.jobTitle === "Teacher" || s.role === "teacher" || s.jobTitle?.includes("Teacher");
    if (isTeacher) {
      const existingLinkedUser = await prisma.user.findFirst({
        where: { staffId: staffObj.id },
      });

      if (!existingLinkedUser) {
        const tempPassword = `${cleanStaffId}@1234`;
        const username = await generateUsername(cleanStaffId, prisma);
        const emailBase = s.email?.toLowerCase().trim() || `${cleanStaffId.toLowerCase()}@vidyaloop.local`;
        const email = await ensureUniqueEmail(emailBase, prisma);

        await prisma.user.create({
          data: {
            name: s.name,
            email,
            username,
            passwordHash: await authService.hashPassword(tempPassword),
            role: "staff",
            duties: Array.isArray(s.duties) && s.duties.length ? s.duties : ["teacher"],
            schoolId: targetSchoolId,
            staffId: staffObj.id,
            mustChangePassword: true,
          },
        });

        createdCredentials.push({
          staffId: cleanStaffId,
          name: s.name,
          username,
          email,
          password: tempPassword,
        });
      } else {
        createdCredentials.push({
          staffId: cleanStaffId,
          name: s.name,
          username: existingLinkedUser.username,
          email: existingLinkedUser.email,
          password: `${cleanStaffId}@1234`,
        });
      }
    }
  }

  return { successCount: count, credentials: createdCredentials };
}

async function updateStaff({ user, id, data }) {
  const existing = await prisma.staff.findUnique({
    where: { id },
    include: { users: true },
  });
  if (!existing) throw new ApiError(404, "Staff member not found");
  if (user.schoolId && existing.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  // `duties` lives on the linked User, not the Staff record.
  const { duties, ...staffFields } = data;

  if (staffFields.staffId && staffFields.staffId.trim().toUpperCase() !== existing.staffId) {
    const cleanStaffId = staffFields.staffId.trim().toUpperCase();
    const duplicate = await prisma.staff.findFirst({
      where: { schoolId: existing.schoolId, staffId: cleanStaffId, NOT: { id } },
    });
    if (duplicate) {
      throw new ApiError(409, `A staff member with Staff ID '${cleanStaffId}' already exists in this school.`);
    }
    staffFields.staffId = cleanStaffId;
  }

  const updatedStaff = await prisma.staff.update({
    where: { id },
    data: staffFields,
  });

  if (existing.users.length > 0) {
    const userUpdate = {};
    if (staffFields.status) {
      userUpdate.isActive = staffFields.status === "Active";
    }
    if (Array.isArray(duties)) {
      userUpdate.duties = duties;
    }
    if (Object.keys(userUpdate).length) {
      for (const u of existing.users) {
        await prisma.user.update({
          where: { id: u.id },
          data: userUpdate,
        });
      }
    }
  }

  return updatedStaff;
}

// Archive, never hard-delete: a departed staff member's historical payroll,
// timetable and attendance references must keep resolving. We flip status,
// revoke their login and kill their sessions; records stay intact.
async function deleteStaff({ user, id }) {
  const staff = await prisma.staff.findUnique({
    where: { id },
    include: { users: true },
  });
  if (!staff) throw new ApiError(404, "Staff member not found");
  if (user.schoolId && staff.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  if (staff.users.length > 0) {
    for (const u of staff.users) {
      await prisma.user.update({
        where: { id: u.id },
        data: { isActive: false },
      });
      await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
    }
  }

  const archived = await prisma.staff.update({
    where: { id },
    data: { status: "Inactive" },
  });

  return { archived: true, staff: archived };
}

// Regenerate a temporary password for the staff member's login.
// They must change it on next sign-in (mustChangePassword is set).
async function resetStaffPassword({ user, id, newPassword }) {
  const staff = await prisma.staff.findUnique({
    where: { id },
    include: { users: true },
  });
  if (!staff) throw new ApiError(404, "Staff member not found");
  if (user.schoolId && staff.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  let account = staff.users[0] || null;
  if (!account) {
    // Provision a login on the fly for a staff member who never had one
    // (e.g. non-teaching staff imported before accounts existed).
    const tempPassword = newPassword || generateTempPassword();
    const username = await generateUsername(staff.staffId.toLowerCase(), prisma);
    const emailBase = staff.email?.toLowerCase().trim() || `${staff.staffId.toLowerCase()}@vidyaloop.local`;
    const email = await ensureUniqueEmail(emailBase, prisma);
    account = await prisma.user.create({
      data: {
        name: staff.name,
        email,
        username,
        passwordHash: await authService.hashPassword(tempPassword),
        role: "staff",
        duties: [],
        schoolId: staff.schoolId,
        staffId: staff.id,
        isActive: true,
        mustChangePassword: true,
      },
    });
    return { success: true, username: account.username, email: account.email, tempPassword, provisioned: true };
  }

  const tempPassword = newPassword || generateTempPassword();
  await prisma.user.update({
    where: { id: account.id },
    data: {
      passwordHash: await authService.hashPassword(tempPassword),
      mustChangePassword: true,
      isActive: true,
    },
  });
  // Any existing sessions die immediately.
  await prisma.refreshToken.deleteMany({ where: { userId: account.id } });

  return { success: true, username: account.username, email: account.email, tempPassword };
}

module.exports = {
  listStaff,
  getStaff,
  createStaff,
  bulkCreateStaff,
  updateStaff,
  deleteStaff,
  resetStaffPassword,
  resolveSchoolScope,
};