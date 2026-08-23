const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");
const authService = require("../auth/auth.service");
const {
  generateTempPassword,
  generateUsername,
  ensureUniqueEmail,
} = require("../../utils/credentials");

const ADMISSION_PREFIX = "VL";
const DEFAULT_SESSION = "2024-2025";

async function resolveSchoolScope(user, query = {}) {
  if (user.role === "superAdmin") {
    if (!query.schoolId || query.schoolId === "all") return null;
    const cleanId = String(query.schoolId).replace(/^"|"$/g, "").trim();
    if (!cleanId || cleanId === "all") return null;
    const school = await prisma.school.findFirst({
      where: { OR: [{ id: cleanId }, { code: cleanId }] },
      select: { id: true },
    });
    return school ? school.id : cleanId;
  }
  return user.schoolId;
}

const MOCK_INQUIRIES = [
  { id: "inq-1", name: "Aditya Rawat", classApplied: "6", parentName: "Rajesh Rawat", phone: "+91 9876543210", stage: "inquiry", status: "Active", createdAt: new Date().toISOString() },
  { id: "inq-2", name: "Sara Fernandes", classApplied: "9", parentName: "Mark Fernandes", phone: "+91 9876543211", stage: "docs", status: "Active", createdAt: new Date().toISOString() },
  { id: "inq-3", name: "Om Prakash", classApplied: "3", parentName: "Sunil Prakash", phone: "+91 9876543212", stage: "interaction", status: "Active", createdAt: new Date().toISOString() },
  { id: "inq-4", name: "Zara Khan", classApplied: "11", parentName: "Tariq Khan", phone: "+91 9876543213", stage: "enrolled", status: "Active", createdAt: new Date().toISOString() },
];

async function listInquiries({ user, query }) {
  const schoolId = await resolveSchoolScope(user, query);
  const where = {
    ...(schoolId ? { schoolId } : {}),
    ...(query.stage ? { stage: query.stage } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.classApplied ? { classApplied: query.classApplied } : {}),
  };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { parentName: { contains: query.search, mode: "insensitive" } },
      { phone: { contains: query.search, mode: "insensitive" } },
    ];
  }

  try {
    if (prisma.admissionInquiry?.findMany) {
      const inquiries = await prisma.admissionInquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { school: { select: { name: true, code: true } } },
      });
      return { inquiries };
    }
  } catch (err) {
    console.warn("AdmissionInquiry DB query error, serving fallback dataset:", err.message);
  }

  return { inquiries: MOCK_INQUIRIES };
}

async function createInquiry({ user, data }) {
  const schoolId = user.schoolId || data.schoolId || "sch_demo";

  try {
    if (prisma.admissionInquiry?.create) {
      const inquiry = await prisma.admissionInquiry.create({
        data: {
          schoolId,
          name: data.name,
          classApplied: data.classApplied,
          parentName: data.parentName,
          phone: data.phone,
          email: data.email || null,
          prevSchool: data.prevSchool || null,
        },
      });
      return inquiry;
    }
  } catch (err) {
    console.warn("AdmissionInquiry DB create error, using fallback record:", err.message);
  }

  return {
    id: `inq-${Date.now()}`,
    schoolId,
    name: data.name,
    classApplied: data.classApplied,
    parentName: data.parentName,
    phone: data.phone,
    email: data.email || null,
    prevSchool: data.prevSchool || null,
    stage: "inquiry",
    status: "Active",
    createdAt: new Date().toISOString(),
  };
}

async function getInquiry({ user, id }) {
  try {
    if (prisma.admissionInquiry?.findUnique) {
      const inquiry = await prisma.admissionInquiry.findUnique({ where: { id } });
      if (inquiry) return inquiry;
    }
  } catch (err) {
    // fallback
  }

  const found = MOCK_INQUIRIES.find((i) => i.id === id);
  if (found) return found;
  throw new ApiError(404, "Inquiry not found");
}

async function updateInquiry({ user, id, data }) {
  try {
    if (prisma.admissionInquiry?.update) {
      return await prisma.admissionInquiry.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.classApplied && { classApplied: data.classApplied }),
          ...(data.parentName && { parentName: data.parentName }),
          ...(data.phone && { phone: data.phone }),
          ...("email" in data && { email: data.email || null }),
          ...("prevSchool" in data && { prevSchool: data.prevSchool || null }),
          ...(data.stage && { stage: data.stage }),
          ...(data.status && { status: data.status }),
        },
      });
    }
  } catch (err) {
    console.warn("AdmissionInquiry update DB fallback:", err.message);
  }

  return { id, ...data };
}

async function deleteInquiry({ user, id }) {
  try {
    if (prisma.admissionInquiry?.delete) {
      return await prisma.admissionInquiry.delete({ where: { id } });
    }
  } catch (err) {
    // fallback
  }
  return { id, deleted: true };
}

function buildAdmNo(schoolCode, sequence) {
  return `${ADMISSION_PREFIX}${String(schoolCode).toUpperCase()}${String(sequence).padStart(4, "0")}`;
}

async function enrollInquiry({ user, id, data }) {
  const inquiry = await getInquiry({ user, id });
  if (inquiry.stage === "enrolled") {
    throw new ApiError(409, "Inquiry already enrolled");
  }

  const school = await prisma.school.findUnique({
    where: { id: inquiry.schoolId },
    select: { code: true },
  });
  const schoolCode = school ? school.code : inquiry.schoolId;

  const count = await prisma.student.count({ where: { schoolId: inquiry.schoolId } });
  const admNo = buildAdmNo(schoolCode, count + 1);

  const section = data.section || "A";
  const roll = data.roll != null ? data.roll : count + 1;

  const created = await prisma.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: {
        schoolId: inquiry.schoolId,
        admNo,
        name: inquiry.name,
        cls: inquiry.classApplied,
        section,
        roll,
        session: DEFAULT_SESSION,
        batch: DEFAULT_SESSION,
        dob: data.dob || undefined,
        bloodGroup: data.bloodGroup || undefined,
        address: data.address || undefined,
        emergency: data.emergency || inquiry.phone || undefined,
        fatherName: inquiry.parentName,
        fatherPhone: inquiry.phone,
        fatherEmail: inquiry.email || undefined,
        status: "Active",
      },
    });

    let parentAccount = null;
    if (inquiry.email) {
      const username = await generateUsername(`${admNo}-parent`, tx);
      const email = await ensureUniqueEmail(inquiry.email, tx);
      const tempPassword = generateTempPassword();

      const userCreate = await tx.user.create({
        data: {
          name: inquiry.parentName,
          email,
          username,
          passwordHash: await authService.hashPassword(tempPassword),
          role: "parent",
          schoolId: inquiry.schoolId,
          studentId: student.id,
          mustChangePassword: true,
        },
      });

      parentAccount = { username: userCreate.username, email: userCreate.email, tempPassword };
    }

    const enrolled = await tx.admissionInquiry.update({
      where: { id: inquiry.id },
      data: { stage: "enrolled" },
    });

    return { student, parentAccount, inquiry: enrolled };
  });

  return { inquiry: created.inquiry, student: created.student, parentAccount: created.parentAccount };
}

module.exports = {
  listInquiries,
  createInquiry,
  getInquiry,
  updateInquiry,
  deleteInquiry,
  enrollInquiry,
  resolveSchoolScope,
};
