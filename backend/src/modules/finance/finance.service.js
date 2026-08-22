const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");

async function resolveSchoolScope(user, query = {}) {
  const scopeInput = (user.role === "superAdmin")
    ? (query.schoolId !== "all" ? query.schoolId : null)
    : (user.schoolId || (query.schoolId !== "all" ? query.schoolId : null));

  if (!scopeInput || scopeInput === "all") return null;
  const cleanId = String(scopeInput).replace(/^"|"$/g, "").trim();
  if (!cleanId || cleanId === "all") return null;

  try {
    const school = await prisma.school.findFirst({
      where: { OR: [{ id: cleanId }, { code: cleanId }] },
      select: { id: true },
    });
    return school ? school.id : cleanId;
  } catch (e) {
    return cleanId;
  }
}

async function listRecords({ user, query = {} }) {
  const schoolId = await resolveSchoolScope(user, query);
  const where = {
    ...(schoolId ? { schoolId } : {}),
  };

  const combinedRecords = [];

  // 1. Fetch Manual Income & Expense Vouchers from MongoDB
  try {
    if (prisma.incomeExpenseRecord?.findMany) {
      const vouchers = await prisma.incomeExpenseRecord.findMany({
        where,
        orderBy: { date: "desc" },
      });
      vouchers.forEach((v) => {
        combinedRecords.push({
          id: v.id,
          schoolId: v.schoolId,
          type: v.type,
          category: v.category,
          title: v.title,
          amount: v.amount,
          date: v.date,
          voucherNo: v.voucherNo,
          paymentMethod: v.paymentMethod,
          recordedBy: v.recordedBy || "Finance Desk",
          source: "VOUCHER",
        });
      });
    }
  } catch (err) {
    console.warn("Finance voucher query error:", err.message);
  }

  // 2. Fetch Student Fee Payment Transactions from MongoDB (INCOME)
  try {
    if (prisma.payment?.findMany) {
      const feePayments = await prisma.payment.findMany({
        where,
        include: { student: { select: { name: true, admNo: true, cls: true } } },
        orderBy: { paidAt: "desc" },
      });

      feePayments.forEach((p) => {
        const studentLabel = p.student ? `${p.student.name} (${p.student.admNo || "Class " + p.student.cls})` : "Student";
        combinedRecords.push({
          id: `fee-${p.id}`,
          schoolId: p.schoolId,
          type: "INCOME",
          category: "Tuition / Student Fees",
          title: `Fee Collection: ${studentLabel}`,
          amount: p.amount,
          date: p.paidAt || p.createdAt,
          voucherNo: p.receiptNo || `RCP-${p.id.slice(-6)}`,
          paymentMethod: p.paymentMode || "ONLINE",
          recordedBy: "Accounts Gateway",
          source: "FEE_PAYMENT",
        });
      });
    }
  } catch (err) {
    console.warn("Fee payment query error:", err.message);
  }

  // 3. Fetch Paid Staff Payroll Outflows from MongoDB (EXPENSE)
  try {
    if (prisma.payrollRecord?.findMany) {
      const payrollOutflows = await prisma.payrollRecord.findMany({
        where: {
          ...where,
          status: "PAID",
        },
        orderBy: { createdAt: "desc" },
      });

      payrollOutflows.forEach((pr) => {
        combinedRecords.push({
          id: `pay-${pr.id}`,
          schoolId: pr.schoolId,
          type: "EXPENSE",
          category: "Salaries & Compensation",
          title: `Staff Salary Payout: ${pr.staffName} (${pr.role || "Staff"})`,
          amount: pr.netSalary,
          date: pr.paymentDate && pr.paymentDate !== "-" ? new Date(pr.paymentDate) : pr.createdAt,
          voucherNo: `PAY-${pr.staffId || pr.id.slice(-6)}`,
          paymentMethod: pr.paymentMode || "BANK_TRANSFER",
          recordedBy: "Payroll Module",
          source: "PAYROLL",
        });
      });
    }
  } catch (err) {
    console.warn("Payroll outflow query error:", err.message);
  }

  // Sort all MongoDB transactions by date descending
  combinedRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Apply optional category or type filtering
  const filtered = combinedRecords.filter((r) => {
    if (query.type && query.type !== "all" && r.type !== query.type) return false;
    if (query.category && query.category !== "all" && r.category !== query.category) return false;
    return true;
  });

  return { records: filtered };
}

async function createRecord({ user, data }) {
  const schoolId = (await resolveSchoolScope(user, data)) || user.schoolId || data.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const voucherNo = data.voucherNo || `VCH-${Date.now().toString().slice(-6)}`;
  
  if (prisma.incomeExpenseRecord?.create) {
    const record = await prisma.incomeExpenseRecord.create({
      data: {
        schoolId,
        type: data.type || "EXPENSE",
        category: data.category || "General Maintenance",
        title: data.title,
        amount: Number(data.amount) || 0,
        date: data.date ? new Date(data.date) : new Date(),
        voucherNo,
        paymentMethod: data.paymentMethod || "BANK_TRANSFER",
        recordedBy: user.name || "Admin",
        notes: data.notes || null,
      },
    });
    return record;
  }

  throw new ApiError(500, "Database unavailable");
}

module.exports = {
  listRecords,
  createRecord,
  resolveSchoolScope,
};
