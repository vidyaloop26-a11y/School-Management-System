const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");

// Normalises a YYYY-MM-DD string to a UTC midnight Date (stable uniqueness key).
const toUtcDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const toDateKey = (date) => date.toISOString().slice(0, 10);

function resolveSchool(user, body = {}) {
  return user.role === "superAdmin" ? body.schoolId || null : user.schoolId;
}

// Roster for a class on a given date: every student in the class with their
// attendance status for that date (null = not yet marked).
async function listByClass({ user, cls, section, date }) {
  const schoolId = resolveSchool(user);
  if (user.role !== "superAdmin" && !schoolId) throw new ApiError(403, "No school scope");

  const students = await prisma.student.findMany({
    where: { schoolId, cls, section, status: "Active" },
    orderBy: { roll: "asc" },
    select: { id: true, admNo: true, name: true, roll: true },
  });

  let records = [];
  if (date) {
    records = await prisma.attendanceRecord.findMany({
      where: {
        schoolId,
        cls,
        section,
        date: toUtcDate(date),
      },
    });
  }

  const statusMap = new Map(records.map((r) => [r.studentId, r.status]));

  return {
    date: date || toDateKey(new Date()),
    classSection: `${cls}-${section}`,
    roster: students.map((s) => ({
      studentId: s.id,
      roll: s.roll,
      name: s.name,
      admNo: s.admNo,
      status: statusMap.get(s.id) || null,
    })),
  };
}

// Marks (or updates) attendance for a class on a date. School admin / teacher.
// If `marks` is omitted, every student in the class is marked Present.
async function markBulk({ user, data }) {
  const schoolId = resolveSchool(user, data);
  if (user.role !== "superAdmin" && !schoolId) throw new ApiError(403, "No school scope");
  if (!schoolId) throw new ApiError(400, "A school is required");

  const students = await prisma.student.findMany({
    where: { schoolId, cls: data.cls, section: data.section },
    select: { id: true },
  });
  if (students.length === 0) {
    throw new ApiError(404, "No students found in this class section");
  }
  const studentIds = new Set(students.map((s) => s.id));
  for (const m of data.marks || []) {
    if (!studentIds.has(m.studentId)) {
      throw new ApiError(422, "One of the students does not belong to this class section");
    }
  }

  const marks = data.marks?.length
    ? data.marks
    : students.map((s) => ({ studentId: s.id, status: "P" }));

  const date = toUtcDate(data.date);

  const ops = marks.map((m) =>
    prisma.attendanceRecord.upsert({
      where: { studentId_date: { studentId: m.studentId, date } },
      create: {
        schoolId,
        studentId: m.studentId,
        cls: data.cls,
        section: data.section,
        date,
        status: m.status,
        markedById: user.id,
      },
      update: { status: m.status, markedById: user.id },
    })
  );

  await prisma.$transaction(ops);

  const present = marks.filter((m) => m.status === "P").length;
  const absent = marks.filter((m) => m.status === "A").length;
  const late = marks.filter((m) => m.status === "L").length;

  return {
    classSection: `${data.cls}-${data.section}`,
    date: toDateKey(date),
    marked: marks.length,
    summary: { present, absent, late },
  };
}

// Month view for a student. Parents can only view their own child.
async function getStudentAttendance({ user, studentId, month, year }) {
  const now = new Date();
  const m = month || now.getUTCMonth() + 1;
  const y = year || now.getUTCFullYear();

  let student = studentId ? await prisma.student.findUnique({ where: { id: studentId } }) : null;
  if (!student && user.role === "parent") {
    student = user.studentId
      ? await prisma.student.findUnique({ where: { id: user.studentId } })
      : null;
  }
  if (!student) throw new ApiError(404, "Student not found");

  if (user.role === "parent" && user.studentId !== student.id) {
    throw new ApiError(403, "You may only view your own child");
  }
  if (user.schoolId && student.schoolId !== user.schoolId) {
    throw new ApiError(403, "Student does not belong to your school");
  }

  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  const records = await prisma.attendanceRecord.findMany({
    where: { studentId: student.id, date: { gte: start, lt: end } },
    orderBy: { date: "asc" },
  });

  // Build a full calendar, weekends marked "H", marked days P/A/L.
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const marks = {};
  let present = 0;
  let absent = 0;
  let late = 0;
  let schoolDays = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    if (weekday === 0 || weekday === 6) {
      marks[d] = "H";
      continue;
    }
    schoolDays += 1;
    const record = records.find((r) => r.date.getUTCDate() === d);
    if (record) {
      marks[d] = record.status;
      if (record.status === "P") present += 1;
      else if (record.status === "A") absent += 1;
      else if (record.status === "L") late += 1;
    } else {
      marks[d] = ""; // not marked yet
    }
  }

  const marked = present + absent + late;
  const percent = marked ? Math.round(((present + late) / marked) * 1000) / 10 : null;

  return {
    student: { id: student.id, admNo: student.admNo, name: student.name, classSection: `${student.cls}-${student.section}` },
    month: m,
    year: y,
    daysInMonth,
    schoolDays,
    marks,
    summary: { present, absent, late, marked, percent },
  };
}

module.exports = { listByClass, markBulk, getStudentAttendance, toUtcDate, toDateKey };