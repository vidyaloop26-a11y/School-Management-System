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

  const inquiries = await prisma.admissionInquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { school: { select: { name: true, code: true } } },
  });
  return { inquiries };
}

async function createInquiry({ user, data }) {
  const schoolId =
    user.role === "superAdmin"
      ? data.schoolId
      : user.schoolId || data.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID is required to create an inquiry");

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

async function getInquiry({ user, id }) {
  const inquiry = await prisma.admissionInquiry.findUnique({ where: { id } });
  if (!inquiry) throw new ApiError(404, "Inquiry not found");

  const schoolId = await resolveSchoolScope(user, {});
  if (schoolId && inquiry.schoolId !== schoolId) {
    throw new ApiError(403, "Inquiry belongs to a different school");
  }
  return inquiry;
}

async function updateInquiry({ user, id, data }) {
  const existing = await getInquiry({ user, id });
  return prisma.admissionInquiry.update({
    where: { id: existing.id },
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

async function deleteInquiry({ user, id }) {
  const existing = await getInquiry({ user, id });
  await prisma.admissionInquiry.delete({ where: { id: existing.id } });
  return { id: existing.id, deleted: true };
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
  let admNo = buildAdmNo(schoolCode, count + 1);

  // Guard against admission-number collisions (e.g. after deletions).
  for (let attempt = count + 1; attempt < count + 50; attempt++) {
    const clash = await prisma.student.findFirst({
      where: { schoolId: inquiry.schoolId, admNo },
      select: { id: true },
    });
    if (!clash) break;
    admNo = buildAdmNo(schoolCode, attempt + 1);
  }

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
