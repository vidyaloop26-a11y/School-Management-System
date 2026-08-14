const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");

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

  const dateObj = toUtcDate(data.date);

  await prisma.$transaction(
    data.attendance.map((a) =>
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

  return { success: true, count: data.attendance.length };
}

async function studentSummary({ studentId, month, year }) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new ApiError(404, "Student not found");

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
    },
    records,
  };
}

module.exports = {
  toUtcDate,
  toDateKey,
  listByClass,
  markClassAttendance,
  studentSummary,
  resolveSchoolScope,
};