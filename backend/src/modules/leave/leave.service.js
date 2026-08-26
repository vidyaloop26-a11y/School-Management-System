const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");

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

async function listLeaves({ user, query = {} }) {
  const schoolId = await resolveSchoolScope(user, query);
  if (!schoolId && user.role !== "superAdmin") {
    throw new ApiError(400, "School ID required");
  }

  // Parents may only ever see their own applications.
  const where = {
    ...(schoolId ? { schoolId } : {}),
    ...(user.role === "parent" ? { applicantId: user.id } : {}),
    ...(query.applicantType ? { applicantType: query.applicantType } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const records = await prisma.leaveRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return { records };
}

function countInclusiveDays(start, end) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const s = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const e = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.floor((e - s) / msPerDay) + 1;
}

async function applyLeave({ user, data }) {
  let schoolId = await resolveSchoolScope(user, data);
  if (!schoolId) schoolId = user.schoolId || data.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const start = new Date(data.startDate || Date.now());
  const end = new Date(data.endDate || Date.now());
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError(400, "startDate/endDate must be valid dates");
  }
  if (end < start) throw new ApiError(400, "endDate cannot be before startDate");

  const totalDays = Math.max(1, countInclusiveDays(start, end));

  const req = await prisma.leaveRequest.create({
    data: {
      schoolId,
      applicantType: data.applicantType || (user.role === "parent" ? "STUDENT" : "STAFF"),
      applicantId: data.applicantId || user.id,
      applicantName: data.applicantName || user.name || "Applicant",
      roleOrClass: data.roleOrClass || user.role || "Staff",
      leaveType: data.leaveType || "Casual",
      startDate: start,
      endDate: end,
      totalDays,
      reason: data.reason || "Personal work",
      status: "PENDING",
    },
  });
  return req;
}

async function updateStatus({ user, id, data }) {
  if (!["APPROVED", "REJECTED"].includes(data.status)) {
    throw new ApiError(400, "status must be APPROVED or REJECTED");
  }

  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Leave request not found");

  // Record-level tenancy check: admins may only act within their own school.
  if (user.role !== "superAdmin" && existing.schoolId !== user.schoolId) {
    throw new ApiError(403, "Leave request belongs to a different school");
  }
  if (existing.status !== "PENDING") {
    throw new ApiError(409, `Leave request is already ${existing.status}`);
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: data.status,
      actionBy: user.name || "School Admin",
      actionComment: data.comment || null,
    },
  });
  return updated;
}

module.exports = {
  listLeaves,
  applyLeave,
  updateStatus,
  resolveSchoolScope,
};
