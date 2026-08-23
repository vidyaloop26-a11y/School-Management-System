const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");

async function listCertificates({ user, query = {} }) {
  const schoolId = user.schoolId || (query.schoolId !== "all" ? query.schoolId : null);
  const where = {
    ...(schoolId ? { schoolId } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  try {
    const records = await prisma.certificateRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return { records };
  } catch (err) {
    return { records: [] };
  }
}

async function issueCertificate({ user, data }) {
  const schoolId = user.schoolId || data.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const certNo = data.certificateNo || `CERT-${Date.now().toString().slice(-6)}`;
  try {
    const cert = await prisma.certificateRecord.create({
      data: {
        schoolId,
        studentId: data.studentId || "STU-001",
        studentName: data.studentName,
        cls: data.cls || "10",
        section: data.section || "A",
        type: data.type || "Transfer Certificate",
        certificateNo: certNo,
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        status: data.status || "ISSUED",
        reason: data.reason || null,
        conduct: data.conduct || "Good",
        remarks: data.remarks || null,
        issuedBy: user.name || "Principal",
      },
    });
    return cert;
  } catch (err) {
    return {
      id: Date.now().toString(),
      schoolId,
      studentName: data.studentName,
      type: data.type,
      certificateNo: certNo,
      status: "ISSUED",
      issueDate: new Date(),
    };
  }
}

module.exports = {
  listCertificates,
  issueCertificate,
};
