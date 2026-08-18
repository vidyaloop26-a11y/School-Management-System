const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");

async function resolveSchoolScope(user, query = {}) {
  if (user.role === "superAdmin") {
    if (!query.schoolId || query.schoolId === "all") return null;
    const cleanId = String(query.schoolId).replace(/^"|"$/g, "").trim();
    if (!cleanId || cleanId === "all") return null;
    const school = await prisma.school.findFirst({
      where: { OR: [{ id: cleanId }, { code: cleanId }] },
      select: { id: true },
    });
    return school ? school.id : cleanId;
  }
  return user.schoolId;
}

async function listNotices({ user, query }) {
  const schoolId = await resolveSchoolScope(user, query);
  const where = {
    ...(schoolId ? { schoolId } : {}),
  };

  // Always include school-wide "all" notices. Class-scoped notices are
  // included only when an explicit class+section query is provided.
  if (query.cls && query.section) {
    where.OR = [
      { audience: "all" },
      { audience: "class", cls: query.cls, section: query.section },
    ];
  } else {
    where.audience = "all";
  }

  const notices = await prisma.notice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });

  return { notices };
}

async function createNotice({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  if (data.audience !== "class") {
    data.cls = null;
    data.section = null;
  }

  return prisma.notice.create({
    data: {
      schoolId,
      title: data.title,
      body: data.body,
      audience: data.audience,
      cls: data.cls || null,
      section: data.section || null,
      createdById: user.id,
    },
    include: { createdBy: { select: { name: true } } },
  });
}

async function getNotice({ user, id }) {
  const notice = await prisma.notice.findUnique({
    where: { id },
    include: { createdBy: { select: { name: true } } },
  });
  if (!notice) throw new ApiError(404, "Notice not found");

  if (user.schoolId && notice.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied to other school's notice");
  }

  return notice;
}

async function updateNotice({ user, id, data }) {
  const existing = await getNotice({ user, id });

  if (data.audience === "all") {
    data.cls = null;
    data.section = null;
  }

  return prisma.notice.update({
    where: { id },
    data: {
      ...("title" in data && { title: data.title }),
      ...("body" in data && { body: data.body }),
      ...("audience" in data && { audience: data.audience }),
      ...("cls" in data && { cls: data.cls || null }),
      ...("section" in data && { section: data.section || null }),
    },
    include: { createdBy: { select: { name: true } } },
  });
}

async function deleteNotice({ user, id }) {
  const existing = await getNotice({ user, id });
  return prisma.notice.delete({ where: { id } });
}

module.exports = {
  listNotices,
  createNotice,
  getNotice,
  updateNotice,
  deleteNotice,
  resolveSchoolScope,
};
