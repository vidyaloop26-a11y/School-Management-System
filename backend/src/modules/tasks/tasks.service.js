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

async function getTasks(user, filters = {}) {
  const schoolId = await resolveSchoolScope(user, filters);
  if (!schoolId) return [];

  const where = { schoolId };
  if (filters.status) where.status = filters.status;
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.priority) where.priority = filters.priority;
  if (filters.category) where.category = filters.category;

  return prisma.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
}

async function getTaskById(id, user) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new ApiError(404, "Task not found");
  if (user.schoolId && task.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return task;
}

async function createTask({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  return prisma.task.create({
    data: {
      schoolId,
      title: data.title,
      description: data.description,
      assigneeId: data.assigneeId || null,
      assigneeName: data.assigneeName || null,
      assignedById: user.id || null,
      assignedByName: user.name || null,
      dueDate: data.dueDate || null,
      priority: data.priority || "MEDIUM",
      status: "PENDING",
      category: data.category || null,
      checklist: data.checklist || null,
    },
  });
}

async function updateTask({ id, data, user }) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new ApiError(404, "Task not found");
  if (user.schoolId && task.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  const updateData = { ...data };
  if (data.status === "COMPLETED" && !task.completedDate) {
    updateData.completedDate = new Date();
  }

  return prisma.task.update({ where: { id }, data: updateData });
}

async function deleteTask({ id, user }) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new ApiError(404, "Task not found");
  if (user.schoolId && task.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return prisma.task.delete({ where: { id } });
}

module.exports = {
  resolveSchoolScope,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
