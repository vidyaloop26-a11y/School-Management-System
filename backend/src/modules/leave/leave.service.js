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
  const where = {
    ...(schoolId ? { schoolId } : {}),
    ...(query.applicantType ? { applicantType: query.applicantType } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  let records = [];
  try {
    if (prisma.leaveRequest?.findMany) {
      records = await prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
    }
  } catch (err) {
    console.warn("Leave DB query warning:", err.message);
  }

  return { records };
}

async function applyLeave({ user, data }) {
  let schoolId = await resolveSchoolScope(user, data);
  if (!schoolId) schoolId = user.schoolId || data.schoolId;
  if (!schoolId) {
    const firstSchool = await prisma.school.findFirst();
    schoolId = firstSchool ? firstSchool.id : null;
  }
  if (!schoolId) throw new ApiError(400, "School ID required");

  const start = new Date(data.startDate || Date.now());
  const end = new Date(data.endDate || Date.now());
  const diffTime = Math.abs(end - start);
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  if (prisma.leaveRequest?.create) {
    const req = await prisma.leaveRequest.create({
      data: {
        schoolId,
        applicantType: data.applicantType || (user.role === "parent" || user.role === "student" ? "STUDENT" : "STAFF"),
        applicantId: data.applicantId || user.id || "app-user",
        applicantName: data.applicantName || user.name || "Applicant",
        roleOrClass: data.roleOrClass || user.role || "Staff",
        leaveType: data.leaveType || "Casual",
        startDate: start,
        endDate: end,
        totalDays: diffDays,
        reason: data.reason || "Personal work",
        status: "PENDING",
      },
    });
    return req;
  }

  throw new ApiError(500, "Database unavailable");
}

async function updateStatus({ user, id, data }) {
  if (prisma.leaveRequest?.update) {
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

  return { id, status: data.status, actionBy: user.name };
}

module.exports = {
  listLeaves,
  applyLeave,
  updateStatus,
  resolveSchoolScope,
};
