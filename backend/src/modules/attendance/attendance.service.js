const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");
const { ROLES } = require("../../middleware/rbac");

const toUtcDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const toDateKey = (date) => date.toISOString().slice(0, 10);

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

async function listByClass({ user, cls, section, date, query = {} }) {
  const schoolId = await resolveSchoolScope(user, query);
  if (!schoolId) throw new ApiError(403, "No school scope found");

  const students = await prisma.student.findMany({
    where: { schoolId, cls, section, status: "Active" },
    orderBy: { roll: "asc" },
    select: { id: true, admNo: true, name: true, roll: true },
  });

  let records = [];
  if (date) {
    records = await prisma.attendanceRecord.findMany({
      where: { schoolId, cls, section, date: toUtcDate(date) },
    });
  }

  const map = new Map(records.map((r) => [r.studentId, r.status]));
  const roster = students.map((s) => ({
    studentId: s.id,
    admNo: s.admNo,
    name: s.name,
    roll: s.roll,
    status: map.get(s.id) || "P",
  }));

  return { date, cls, section, roster };
}

async function markClassAttendance({ user, data }) {
  const schoolId = user.schoolId || data.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  // Class-teacher scoping: only the teacher appointed to this class/section may mark.
  if (user.role === ROLES.TEACHER && user.staffId) {
    const staff = await prisma.staff.findUnique({
      where: { id: user.staffId },
      select: { assignedClass: true, assignedSection: true },
    });
    if (!staff || staff.assignedClass !== data.cls || staff.assignedSection !== data.section) {
      throw new ApiError(403, "Only the appointed class teacher may mark attendance for this class");
    }
  }

  const dateObj = toUtcDate(data.date);

  let marks = data.attendance || data.marks || null;
  if (!marks || marks.length === 0) {
    const activeStudents = await prisma.student.findMany({
      where: { schoolId, cls: data.cls, section: data.section, status: "Active" },
      select: { id: true },
    });
    marks = activeStudents.map((s) => ({ studentId: s.id, status: "P" }));
  }

  await prisma.$transaction(
    marks.map((a) =>
      prisma.attendanceRecord.upsert({
        where: { studentId_date: { studentId: a.studentId, date: dateObj } },
        create: {
          schoolId,
          studentId: a.studentId,
          cls: data.cls,
          section: data.section,
          date: dateObj,
          status: a.status,
          markedById: user.id,
        },
        update: {
          status: a.status,
          markedById: user.id,
        },
      })
    )
  );

  return { success: true, count: marks.length };
}

async function studentSummary({ user, studentId, month, year }) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new ApiError(404, "Student not found");

  // Parent isolation: a parent can ONLY view their own child's attendance.
  if (user && user.role === "parent") {
    if (student.id !== user.studentId) {
      throw new ApiError(403, "Access denied. Parents can only view their own child.");
    }
  } else if (user && user.role !== "superAdmin" && student.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied to other school's student attendance");
  }

  const where = { studentId };

  if (month && year) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
    where.date = { gte: startDate, lte: endDate };
  }

  const records = await prisma.attendanceRecord.findMany({
    where,
    orderBy: { date: "asc" },
  });

  const present = records.filter((r) => r.status === "P").length;
  const absent = records.filter((r) => r.status === "A").length;
  const late = records.filter((r) => r.status === "L").length;
  const holiday = records.filter((r) => r.status === "H").length;
  const total = records.length;
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100 * 100) / 100 : 100;

  return {
    student: {
      id: student.id,
      admNo: student.admNo,
      name: student.name,
      cls: student.cls,
      section: student.section,
    },
    summary: {
      total,
      present,
      absent,
      late,
      holiday,
      percentage,
      percent: percentage,
    },
    records,
  };
}

async function auditMarkers({ user, query }) {
  const schoolId = await resolveSchoolScope(user, query);
  if (!schoolId) throw new ApiError(403, "No school scope found");

  const { cls, section, date } = query;
  const where = { schoolId, ...(cls ? { cls } : {}), ...(section ? { section } : {}) };
  if (date) where.date = toUtcDate(date);

  const grouped = await prisma.attendanceRecord.groupBy({
    by: ["markedById"],
    where,
    _count: { _all: true },
  });

  const markers = await Promise.all(
    grouped.map(async (g) => {
      const teacher = g.markedById
        ? await prisma.user.findUnique({ where: { id: g.markedById }, select: { name: true, email: true } })
        : null;
      return {
        markedById: g.markedById,
        teacher: teacher ? { name: teacher.name, email: teacher.email } : null,
        recordsMarked: g._count._all,
      };
    })
  );

  const latest = await prisma.attendanceRecord.findFirst({
    where,
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, markedById: true },
  });

  return { cls, section, date: date || null, markers, lastMarked: latest };
}

async function clearDayAttendance({ user, query }) {
  const schoolId = await resolveSchoolScope(user, query);
  if (!schoolId) throw new ApiError(403, "No school scope found");

  const { cls, section, date } = query;
  if (!cls || !section || !date) {
    throw new ApiError(400, "Class, section and date are required to clear a day's attendance");
  }

  const result = await prisma.attendanceRecord.deleteMany({
    where: { schoolId, cls, section, date: toUtcDate(date) },
  });

  return { success: true, deleted: result.count };
}

module.exports = {
  toUtcDate,
  toDateKey,
  listByClass,
  markClassAttendance,
  studentSummary,
  resolveSchoolScope,
  auditMarkers,
  clearDayAttendance,
};