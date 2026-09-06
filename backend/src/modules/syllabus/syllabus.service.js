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

async function getTopics(user, filters = {}) {
  const schoolId = await resolveSchoolScope(user, filters);
  if (!schoolId) return [];

  const where = { schoolId };
  if (filters.cls) where.cls = filters.cls;
  if (filters.section) where.section = filters.section;
  if (filters.subject) where.subject = filters.subject;

  return prisma.syllabusTopic.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      progress: {
        orderBy: { completedDate: "desc" },
        select: { id: true, teacherName: true, completedDate: true, notes: true },
      },
    },
  });
}

async function createTopic({ user, data }) {
  const schoolId = user.schoolId || data.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");
  const topicName = data.topicName || data.name;

  return prisma.syllabusTopic.create({
    data: {
      schoolId,
      subject: data.subject,
      cls: data.cls,
      section: data.section,
      topicName,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
    },
  });
}

async function updateTopic({ id, data, user }) {
  const topic = await prisma.syllabusTopic.findUnique({ where: { id } });
  if (!topic) throw new ApiError(404, "Syllabus topic not found");
  if (user.schoolId && topic.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  const updateData = {};
  if (data.status) updateData.status = data.status;
  if (data.targetDate) updateData.targetDate = new Date(data.targetDate);

  return prisma.syllabusTopic.update({ where: { id }, data: updateData });
}

async function markCompleted({ id, user, notes }) {
  const topic = await prisma.syllabusTopic.findUnique({ where: { id } });
  if (!topic) throw new ApiError(404, "Syllabus topic not found");
  if (user.schoolId && topic.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  const progress = await prisma.lessonProgress.create({
    data: {
      topicId: id,
      teacherId: user.staffId || null,
      teacherName: user.name || null,
      completedDate: new Date(),
      notes: notes || null,
    },
  });

  await prisma.syllabusTopic.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  return progress;
}

async function getPaceDashboard(user, filters = {}) {
  const schoolId = await resolveSchoolScope(user, filters);
  if (!schoolId) return [];

  const where = { schoolId };
  if (filters.cls) where.cls = filters.cls;
  if (filters.section) where.section = filters.section;
  if (filters.subject) where.subject = filters.subject;

  const topics = await prisma.syllabusTopic.findMany({
    where,
    select: { cls: true, section: true, subject: true, status: true },
  });

  const grouped = {};
  for (const t of topics) {
    const key = `${t.cls}-${t.section}`;
    if (!grouped[key]) {
      grouped[key] = { cls: t.cls, section: t.section, subjectsMap: {} };
    }
    if (!grouped[key].subjectsMap[t.subject]) {
      grouped[key].subjectsMap[t.subject] = { subject: t.subject, total: 0, completed: 0, inProgress: 0, pending: 0, behind: 0 };
    }
    const stats = grouped[key].subjectsMap[t.subject];
    stats.total++;
    if (t.status === "COMPLETED") stats.completed++;
    else if (t.status === "IN_PROGRESS") stats.inProgress++;
    else if (t.status === "PENDING") stats.pending++;
    else if (t.status === "BEHIND") stats.behind++;
  }

  return Object.values(grouped).map((g) => {
    const subjects = Object.values(g.subjectsMap).map((s) => ({
      ...s,
      percent: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
    }));
    const totalTopics = subjects.reduce((sum, s) => sum + s.total, 0);
    const completedTopics = subjects.reduce((sum, s) => sum + s.completed, 0);
    const overallPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    return {
      cls: g.cls,
      section: g.section,
      subjects,
      totalTopics,
      completedTopics,
      overallPercent,
    };
  });
}

module.exports = {
  resolveSchoolScope,
  getTopics,
  createTopic,
  updateTopic,
  markCompleted,
  getPaceDashboard,
};
