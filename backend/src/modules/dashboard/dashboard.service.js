const prisma = require("../../lib/prisma");
const attendanceService = require("../attendance/attendance.service");
const { ROLES } = require("../../middleware/rbac");

const todayKey = () => new Date().toISOString().slice(0, 10);

async function superAdminDashboard() {
  const schoolCount = await prisma.school.count();
  const studentCount = await prisma.student.count();
  const staffCount = await prisma.staff.count();
  const teacherUserCount = await prisma.user.count({ where: { role: "teacher" } });
  const parentUserCount = await prisma.user.count({ where: { role: "parent" } });

  return {
    role: "superAdmin",
    stats: {
      schools: schoolCount,
      students: studentCount,
      staff: staffCount,
      teacherAccounts: teacherUserCount,
      parentAccounts: parentUserCount,
    },
  };
}

async function schoolAdminDashboard(schoolId) {
  const studentCount = await prisma.student.count({ where: { schoolId } });
  const staffCount = await prisma.staff.count({ where: { schoolId } });
  const teacherCount = await prisma.staff.count({
    where: {
      schoolId,
      jobTitle: { equals: "Teacher", mode: "insensitive" },
    },
  });
  const classGroups = await prisma.student.groupBy({
    by: ["cls", "section"],
    where: { schoolId, status: "Active" },
  });

  const todayUtc = attendanceService.toUtcDate(todayKey());
  const markedToday = await prisma.attendanceRecord.count({
    where: { schoolId, date: todayUtc },
  });
  const activeStudents = await prisma.student.count({
    where: { schoolId, status: "Active" },
  });

  return {
    role: "schoolAdmin",
    stats: {
      students: studentCount,
      staff: staffCount,
      teachers: teacherCount,
      classes: classGroups.length,
      attendanceMarkedToday: markedToday,
      attendancePending: Math.max(activeStudents - markedToday, 0),
    },
  };
}

async function teacherDashboard(user) {
  const staff = await prisma.staff.findUnique({ where: { id: user.staffId } });
  if (!staff) throw new Error("Staff record not found");

  const classGroups = await prisma.timetableEntry.groupBy({
    by: ["cls", "section"],
    where: { staffId: staff.id },
  });
  const classesList = classGroups.map((c) => `${c.cls}-${c.section}`);

  const todayUtc = attendanceService.toUtcDate(todayKey());
  const markedToday = await prisma.attendanceRecord.count({
    where: { schoolId: staff.schoolId, date: todayUtc, markedById: user.id },
  });

  return {
    role: "teacher",
    staff: { id: staff.id, staffId: staff.staffId, name: staff.name, subject: staff.subject },
    stats: {
      classes: classesList.length,
      classesList,
      attendanceMarkedToday: markedToday,
    },
  };
}

async function parentDashboard(parentUser) {
  if (!parentUser.studentId) throw new Error("No student linked to this parent account");

  const student = await prisma.student.findUnique({ where: { id: parentUser.studentId } });
  if (!student) throw new Error("Linked student not found");

  const now = new Date();
  const attendance = await attendanceService.getStudentAttendance({
    user: parentUser,
    month: now.getUTCMonth() + 1,
    year: now.getUTCFullYear(),
  });

  const school = await prisma.school.findUnique({
    where: { id: student.schoolId },
    select: { name: true, session: true },
  });

  return {
    role: "parent",
    child: {
      id: student.id,
      admNo: student.admNo,
      name: student.name,
      classSection: `${student.cls}-${student.section}`,
    },
    school,
    attendance: attendance.summary,
  };
}

async function dashboardFor(user) {
  switch (user.role) {
    case ROLES.SUPER_ADMIN:
      return superAdminDashboard();
    case ROLES.SCHOOL_ADMIN:
      return schoolAdminDashboard(user.schoolId);
    case ROLES.TEACHER:
      return teacherDashboard(user);
    case ROLES.PARENT:
      return parentDashboard(user);
    default:
      throw new Error(`Unsupported role: ${user.role}`);
  }
}

module.exports = { dashboardFor, todayKey };