const prisma = require("../../lib/prisma");
const attendanceService = require("../attendance/attendance.service");
const { ROLES } = require("../../middleware/rbac");
const { toUtcDate } = require("../attendance/attendance.service");
const { ApiError } = require("../../lib/errors");

const todayKey = () => new Date().toISOString().slice(0, 10);

async function resolveSchoolScope(query = {}) {
  if (!query.schoolId || query.schoolId === "all") return null;
  const cleanId = String(query.schoolId).replace(/^"|"$/g, "").trim();
  if (!cleanId || cleanId === "all") return null;

  const school = await prisma.school.findFirst({
    where: { OR: [{ id: cleanId }, { code: cleanId }] },
    select: { id: true },
  });
  return school ? school.id : cleanId;
}

async function superAdminDashboard() {
  const schoolCount = await prisma.school.count();
  const studentCount = await prisma.student.count();
  const staffCount = await prisma.staff.count();
  // Aggregates only — never per-school private data.
  const staffAccounts = await prisma.user.count({ where: { role: "staff" } });
  const parentUserCount = await prisma.user.count({ where: { role: "parent" } });

  return {
    role: "superAdmin",
    stats: {
      schools: schoolCount,
      students: studentCount,
      staff: staffCount,
      staffAccounts,
      parentAccounts: parentUserCount,
    },
  };
}

async function schoolAdminDashboard(schoolId) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { name: true, code: true, session: true, board: true },
  });

  const studentCount = await prisma.student.count({ where: { schoolId, status: "Active" } });
  const staffCount = await prisma.staff.count({ where: { schoolId } });
  const teacherCount = await prisma.staff.count({
    where: {
      schoolId,
      jobTitle: { contains: "Teacher", mode: "insensitive" },
    },
  });

  const todayDate = toUtcDate(todayKey());

  const activeClassSections = await prisma.student.groupBy({
    by: ['cls', 'section'],
    where: { schoolId, status: "Active" },
  });
  const classCount = activeClassSections.length;

  const markedClassesGroup = await prisma.attendanceRecord.groupBy({
    by: ['cls', 'section'],
    where: { schoolId, date: todayDate },
  });
  const attendanceMarkedToday = markedClassesGroup.length;
  const attendancePending = Math.max(0, classCount - attendanceMarkedToday);

  const todayAttendance = await prisma.attendanceRecord.findMany({
    where: { schoolId, date: todayDate },
  });

  const presentCount = todayAttendance.filter((r) => r.status === "P").length;

  return {
    role: "schoolAdmin",
    school,
    stats: {
      students: studentCount,
      staff: staffCount,
      teachers: teacherCount,
      todayPresent: presentCount,
      classes: classCount,
      attendanceMarkedToday,
      attendancePending,
    },
  };
}

async function staffDashboard(user) {
  // Teaching staff see their classes; non-teaching duty holders get a
  // lightweight view until their domain dashboards exist.
  if (!user.staffId) {
    return {
      role: "staff",
      duties: user.duties || [],
      stats: { classes: 0, attendanceMarkedToday: 0 },
    };
  }

  const staff = await prisma.staff.findUnique({ where: { id: user.staffId } });
  const schoolId = user.schoolId;

  const teacherEntries = await prisma.timetableEntry.findMany({
    where: { schoolId, staffId: user.staffId },
  });

  const uniqueClasses = Array.from(
    new Set(teacherEntries.map((e) => `${e.cls}-${e.section}`))
  );

  const todayDate = toUtcDate(todayKey());
  const todayAttendance = await prisma.attendanceRecord.findMany({
    where: {
      schoolId,
      date: todayDate,
      student: {
        cls: { in: teacherEntries.map((e) => e.cls) },
      },
    },
  });

  return {
    role: "staff",
    duties: user.duties || [],
    staff,
    stats: {
      classes: uniqueClasses.length,
      classesList: uniqueClasses,
      attendanceMarkedToday: todayAttendance.length,
    },
    assignedClassesCount: uniqueClasses.length,
    assignedClasses: uniqueClasses,
    todayAttendanceMarkedCount: todayAttendance.length,
  };
}

async function parentDashboard(user) {
  const student = await prisma.student.findUnique({
    where: { id: user.studentId },
  });

  if (!student) {
    throw new ApiError(404, "Associated student record not found");
  }

  const attendance = await attendanceService.studentSummary({
    studentId: student.id,
  });

  const school = await prisma.school.findUnique({
    where: { id: student.schoolId },
    select: { name: true, session: true },
  });

  const attSummary = attendance.summary ? {
    ...attendance.summary,
    percent: attendance.summary.percentage,
  } : {};

  return {
    role: "parent",
    child: {
      id: student.id,
      admNo: student.admNo,
      name: student.name,
      classSection: `${student.cls}-${student.section}`,
    },
    school,
    attendance: attSummary,
  };
}

async function dashboardFor(user, query = {}) {
  switch (user.role) {
    case ROLES.SUPER_ADMIN:
      // Privacy wall: providers get platform aggregates only — never a
      // school's operational dashboard, regardless of ?schoolId.
      return superAdminDashboard();
    case ROLES.SCHOOL_ADMIN:
      return schoolAdminDashboard(user.schoolId);
    case ROLES.STAFF:
      return staffDashboard(user);
    case ROLES.PARENT:
      return parentDashboard(user);
    default:
      throw new Error(`Unsupported role: ${user.role}`);
  }
}

module.exports = { dashboardFor, todayKey };