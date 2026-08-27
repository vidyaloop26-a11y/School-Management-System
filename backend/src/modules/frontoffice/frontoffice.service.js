const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");

async function resolveSchoolScope(user, query = {}) {
  if (user.role === "superAdmin") {
    if (!query.schoolId || query.schoolId === "all") {
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      return firstSchool ? firstSchool.id : null;
    }
    const cleanId = String(query.schoolId).replace(/^"|"$/g, "").trim();
    const school = await prisma.school.findFirst({
      where: { OR: [{ id: cleanId }, { code: cleanId }] },
      select: { id: true },
    });
    return school ? school.id : cleanId;
  }
  return user.schoolId;
}

async function getVisitors(user, filters = {}) {
  const schoolId = await resolveSchoolScope(user, filters);
  if (!schoolId) return [];

  const where = { schoolId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.date) {
    const start = new Date(filters.date);
    const end = new Date(filters.date);
    end.setDate(end.getDate() + 1);
    where.checkInTime = { gte: start, lt: end };
  }

  return prisma.visitor.findMany({
    where,
    orderBy: { checkInTime: "desc" },
  });
}

async function checkIn({ user, data }) {
  const schoolId = await resolveSchoolScope(user);
  if (!schoolId) throw new ApiError(400, "School ID required");

  return prisma.visitor.create({
    data: {
      schoolId,
      name: data.name,
      phone: data.phone,
      purpose: data.purpose,
      hostStaffId: data.hostStaffId || null,
      hostStaffName: data.hostStaffName || null,
      studentId: data.studentId || null,
      studentName: data.studentName || null,
    },
  });
}

async function checkOut({ id, user }) {
  const visitor = await prisma.visitor.findUnique({ where: { id } });
  if (!visitor) throw new ApiError(404, "Visitor not found");
  if (user.schoolId && visitor.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  if (visitor.status === "CHECKED_OUT") {
    throw new ApiError(400, "Visitor already checked out");
  }

  return prisma.visitor.update({
    where: { id },
    data: { checkOutTime: new Date(), status: "CHECKED_OUT" },
  });
}

async function createGatePass({ user, data }) {
  const schoolId = await resolveSchoolScope(user);
  if (!schoolId) throw new ApiError(400, "School ID required");

  const visitor = await prisma.visitor.findUnique({ where: { id: data.visitorId } });
  if (!visitor) throw new ApiError(404, "Visitor not found");
  if (visitor.schoolId !== schoolId) {
    throw new ApiError(403, "Visitor belongs to a different school");
  }

  const gatePass = await prisma.gatePass.create({
    data: {
      schoolId,
      visitorId: data.visitorId,
      studentId: data.studentId || null,
      studentName: data.studentName || null,
      issuedBy: user.name || user.id,
      purpose: data.purpose || null,
    },
  });

  await prisma.visitor.update({
    where: { id: data.visitorId },
    data: { gatePassId: gatePass.id },
  });

  return gatePass;
}

async function getGatePasses(user, filters = {}) {
  const schoolId = await resolveSchoolScope(user, filters);
  if (!schoolId) return [];

  return prisma.gatePass.findMany({
    where: { schoolId },
    orderBy: { issuedAt: "desc" },
    include: { visitor: { select: { id: true, name: true, phone: true, purpose: true } } },
  });
}

async function getHostMappings(user) {
  const schoolId = await resolveSchoolScope(user);
  if (!schoolId) return [];

  return prisma.hostMapping.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
  });
}

async function createHostMapping({ user, data }) {
  const schoolId = await resolveSchoolScope(user);
  if (!schoolId) throw new ApiError(400, "School ID required");

  return prisma.hostMapping.create({
    data: {
      schoolId,
      visitType: data.visitType,
      notifyStaffId: data.notifyStaffId,
    },
  });
}

async function deleteHostMapping({ id, user }) {
  const mapping = await prisma.hostMapping.findUnique({ where: { id } });
  if (!mapping) throw new ApiError(404, "Host mapping not found");
  if (user.schoolId && mapping.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return prisma.hostMapping.delete({ where: { id } });
}

module.exports = {
  resolveSchoolScope,
  getVisitors,
  checkIn,
  checkOut,
  createGatePass,
  getGatePasses,
  getHostMappings,
  createHostMapping,
  deleteHostMapping,
};
