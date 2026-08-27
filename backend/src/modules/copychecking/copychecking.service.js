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

async function getBatches(user, filters = {}) {
  const schoolId = await resolveSchoolScope(user, filters);
  if (!schoolId) return [];

  const where = { schoolId };
  if (filters.cls) where.cls = filters.cls;
  if (filters.section) where.section = filters.section;
  if (filters.subject) where.subject = filters.subject;
  if (filters.status) where.status = filters.status;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;

  return prisma.copyCheckBatch.findMany({
    where,
    include: { entries: true },
    orderBy: { createdAt: "desc" },
  });
}

async function getBatchById(id, user) {
  const batch = await prisma.copyCheckBatch.findUnique({
    where: { id },
    include: { entries: true },
  });
  if (!batch) throw new ApiError(404, "Copy check batch not found");
  if (user.schoolId && batch.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return batch;
}

async function createBatch({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  return prisma.copyCheckBatch.create({
    data: {
      schoolId,
      subject: data.subject,
      cls: data.cls,
      section: data.section,
      term: data.term,
      totalCopies: data.totalCopies,
      assignedToId: data.assignedToId || null,
      assignedToName: data.assignedToName || null,
      dueDate: data.dueDate || null,
      status: "NOT_STARTED",
      completedCount: 0,
    },
  });
}

async function addEntry({ batchId, data, user }) {
  const batch = await prisma.copyCheckBatch.findUnique({ where: { id: batchId } });
  if (!batch) throw new ApiError(404, "Copy check batch not found");
  if (user.schoolId && batch.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  const entry = await prisma.copyCheckEntry.create({
    data: {
      batchId,
      studentId: data.studentId,
      studentName: data.studentName || null,
      marks: data.marks ?? null,
      maxMarks: data.maxMarks || 100,
      checkedAt: data.marks != null ? new Date() : null,
    },
  });

  await recalcBatch(batchId);
  return entry;
}

async function updateEntry({ entryId, data, user }) {
  const entry = await prisma.copyCheckEntry.findUnique({ where: { id: entryId }, include: { batch: true } });
  if (!entry) throw new ApiError(404, "Entry not found");
  if (user.schoolId && entry.batch.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  const updated = await prisma.copyCheckEntry.update({
    where: { id: entryId },
    data: {
      marks: data.marks ?? entry.marks,
      maxMarks: data.maxMarks ?? entry.maxMarks,
      checkedAt: data.marks != null ? new Date() : entry.checkedAt,
    },
  });

  await recalcBatch(entry.batchId);
  return updated;
}

async function recalcBatch(batchId) {
  const batch = await prisma.copyCheckBatch.findUnique({ where: { id: batchId } });
  if (!batch) return;

  const completedCount = await prisma.copyCheckEntry.count({
    where: { batchId, marks: { not: null } },
  });

  const totalEntries = await prisma.copyCheckEntry.count({ where: { batchId } });

  let status = "NOT_STARTED";
  if (completedCount > 0 && completedCount < batch.totalCopies) {
    status = "IN_PROGRESS";
  } else if (completedCount >= batch.totalCopies || (totalEntries > 0 && completedCount === totalEntries && completedCount >= batch.totalCopies)) {
    status = "COMPLETED";
  }

  await prisma.copyCheckBatch.update({
    where: { id: batchId },
    data: { completedCount, status },
  });
}

async function deleteBatch({ id, user }) {
  const batch = await prisma.copyCheckBatch.findUnique({ where: { id } });
  if (!batch) throw new ApiError(404, "Copy check batch not found");
  if (user.schoolId && batch.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  await prisma.copyCheckEntry.deleteMany({ where: { batchId: id } });
  return prisma.copyCheckBatch.delete({ where: { id } });
}

module.exports = {
  resolveSchoolScope,
  getBatches,
  getBatchById,
  createBatch,
  addEntry,
  updateEntry,
  deleteBatch,
};
