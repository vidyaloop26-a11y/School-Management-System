const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");

async function resolveSchoolScope(user, query = {}) {
  if (user.role === "superAdmin") {
    if (!query.schoolId || query.schoolId === "all") return null;
    const cleanId = String(query.schoolId).replace(/^"|"$/g, "").trim();
    const school = await prisma.school.findFirst({
      where: { OR: [{ id: cleanId }, { code: cleanId }] },
      select: { id: true },
    });
    return school ? school.id : cleanId;
  }
  return user.schoolId;
}

async function listEntries({ user, query = {} }) {
  const schoolId = await resolveSchoolScope(user, query);
  if (!schoolId) return [];

  const where = { schoolId };
  if (query.cls) where.cls = query.cls;
  if (query.section) where.section = query.section;
  if (query.subject) where.subject = query.subject;
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) where.createdAt.lte = new Date(query.to);
  }

  return prisma.diaryEntry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

async function createEntry({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  return prisma.diaryEntry.create({
    data: {
      schoolId,
      cls: data.cls,
      section: data.section,
      subject: data.subject,
      note: data.note,
      homework: data.homework || null,
      authorId: user.id,
      authorName: user.name || "Teacher",
    },
  });
}

module.exports = {
  resolveSchoolScope,
  listEntries,
  createEntry,
};
