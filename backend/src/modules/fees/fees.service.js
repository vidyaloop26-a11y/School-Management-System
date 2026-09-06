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

async function getComponents({ user, query = {} }) {
  const schoolId = await resolveSchoolScope(user, query);
  if (!schoolId) return [];
  return prisma.feeComponent.findMany({
    where: { schoolId },
    orderBy: { createdAt: "asc" },
  });
}

async function createComponent({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");
  return prisma.feeComponent.create({
    data: {
      schoolId,
      name: data.name,
      code: data.code || null,
      type: data.type || "Annual",
    },
  });
}

async function getStructures({ user, query = {} }) {
  const schoolId = await resolveSchoolScope(user, query);
  if (!schoolId) return [];
  return prisma.feeStructure.findMany({
    where: {
      schoolId,
      ...(query.cls ? { cls: query.cls } : {}),
      ...(query.session ? { session: query.session } : {}),
    },
    orderBy: { cls: "asc" },
  });
}

async function createStructure({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");
  return prisma.feeStructure.create({
    data: {
      schoolId,
      cls: data.cls,
      session: data.session || "2024-2025",
      amount: data.amount,
    },
  });
}

async function getLedger({ user, query = {} }) {
  const schoolId = await resolveSchoolScope(user, query);
  if (!schoolId) return [];

  const where = {
    schoolId,
    ...(query.studentId ? { studentId: query.studentId } : {}),
    ...(query.cls ? { student: { cls: query.cls } } : {}),
    ...(query.section ? { student: { section: query.section } } : {}),
    ...(query.session ? { session: query.session } : {}),
    ...(query.term ? { term: query.term } : {}),
    ...(query.status && query.status !== "all" ? { status: query.status } : {}),
  };

  return prisma.studentFeeLedger.findMany({
    where,
    include: { student: { select: { name: true, admNo: true, cls: true, section: true } } },
    orderBy: { dueDate: "asc" },
  });
}

async function createLedgerEntry({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const student = await prisma.student.findUnique({ where: { id: data.studentId } });
  if (!student) throw new ApiError(404, "Student not found");

  const existing = await prisma.studentFeeLedger.findFirst({
    where: { schoolId, studentId: data.studentId, session: data.session, term: data.term },
  });
  if (existing) throw new ApiError(409, "Ledger entry already exists for this term");

  return prisma.studentFeeLedger.create({
    data: {
      schoolId,
      studentId: data.studentId,
      session: data.session || "2024-2025",
      term: data.term,
      amount: data.amount,
      dueDate: data.dueDate,
      paid: 0,
      status: "UNPAID",
    },
  });
}

async function createLedgerBulk({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const students = await prisma.student.findMany({
    where: {
      schoolId,
      cls: data.cls,
      ...(data.section ? { section: data.section } : {}),
      status: "Active",
    },
    select: { id: true },
  });

  let created = 0;
  for (const s of students) {
    const existing = await prisma.studentFeeLedger.findFirst({
      where: { schoolId, studentId: s.id, session: data.session, term: data.term },
    });
    if (existing) continue;
    await prisma.studentFeeLedger.create({
      data: {
        schoolId,
        studentId: s.id,
        session: data.session || "2024-2025",
        term: data.term,
        amount: data.amount,
        dueDate: data.dueDate,
        paid: 0,
        status: "UNPAID",
      },
    });
    created++;
  }
  return { created, totalStudents: students.length };
}

async function recordPayment({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const student = await prisma.student.findUnique({ where: { id: data.studentId } });
  if (!student) throw new ApiError(404, "Student not found");

  const receiptNo = `RCP-${schoolId.slice(-4)}-${Date.now().toString().slice(-8)}`;

  const payment = await prisma.payment.create({
    data: {
      schoolId,
      studentId: data.studentId,
      amount: data.amount,
      paymentMode: data.paymentMode || "CASH",
      receiptNo,
      paidAt: new Date(),
    },
  });

  if (data.ledgerId) {
    const ledger = await prisma.studentFeeLedger.findUnique({ where: { id: data.ledgerId } });
    if (!ledger) throw new ApiError(404, "Ledger entry not found");
    const newPaid = ledger.paid + data.amount;
    const newStatus = newPaid >= ledger.amount ? "PAID" : "PARTIAL";
    await prisma.studentFeeLedger.update({
      where: { id: ledger.id },
      data: { paid: newPaid, status: newStatus },
    });
  }

  return { payment, student: { name: student.name, admNo: student.admNo, cls: student.cls, section: student.section } };
}

async function getSummary({ user, query = {} }) {
  const schoolId = await resolveSchoolScope(user, query);
  if (!schoolId) return { chart: [], totalCollected: 0, totalDue: 0, overdue: 0, feeBreakdown: {} };

  const ledger = await prisma.studentFeeLedger.findMany({
    where: { schoolId },
    include: { student: { select: { cls: true } } },
  });

  const totalBilled = ledger.reduce((s, l) => s + l.amount, 0);
  const totalCollected = ledger.reduce((s, l) => s + l.paid, 0);
  const totalDue = ledger.filter((l) => l.status !== "PAID").reduce((s, l) => s + (l.amount - l.paid), 0);
  const overdue = ledger.filter((l) => l.status !== "PAID" && l.dueDate < new Date());

  const chart = [];
  const monthMap = {};
  const payments = await prisma.payment.findMany({ where: { schoolId } });
  payments.forEach((p) => {
    const d = new Date(p.paidAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = (monthMap[key] || 0) + p.amount;
  });
  Object.entries(monthMap).sort().forEach(([m, amt]) => {
    chart.push({ month: m, collected: amt });
  });

  const byClass = {};
  ledger.forEach((l) => {
    const c = l.student?.cls || "Unknown";
    byClass[c] = (byClass[c] || 0) + l.amount;
  });

  return {
    chart,
    totalCollected,
    totalDue,
    totalBilled,
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((s, l) => s + (l.amount - l.paid), 0),
    feeBreakdown: byClass,
  };
}

async function getReceipt(paymentId, user) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { student: { select: { name: true, admNo: true, cls: true, section: true } } },
  });
  if (!payment) throw new ApiError(404, "Payment not found");
  if (user.schoolId && payment.schoolId !== user.schoolId) throw new ApiError(403, "Access denied");
  return payment;
}

async function getStudentHistory({ user, studentId }) {
  const schoolId = await resolveSchoolScope(user);
  if (!schoolId) throw new ApiError(400, "School ID required");

  const ledger = await prisma.studentFeeLedger.findMany({
    where: { schoolId, studentId },
    orderBy: { dueDate: "asc" },
  });
  const payments = await prisma.payment.findMany({
    where: { schoolId, studentId },
    orderBy: { paidAt: "desc" },
  });
  return { ledger, payments };
}

module.exports = {
  resolveSchoolScope,
  getComponents,
  createComponent,
  getStructures,
  createStructure,
  getLedger,
  createLedgerEntry,
  createLedgerBulk,
  recordPayment,
  getSummary,
  getReceipt,
  getStudentHistory,
};
