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

async function listHomework({ user, query = {} }) {
  const schoolId = await resolveSchoolScope(user, query);
  if (!schoolId) return [];

  const where = { schoolId };
  if (query.cls) where.cls = query.cls;
  if (query.section) where.section = query.section;
  if (query.subject) where.subject = query.subject;
  if (query.from || query.to) {
    where.dueDate = {};
    if (query.from) where.dueDate.gte = new Date(query.from);
    if (query.to) where.dueDate.lte = new Date(query.to);
  }

  const items = await prisma.homework.findMany({
    where,
    orderBy: { dueDate: "asc" },
    include: { submissions: true },
  });

  return items.map((h) => ({
    ...h,
    submissions: undefined,
    submissionCount: h.submissions.length,
    submittedCount: h.submissions.filter((s) => s.status === "Submitted").length,
  }));
}

async function createHomework({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const homework = await prisma.homework.create({
    data: {
      schoolId,
      cls: data.cls,
      section: data.section,
      subject: data.subject,
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate,
      assignedById: user.id,
      assignedByName: user.name || "Teacher",
    },
  });

  await createSubmissionsForClass(schoolId, data.cls, data.section, homework.id);
  return homework;
}

async function createSubmissionsForClass(schoolId, cls, section, homeworkId) {
  try {
    const students = await prisma.student.findMany({
      where: { schoolId, cls, section, status: "Active" },
      select: { id: true, name: true },
    });
    if (students.length === 0) return;
    await prisma.homeworkSubmission.createMany({
      data: students.map((s) => ({
        homeworkId,
        studentId: s.id,
        studentName: s.name,
        status: "Pending",
      })),
    });
  } catch (err) {
    console.warn("Homework submission pre-creation skipped:", err.message);
  }
}

async function updateHomework({ id, data, user }) {
  const homework = await prisma.homework.findUnique({ where: { id } });
  if (!homework) throw new ApiError(404, "Homework not found");
  if (user.schoolId && homework.schoolId !== user.schoolId) throw new ApiError(403, "Access denied");

  return prisma.homework.update({
    where: { id },
    data: {
      ...(data.title ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.dueDate ? { dueDate: data.dueDate } : {}),
      ...(data.subject ? { subject: data.subject } : {}),
    },
  });
}

async function deleteHomework({ id, user }) {
  const homework = await prisma.homework.findUnique({ where: { id } });
  if (!homework) throw new ApiError(404, "Homework not found");
  if (user.schoolId && homework.schoolId !== user.schoolId) throw new ApiError(403, "Access denied");

  await prisma.homeworkSubmission.deleteMany({ where: { homeworkId: id } });
  return prisma.homework.delete({ where: { id } });
}

async function submitHomework({ id, data, user }) {
  const homework = await prisma.homework.findUnique({ where: { id } });
  if (!homework) throw new ApiError(404, "Homework not found");
  if (user.schoolId && homework.schoolId !== user.schoolId) throw new ApiError(403, "Access denied");

  const student = await prisma.student.findUnique({ where: { id: data.studentId } });
  if (!student) throw new ApiError(404, "Student not found");

  return prisma.homeworkSubmission.upsert({
    where: {
      homeworkId_studentId: { homeworkId: homework.id, studentId: student.id },
    },
    update: {
      status: data.status || "Submitted",
      submittedAt: new Date(),
      notes: data.notes || null,
    },
    create: {
      homeworkId: homework.id,
      studentId: student.id,
      studentName: student.name,
      status: data.status || "Submitted",
      submittedAt: new Date(),
      notes: data.notes || null,
    },
  });
}

async function getSubmissions(homeworkId, user) {
  const homework = await prisma.homework.findUnique({ where: { id: homeworkId } });
  if (!homework) throw new ApiError(404, "Homework not found");
  if (user.schoolId && homework.schoolId !== user.schoolId) throw new ApiError(403, "Access denied");

  return prisma.homeworkSubmission.findMany({
    where: { homeworkId },
    orderBy: { studentName: "asc" },
  });
}

module.exports = {
  resolveSchoolScope,
  listHomework,
  createHomework,
  updateHomework,
  deleteHomework,
  submitHomework,
  getSubmissions,
};
