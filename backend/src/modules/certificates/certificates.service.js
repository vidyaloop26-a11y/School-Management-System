const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");

const CERT_TYPES = [
  "Transfer Certificate",
  "Character Certificate",
  "Bonafide Certificate",
  "Merit Certificate",
];

function resolveSchoolId(user, data = {}) {
  const schoolId =
    user.role === "superAdmin" ? data.schoolId : user.schoolId || data.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");
  return schoolId;
}

async function listCertificates({ user, query = {} }) {
  const schoolId =
    user.role === "superAdmin"
      ? query.schoolId && query.schoolId !== "all"
        ? String(query.schoolId).replace(/^"|"$/g, "")
        : null
      : user.schoolId;

  const where = {
    ...(schoolId ? { schoolId } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const records = await prisma.certificateRecord.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return { records };
}

async function nextCertificateNo(schoolId) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { code: true },
  });
  const prefix = `CERT-${(school?.code || schoolId).toString().toUpperCase()}-`;
  const count = await prisma.certificateRecord.count({ where: { schoolId } });
  let candidate = `${prefix}${String(count + 1).padStart(5, "0")}`;
  for (let n = count + 1; n < count + 100; n++) {
    const clash = await prisma.certificateRecord.findFirst({
      where: { certificateNo: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${prefix}${String(n + 1).padStart(5, "0")}`;
  }
  throw new ApiError(500, "Unable to allocate a certificate serial number");
}

async function issueCertificate({ user, data }) {
  const schoolId = resolveSchoolId(user, data);
  if (!data.studentName) throw new ApiError(400, "studentName is required");
  if (!CERT_TYPES.includes(data.type)) {
    throw new ApiError(400, `type must be one of: ${CERT_TYPES.join(", ")}`);
  }

  const certNo = data.certificateNo || (await nextCertificateNo(schoolId));
  const existing = await prisma.certificateRecord.findFirst({
    where: { certificateNo: certNo },
    select: { id: true },
  });
  if (existing) throw new ApiError(409, `Certificate number ${certNo} already exists`);

  const cert = await prisma.certificateRecord.create({
    data: {
      schoolId,
      studentId: data.studentId,
      studentName: data.studentName,
      cls: data.cls,
      section: data.section || null,
      type: data.type,
      certificateNo: certNo,
      issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
      status: "ISSUED",
      reason: data.reason || null,
      conduct: data.conduct || "Good",
      remarks: data.remarks || null,
      issuedBy: user.name || "Principal",
    },
  });

  // Wiring loop: issuing a Transfer Certificate retires the student record.
  if (data.type === "Transfer Certificate" && data.studentId) {
    try {
      await prisma.student.update({
        where: { id: data.studentId },
        data: { status: "Inactive" },
      });
    } catch (err) {
      // studentId may reference an external/legacy id — certificate still issues
    }
  }

  return cert;
}

async function requestCertificate({ user, data }) {
  const schoolId = resolveSchoolId(user, data);
  if (!data.studentName) throw new ApiError(400, "studentName is required");
  if (!CERT_TYPES.includes(data.type)) {
    throw new ApiError(400, `type must be one of: ${CERT_TYPES.join(", ")}`);
  }

  // Requests enter the queue as REQUESTED with no serial allocated yet.
  // Serials are only burned when an admin actually issues the certificate.
  const cert = await prisma.certificateRecord.create({
    data: {
      schoolId,
      studentId: data.studentId || null,
      studentName: data.studentName,
      cls: data.cls || null,
      section: data.section || null,
      type: data.type,
      certificateNo: `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status: "REQUESTED",
      reason: data.reason || null,
      requestedBy: user.id,
      issuedBy: null,
    },
  });
  return cert;
}

module.exports = {
  listCertificates,
  issueCertificate,
  requestCertificate,
  CERT_TYPES,
};
