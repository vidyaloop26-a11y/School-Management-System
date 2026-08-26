const prisma = require("../../lib/prisma");

// Record a privileged action in the platform audit trail.
async function audit({ actor, action, targetType, targetId, schoolId, metadata }) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email || null,
        action,
        targetType: targetType || null,
        targetId: targetId || null,
        schoolId: schoolId || null,
        metadata: metadata || undefined,
      },
    });
  } catch (err) {
    // Auditing must never break the request path — but it must be visible.
    console.error("[AUDIT WRITE FAILED]", err.message);
  }
}

// Platform-wide aggregates. No names, no drill-down.
async function stats() {
  const [schoolCount, studentCount, staffCount, staffAccounts, parentAccounts, activeSchools] =
    await Promise.all([
      prisma.school.count(),
      prisma.student.count(),
      prisma.staff.count(),
      prisma.user.count({ where: { role: "staff" } }),
      prisma.user.count({ where: { role: "parent" } }),
      prisma.user.count({ where: { role: "schoolAdmin", isActive: true } }),
    ]);

  return {
    schools: schoolCount,
    students: studentCount,
    staff: staffCount,
    staffAccounts,
    parentAccounts,
    activeSchoolAdmins: activeSchools,
    generatedAt: new Date().toISOString(),
  };
}

// Per-school counts — aggregate numbers only, still no private records.
async function schoolsSummary() {
  const schools = await prisma.school.findMany({
    select: { id: true, name: true, code: true, board: true, session: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const summary = await Promise.all(
    schools.map(async (s) => ({
      ...s,
      students: await prisma.student.count({ where: { schoolId: s.id } }),
      activeStudents: await prisma.student.count({ where: { schoolId: s.id, status: "Active" } }),
      staff: await prisma.staff.count({ where: { schoolId: s.id } }),
      userAccounts: await prisma.user.count({ where: { schoolId: s.id } }),
    }))
  );

  return { schools: summary };
}

// Config-level view of one school — no academic or financial records.
async function schoolProfile(schoolId) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      name: true,
      code: true,
      board: true,
      address: true,
      session: true,
      createdAt: true,
    },
  });
  if (!school) return null;

  const [students, staff, accounts] = await Promise.all([
    prisma.student.count({ where: { schoolId } }),
    prisma.staff.count({ where: { schoolId } }),
    prisma.user.findMany({
      where: { schoolId, role: "schoolAdmin" },
      select: { name: true, email: true, isActive: true },
    }),
  ]);

  return { ...school, counts: { students, staff }, admins: accounts };
}

// Targeted debugging lookup: find ONE student by email within ONE school.
// Deliberately returns profile basics only — never marks, fees or attendance.
async function findStudentByEmail({ schoolId, email }) {
  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { id: true, name: true, code: true } });
  if (!school) throw Object.assign(new Error("School not found"), { statusCode: 404 });

  const clean = String(email).toLowerCase().trim();

  // The student's own contact email OR their linked parent account's email.
  const parentUser = await prisma.user.findFirst({
    where: { role: "parent", schoolId, email: clean },
    include: { student: true },
  });

  let student = parentUser?.student || null;

  if (!student) {
    // Fall back to matching stored guardian emails on the Student record.
    student = await prisma.student.findFirst({
      where: { schoolId, OR: [{ fatherEmail: clean }] },
    });
  }

  if (!student) return { found: false };

  return {
    found: true,
    school: { id: school.id, name: school.name, code: school.code },
    student: {
      id: student.id,
      admNo: student.admNo,
      name: student.name,
      cls: student.cls,
      section: student.section,
      status: student.status,
      session: student.session,
      hasParentLogin: Boolean(parentUser) || (await prisma.user.count({ where: { studentId: student.id, role: "parent" } })) > 0,
    },
  };
}

module.exports = { audit, stats, schoolsSummary, schoolProfile, findStudentByEmail };
