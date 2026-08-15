const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");
const authService = require("../auth/auth.service");
const { generateUsername, ensureUniqueEmail } = require("../../utils/credentials");

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
        role: "teacher",
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
      },
      update: {
        name: s.name,
        jobTitle: s.jobTitle,
        dept: s.dept,
        subject: s.subject,
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
            role: "teacher",
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
    include: { user: true },
  });
  if (!existing) throw new ApiError(404, "Staff member not found");
  if (user.schoolId && existing.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  if (data.staffId && data.staffId.trim().toUpperCase() !== existing.staffId) {
    const cleanStaffId = data.staffId.trim().toUpperCase();
    const duplicate = await prisma.staff.findFirst({
      where: { schoolId: existing.schoolId, staffId: cleanStaffId, NOT: { id } },
    });
    if (duplicate) {
      throw new ApiError(409, `A staff member with Staff ID '${cleanStaffId}' already exists in this school.`);
    }
    data.staffId = cleanStaffId;
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