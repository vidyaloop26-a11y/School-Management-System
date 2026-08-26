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
      select: { id: true, code: true, name: true },
    });
    return school ? school : { id: cleanId, code: cleanId };
  } catch (e) {
    return { id: cleanId, code: cleanId };
  }
}

async function listPayroll({ user, query = {} }) {
  const school = await resolveSchoolScope(user, query);
  const schoolId = school?.id;

  const where = {
    ...(schoolId ? { schoolId } : {}),
    ...(query.month ? { month: query.month } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  // Real records only — an empty result means no payroll has been processed
  // for this scope yet. We never synthesize rows from the staff list.
  const records = await prisma.payrollRecord.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return { records };
}

async function processPayroll({ user, data }) {
  const schoolObj = await resolveSchoolScope(user, data);
  const schoolId = schoolObj?.id || user.schoolId || data.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID is required to process payroll");

  const month = data.month;
  if (!month) throw new ApiError(400, "Payroll month is required (e.g. 'August 2026')");

  const staffMembers = data.staffMembers || [];
  if (!Array.isArray(staffMembers) || staffMembers.length === 0) {
    throw new ApiError(400, "staffMembers array with at least one entry is required");
  }

  const createdRecords = [];
  for (const [idx, s] of staffMembers.entries()) {
    const label = s.staffName || s.name || `entry #${idx + 1}`;
    const basic = Number(s.basicSalary);
    if (!Number.isFinite(basic) || basic <= 0) {
      throw new ApiError(400, `${label}: basicSalary must be a positive number`);
    }
    if (!s.staffId && !s.id) {
      throw new ApiError(400, `${label}: staffId is required`);
    }
    const allow = Number.isFinite(Number(s.allowances)) ? Number(s.allowances) : 0;
    const ded = Number.isFinite(Number(s.deductions)) ? Number(s.deductions) : 0;

    const rec = await prisma.payrollRecord.create({
      data: {
        schoolId,
        staffId: s.staffId || s.id,
        staffName: s.staffName || s.name || "Staff",
        role: s.role || s.jobTitle || "Staff",
        month,
        basicSalary: basic,
        allowances: allow,
        deductions: ded,
        netSalary: basic + allow - ded,
        status: data.markPaid === false ? "PENDING" : "PAID",
        paymentDate: new Date(),
        paymentMode: data.paymentMode || "BANK_TRANSFER",
        remarks: data.remarks || "Monthly Salary Payout",
      },
    });
    createdRecords.push(rec);
  }

  return { processedCount: createdRecords.length, records: createdRecords };
}

module.exports = {
  listPayroll,
  processPayroll,
  resolveSchoolScope,
};
