const crypto = require("crypto");
const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");

const PURPOSES = [
  "PARENT_VISIT",
  "MEETING_TEACHER",
  "MEETING_PRINCIPAL",
  "STUDENT_PICKUP",
  "ADMISSION_ENQUIRY",
  "VENDOR",
  "OTHER",
];

const PICKUP_STATUSES = ["VERIFIED", "UNAUTHORIZED", "MANUAL"];
const APPROVAL_DECISIONS = ["APPROVED", "REJECTED", "WAIT"];
const PASS_TYPES = ["VISITOR", "STUDENT", "STAFF"];

function buildQrToken() {
  return `VLG-${crypto.randomBytes(8).toString("base64url").toUpperCase().slice(0, 14)}`;
}

function isObjectIdHex(value) {
  return /^[0-9a-fA-F]{24}$/.test(value);
}

async function resolveSchoolScope(user, query = {}) {
  if (user.role === "superAdmin") {
    if (!query.schoolId || query.schoolId === "all") {
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      return firstSchool ? firstSchool.id : null;
    }
    const cleanId = String(query.schoolId).replace(/^"|"$/g, "").trim();
    if (!cleanId || cleanId === "all") return null;
    let school = null;
    if (isObjectIdHex(cleanId)) {
      school = await prisma.school.findFirst({ where: { id: cleanId }, select: { id: true } });
    }
    if (!school) {
      school = await prisma.school.findUnique({ where: { code: cleanId }, select: { id: true } });
    }
    return school ? school.id : cleanId;
  }
  return user.schoolId;
}

// Public path: visitors scan a QR before logging in, so no req.user exists.
// Accept either the school ObjectId or the school code shown on the QR.
async function resolveSchoolByIdOrCode(identifier) {
  const cleanId = String(identifier || "").replace(/^"|"$/g, "").trim();
  if (!cleanId) return null;
  let school = null;
  if (isObjectIdHex(cleanId)) {
    school = await prisma.school.findFirst({
      where: { id: cleanId },
      select: { id: true, name: true, code: true },
    });
  }
  if (!school) {
    school = await prisma.school.findUnique({
      where: { code: cleanId },
      select: { id: true, name: true, code: true },
    });
  }
  return school || null;
}

// Create an in-app notification delivered to each user id.
async function notifyUsers({ schoolId, userIds = [], type = "VISITOR", title, body, link }) {
  const recipients = [...new Set(userIds.filter(Boolean))];
  if (!recipients.length) return 0;
  await prisma.notification.createMany({
    data: recipients.map((userId) => ({ schoolId, userId, type, title, body, link })),
  });
  return recipients.length;
}

async function findUsersForDuty(schoolId, duty) {
  const users = await prisma.user.findMany({
    where: { schoolId, role: "staff", duties: { has: duty } },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

// ---------------------------------------------------------------------------
// Public check-in (QR) helpers
// ---------------------------------------------------------------------------

async function resolveStudentForPickup(schoolId, data) {
  if (data.studentId) {
    const student = await prisma.student.findFirst({
      where: { id: data.studentId, schoolId },
      include: { guardians: true },
    });
    if (student) return student;
  }
  if (data.studentName) {
    const matches = await prisma.student.findMany({
      where: {
        schoolId,
        name: { contains: data.studentName, mode: "insensitive" },
      },
      include: { guardians: true },
    });
    if (matches.length === 1) return matches[0];
    // Ambiguous match -> return null; the front desk manually verifies.
    if (matches.length > 1) return { multiple: true, matches };
  }
  return null;
}

function resolveGuardianMatch(student, visitor) {
  if (!student || Array.isArray(student.multiple)) return null;
  const guardians = (student.guardians || []).filter((g) => g.authorizedForPickup);
  if (!guardians.length) return null;
  const phoneOf = (v) => String(v || "").replace(/[\s-]/g, "").toLowerCase();
  const visitorPhone = phoneOf(visitor.phone);
  const visitorName = String(visitor.name || "").trim().toLowerCase();
  return (
    guardians.find(
      (g) =>
        (visitorPhone && phoneOf(g.phone) === visitorPhone) ||
        (visitorName && String(g.name || "").trim().toLowerCase() === visitorName)
    ) || null
  );
}

async function findParentUser(schoolId, studentId) {
  const user = await prisma.user.findFirst({
    where: { schoolId, role: "parent", studentId },
    select: { id: true },
  });
  return user ? user.id : null;
}

async function handleAdmissionEnquiry(schoolId, visitorPayload) {
  const classApplied =
    (visitorPayload.admissionClass && visitorPayload.admissionClass.trim()) || "Enquiry";
  return prisma.admissionInquiry.create({
    data: {
      schoolId,
      name: visitorPayload.name,
      classApplied,
      parentName: visitorPayload.name,
      phone: visitorPayload.phone || "",
      email: visitorPayload.email || null,
      prevSchool: visitorPayload.organisation || null,
    },
  });
}

async function runCheckIn({ schoolId, data, actor }) {
  const token = buildQrToken();
  const notifiedStaffId = data.hostStaffId || null;
  const notifiedStaffName = data.hostStaffName || null;

  const visitor = await prisma.visitor.create({
    data: {
      schoolId,
      name: data.name,
      phone: data.phone || null,
      photoUrl: data.photoUrl || null,
      organisation: data.organisation || null,
      purpose: data.purpose,
      hostStaffId: data.hostStaffId || null,
      hostStaffName: data.hostStaffName || null,
      studentId: data.studentId || null,
      studentName: data.studentName || null,
      checkInTime: new Date(),
      status: "CHECKED_IN",
      approvalStatus: "PENDING",
      qrToken: token,
      notifiedStaffId,
      notifiedStaffName,
    },
  });

  // Auto-generate a digital gate pass carrying the QR token so the visitor can
  // show it on their phone while on campus and at the gate on exit.
  const gatePass = await prisma.gatePass.create({
    data: {
      schoolId,
      visitorId: visitor.id,
      passType: "VISITOR",
      holderName: data.name,
      purpose: data.purpose,
      issuedBy: actor || "Kiosk Check-in",
      qrToken: token,
      approvalStatus: "PENDING",
      status: "ACTIVE",
      validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000),
    },
  });
  await prisma.visitor.update({
    where: { id: visitor.id },
    data: { gatePassId: gatePass.id },
  });

  // Student pickup verification against the authorised guardian list.
  let pickupStatus = null;
  if (data.purpose === "STUDENT_PICKUP") {
    const student = await resolveStudentForPickup(schoolId, data);
    if (student && !Array.isArray(student.multiple)) {
      await prisma.visitor.update({
        where: { id: visitor.id },
        data: { studentId: student.id, studentName: student.name },
      });
      const match = resolveGuardianMatch(student, data);
      pickupStatus = match ? "VERIFIED" : "MANUAL";
    } else if (student && Array.isArray(student.multiple)) {
      pickupStatus = "MANUAL";
    } else {
      pickupStatus = "MANUAL";
    }
    await prisma.visitor.update({
      where: { id: visitor.id },
      data: {
        pickupStatus,
        pickupNote:
          pickupStatus === "VERIFIED"
            ? "Recognised as an authorised guardian."
            : "Not recognised - requires manual verification.",
      },
    });
  }

  // Walk-in admission enquiries flow straight into the Admissions pipeline.
  let admissionInquiry = null;
  if (data.purpose === "ADMISSION_ENQUIRY") {
    admissionInquiry = await handleAdmissionEnquiry(schoolId, data);
    await prisma.visitor.update({
      where: { id: visitor.id },
      data: { admissionInquiryId: admissionInquiry.id },
    });
  }

  // Notify the relevant people.
  const schoolAdmin = await prisma.user.findFirst({
    where: { schoolId, role: "schoolAdmin" },
    select: { id: true },
  });
  const recipients = [];
  if (notifiedStaffId) {
    const hostUser = await prisma.user.findFirst({
      where: { schoolId, staffId: notifiedStaffId },
      select: { id: true },
    });
    if (hostUser) recipients.push(hostUser.id);
  }
  if (schoolAdmin) recipients.push(schoolAdmin.id);
  recipients.push(...(await findUsersForDuty(schoolId, "frontOffice")));

  if (data.purpose === "ADMISSION_ENQUIRY") {
    recipients.push(...(await findUsersForDuty(schoolId, "admissionsOfficer")));
  }

  await notifyUsers({
    schoolId,
    userIds: recipients,
    type: data.purpose === "STUDENT_PICKUP" ? "PICKUP" : "VISITOR",
    title: `New visitor: ${data.name}`,
    body: `${data.name} (${data.phone || "no phone"}) checked in for ${data.purpose}${
      pickupStatus ? `. Pickup: ${pickupStatus}.` : ""
    }`,
    link: "/front-office",
  });

  if (data.purpose === "STUDENT_PICKUP" && pickupStatus !== "VERIFIED") {
    // Parent + staff are alarmed later in verifyPickup, once the front desk
    // issues the manual verification verdict.
  }

  return { visitor: await getVisitorById(visitor.id), gatePass };
}

async function getVisitorById(id) {
  return prisma.visitor.findUnique({
    where: { id },
    include: { gatePasses: { orderBy: { issuedAt: "desc" } } },
  });
}

// ---------------------------------------------------------------------------
// Authenticated flows
// ---------------------------------------------------------------------------

async function getVisitors(user, filters = {}) {
  const schoolId = await resolveSchoolScope(user, filters);
  if (!schoolId) return [];

  const where = { schoolId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.approval) {
    where.approvalStatus = filters.approval;
  }

  if (filters.pickup) {
    where.pickupStatus = filters.pickup;
  }

  if (filters.date) {
    const start = new Date(filters.date);
    const end = new Date(filters.date);
    end.setDate(end.getDate() + 1);
    where.checkInTime = { gte: start, lt: end };
  }

  return prisma.visitor.findMany({
    where,
    orderBy: { checkInTime: "desc" },
    include: { gatePasses: { orderBy: { issuedAt: "desc" } } },
  });
}

async function checkIn({ user, data }) {
  const schoolId = await resolveSchoolScope(user);
  if (!schoolId) throw new ApiError(400, "School ID required");
  return runCheckIn({ schoolId, data, actor: user.name || user.id });
}

async function publicCheckIn({ data }) {
  const school = await resolveSchoolByIdOrCode(data.schoolId);
  if (!school) throw new ApiError(404, "School not found. Check the QR code link.");
  return runCheckIn({ schoolId: school.id, data, actor: "Kiosk Check-in" });
}

async function checkOut({ id, user }) {
  const visitor = await prisma.visitor.findUnique({ where: { id } });
  if (!visitor) throw new ApiError(404, "Visitor not found");
  if (user.schoolId && visitor.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  if (visitor.status === "CHECKED_OUT") {
    throw new ApiError(400, "Visitor already checked out");
  }

  const updated = await prisma.visitor.update({
    where: { id },
    data: { checkOutTime: new Date(), status: "CHECKED_OUT" },
  });

  // Invalidate any live gate pass on exit.
  if (visitor.gatePassId) {
    await prisma.gatePass.updateMany({
      where: { id: visitor.gatePassId, status: "ACTIVE" },
      data: { status: "USED", scannedAt: new Date(), scannedBy: user?.name || "Gate" },
    });
  }
  return updated;
}

async function approveVisitor({ user, id, data }) {
  if (!APPROVAL_DECISIONS.includes(data.decision)) {
    throw new ApiError(422, "Decision must be APPROVED, REJECTED or WAIT");
  }
  const visitor = await prisma.visitor.findUnique({ where: { id } });
  if (!visitor) throw new ApiError(404, "Visitor not found");
  if (user.schoolId && visitor.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  const updated = await prisma.visitor.update({
    where: { id },
    data: {
      approvalStatus: data.decision,
      approvalNote: data.note || null,
      approvedById: user.id,
      approvedByName: user.name,
      approvedAt: new Date(),
    },
  });

  // Mirror the decision onto the linked gate pass.
  if (visitor.gatePassId) {
    await prisma.gatePass.update({
      where: { id: visitor.gatePassId },
      data: {
        approvalStatus: data.decision,
        ...(data.decision === "REJECTED" ? { status: "CANCELLED" } : {}),
      },
    });
  }

  // Notify the school admin if a staff member rejected / asked someone to wait.
  if (data.decision !== "APPROVED") {
    const schoolAdmin = await prisma.user.findFirst({
      where: { schoolId: visitor.schoolId, role: "schoolAdmin" },
      select: { id: true },
    });
    await notifyUsers({
      schoolId: visitor.schoolId,
      userIds: schoolAdmin ? [schoolAdmin.id] : [],
      type: "VISITOR",
      title: `Visitor ${data.decision.toLowerCase()}: ${visitor.name}`,
      body: `${user?.name} marked visitor "${visitor.name}" as ${data.decision}${data.note ? ` (${data.note})` : ""}.`,
      link: "/front-office",
    });
  }

  return getVisitorById(updated.id);
}

async function verifyPickup({ user, id, data }) {
  if (!PICKUP_STATUSES.includes(data.decision)) {
    throw new ApiError(422, "Decision must be VERIFIED, UNAUTHORIZED or MANUAL");
  }
  const visitor = await prisma.visitor.findUnique({ where: { id } });
  if (!visitor) throw new ApiError(404, "Visitor not found");
  if (user.schoolId && visitor.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  const updated = await prisma.visitor.update({
    where: { id },
    data: {
      pickupStatus: data.decision,
      pickupVerifiedById: user.id,
      pickupVerifiedByName: user.name,
      pickupNote: data.note || null,
    },
  });

  // If the person is not on the authorised list, alert the registered parent
  // and the relevant school staff.
  if (data.decision !== "VERIFIED" && visitor.studentId) {
    const parentUserId = await findParentUser(visitor.schoolId, visitor.studentId);
    const schoolAdmin = await prisma.user.findFirst({
      where: { schoolId: visitor.schoolId, role: "schoolAdmin" },
      select: { id: true },
    });
    const schoolStaffIds = [...(await findUsersForDuty(visitor.schoolId, "frontOffice"))];
    await notifyUsers({
      schoolId: visitor.schoolId,
      userIds: [...new Set([parentUserId, schoolAdmin?.id, ...schoolStaffIds].filter(Boolean))],
      type: "PICKUP",
      title: `Manual pickup verification: ${visitor.name}`,
      body: `${visitor.name} is trying to pick up ${visitor.studentName || "a student"} but is not on the authorised list (${data.decision}).`,
      link: "/front-office",
    });
  }

  return getVisitorById(updated.id);
}

async function createGatePass({ user, data }) {
  const schoolId = await resolveSchoolScope(user);
  if (!schoolId) throw new ApiError(400, "School ID required");

  const passType = data.passType || "VISITOR";
  if (!PASS_TYPES.includes(passType)) {
    throw new ApiError(422, "passType must be VISITOR, STUDENT or STAFF");
  }

  let holderName = data.holderName || null;
  let holderId = data.holderId || null;
  let holderRole = data.holderRole || null;
  let studentId = null;
  let studentName = null;
  let visitorId = null;

  if (passType === "VISITOR") {
    const visitor = await prisma.visitor.findUnique({ where: { id: data.visitorId } });
    if (!visitor) throw new ApiError(404, "Visitor not found");
    if (visitor.schoolId !== schoolId) {
      throw new ApiError(403, "Visitor belongs to a different school");
    }
    visitorId = visitor.id;
    holderName = visitor.name;
    studentId = data.studentId || visitor.studentId || null;
    studentName = data.studentName || visitor.studentName || null;
  } else if (passType === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: { id: data.holderId, schoolId },
    });
    if (!student) throw new ApiError(404, "Student not found");
    holderId = student.id;
    holderName = student.name;
    holderRole = "STUDENT";
    studentId = student.id;
    studentName = student.name;
  } else if (passType === "STAFF") {
    const staff = await prisma.staff.findFirst({ where: { id: data.holderId, schoolId } });
    if (!staff) throw new ApiError(404, "Staff member not found");
    holderId = staff.id;
    holderName = staff.name;
    holderRole = "STAFF";
  }

  const gatePass = await prisma.gatePass.create({
    data: {
      schoolId,
      visitorId,
      passType,
      holderId,
      holderName,
      holderRole,
      studentId,
      studentName,
      issuedBy: user.name || user.id,
      purpose: data.purpose || null,
      qrToken: buildQrToken(),
      approvalStatus: data.approvalStatus || "APPROVED",
      status: "ACTIVE",
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
    },
  });

  if (visitorId && passType === "VISITOR") {
    await prisma.visitor.update({
      where: { id: visitorId },
      data: { gatePassId: gatePass.id },
    });
  }

  return gatePass;
}

async function verifyGatePass({ token, user }) {
  const gatePass = await prisma.gatePass.findUnique({
    where: { qrToken: token },
    include: {
      visitor: { select: { id: true, name: true, purpose: true, status: true } },
    },
  });

  const reasons = {
    NOT_FOUND: "Pass not found",
    CANCELLED: "Pass was cancelled",
    REJECTED: "Pass was not approved",
    EXPIRED: "Pass has expired",
    USED: "Pass has already been used",
  };

  if (!gatePass) {
    return { valid: false, reason: reasons.NOT_FOUND };
  }
  if (gatePass.status === "CANCELLED") {
    return { valid: false, reason: reasons.CANCELLED };
  }
  if (gatePass.approvalStatus === "REJECTED") {
    return { valid: false, reason: reasons.REJECTED };
  }
  if (gatePass.status === "USED") {
    return { valid: false, reason: reasons.USED };
  }
  if (gatePass.validUntil && gatePass.validUntil < new Date()) {
    return { valid: false, reason: reasons.EXPIRED };
  }

  // Record the gate scan. Only flips a live pass to USED when it is checked
  // out; a plain scan just timestamps it.
  await prisma.gatePass.update({
    where: { id: gatePass.id },
    data: { scannedAt: new Date(), scannedBy: user?.name || "Gate Scan" },
  });

  return {
    valid: true,
    gatePass: {
      id: gatePass.id,
      passType: gatePass.passType,
      holderName: gatePass.holderName,
      studentName: gatePass.studentName,
      purpose: gatePass.purpose,
      issuedAt: gatePass.issuedAt,
      validUntil: gatePass.validUntil,
      approvalStatus: gatePass.approvalStatus,
      status: gatePass.status,
    },
  };
}

async function cancelGatePass({ id, user }) {
  const gatePass = await prisma.gatePass.findUnique({ where: { id } });
  if (!gatePass) throw new ApiError(404, "Gate pass not found");
  if (user.schoolId && gatePass.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return prisma.gatePass.update({
    where: { id },
    data: { status: "CANCELLED", approvalStatus: "REJECTED" },
  });
}

async function getGatePasses(user, filters = {}) {
  const schoolId = await resolveSchoolScope(user, filters);
  if (!schoolId) return [];

  const where = { schoolId };
  if (filters.passType) where.passType = filters.passType;
  if (filters.status) where.status = filters.status;

  return prisma.gatePass.findMany({
    where,
    orderBy: { issuedAt: "desc" },
    include: { visitor: { select: { id: true, name: true, phone: true, purpose: true } } },
  });
}

async function getGatePassById({ user, id }) {
  const gatePass = await prisma.gatePass.findUnique({
    where: { id },
    include: { visitor: true },
  });
  if (!gatePass) throw new ApiError(404, "Gate pass not found");
  if (user.schoolId && gatePass.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return gatePass;
}

// ---------------------------------------------------------------------------
// Guardians (authorised pickup list)
// ---------------------------------------------------------------------------

async function resolveGuardianSchoolScope(user, query = {}) {
  return resolveSchoolScope(user, query);
}

async function getGuardians(user, query = {}) {
  const schoolId = await resolveGuardianSchoolScope(user, query);
  if (!schoolId) return [];
  const where = { schoolId };
  if (query.studentId) where.studentId = query.studentId;
  if (query.onlyAuthorized === "true") where.authorizedForPickup = true;
  return prisma.guardian.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { student: { select: { id: true, name: true, cls: true, section: true, admNo: true } } },
  });
}

async function createGuardian({ user, data }) {
  const schoolId = await resolveGuardianSchoolScope(user);
  if (!schoolId) throw new ApiError(400, "School ID required");
  const student = await prisma.student.findFirst({
    where: { id: data.studentId, schoolId },
    select: { id: true },
  });
  if (!student) throw new ApiError(404, "Student not found in this school");

  return prisma.guardian.create({
    data: {
      schoolId,
      studentId: data.studentId,
      name: data.name,
      relationship: data.relationship || "Parent",
      phone: data.phone || null,
      authorizedForPickup: data.authorizedForPickup === true,
      photoUrl: data.photoUrl || null,
      notes: data.notes || null,
    },
  });
}

async function updateGuardian({ user, id, data }) {
  const guardian = await prisma.guardian.findUnique({ where: { id } });
  if (!guardian) throw new ApiError(404, "Guardian not found");
  if (user.schoolId && guardian.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return prisma.guardian.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.relationship && { relationship: data.relationship }),
      ...("phone" in data && { phone: data.phone || null }),
      ...("authorizedForPickup" in data && { authorizedForPickup: data.authorizedForPickup === true }),
      ...("photoUrl" in data && { photoUrl: data.photoUrl || null }),
      ...("notes" in data && { notes: data.notes || null }),
    },
  });
}

async function deleteGuardian({ user, id }) {
  const guardian = await prisma.guardian.findUnique({ where: { id } });
  if (!guardian) throw new ApiError(404, "Guardian not found");
  if (user.schoolId && guardian.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return prisma.guardian.delete({ where: { id } });
}

// ---------------------------------------------------------------------------
// Notifications (in-app)
// ---------------------------------------------------------------------------

async function getNotifications({ user, query = {} }) {
  const limit = parseInt(query.limit, 10) || 50;
  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 100),
  });
}

async function markNotificationRead({ user, id }) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) throw new ApiError(404, "Notification not found");
  if (notification.userId !== user.id) throw new ApiError(403, "Access denied");
  return prisma.notification.update({
    where: { id },
    data: { read: true, readAt: new Date() },
  });
}

async function markAllNotificationsRead({ user }) {
  const result = await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true, readAt: new Date() },
  });
  return { updated: result.count };
}

// ---------------------------------------------------------------------------
// Public lookups for the kiosk QR flow
// ---------------------------------------------------------------------------

async function getPublicConfig(identifier) {
  const school = await resolveSchoolByIdOrCode(identifier);
  if (!school) throw new ApiError(404, "School not found. Check the QR code link.");
  const staff = await prisma.staff.findMany({
    where: { schoolId: school.id, status: "Active" },
    select: { id: true, name: true, jobTitle: true },
    orderBy: { name: "asc" },
  });
  return {
    school: { id: school.id, name: school.name, code: school.code },
    purposes: PURPOSES,
    staff,
  };
}

async function searchPublicStudents({ schoolId, q }) {
  const school = await resolveSchoolByIdOrCode(schoolId);
  if (!school) throw new ApiError(404, "School not found");
  const where = { schoolId: school.id, status: "Active" };
  const query = String(q || "").trim();
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { admNo: { contains: query, mode: "insensitive" } },
    ];
  }
  const students = await prisma.student.findMany({
    where,
    select: { id: true, name: true, cls: true, section: true, admNo: true },
    take: 20,
  });
  return students;
}

async function getPublicVisitorStatus(id) {
  const visitor = await prisma.visitor.findUnique({
    where: { id },
    include: {
      gatePasses: { orderBy: { issuedAt: "desc" } },
    },
  });
  if (!visitor) throw new ApiError(404, "Visit not found");
  return {
    id: visitor.id,
    name: visitor.name,
    purpose: visitor.purpose,
    checkInTime: visitor.checkInTime,
    checkOutTime: visitor.checkOutTime,
    status: visitor.status,
    approvalStatus: visitor.approvalStatus,
    approvalNote: visitor.approvalNote,
    pickupStatus: visitor.pickupStatus,
    pickupNote: visitor.pickupNote,
    studentName: visitor.studentName,
    admissionInquiryId: visitor.admissionInquiryId,
    gatePass: visitor.gatePasses[0] || null,
  };
}

// ---------------------------------------------------------------------------
// Host mappings (existing admin feature)
// ---------------------------------------------------------------------------

async function getHostMappings(user) {
  const schoolId = await resolveSchoolScope(user);
  if (!schoolId) return [];

  return prisma.hostMapping.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
  });
}

async function createHostMapping({ user, data }) {
  const schoolId = await resolveSchoolScope(user);
  if (!schoolId) throw new ApiError(400, "School ID required");

  const staff = await prisma.staff.findFirst({
    where: { id: data.notifyStaffId, schoolId },
    select: { name: true },
  });

  return prisma.hostMapping.create({
    data: {
      schoolId,
      visitType: data.visitType,
      notifyStaffId: data.notifyStaffId,
      ...(staff ? { notifyStaffName: staff.name } : {}),
    },
  });
}

async function deleteHostMapping({ id, user }) {
  const mapping = await prisma.hostMapping.findUnique({ where: { id } });
  if (!mapping) throw new ApiError(404, "Host mapping not found");
  if (user.schoolId && mapping.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return prisma.hostMapping.delete({ where: { id } });
}

module.exports = {
  PURPOSES,
  resolveSchoolScope,
  getVisitors,
  checkIn,
  publicCheckIn,
  checkOut,
  approveVisitor,
  verifyPickup,
  createGatePass,
  verifyGatePass,
  cancelGatePass,
  getGatePasses,
  getGatePassById,
  getHostMappings,
  createHostMapping,
  deleteHostMapping,
  getGuardians,
  createGuardian,
  updateGuardian,
  deleteGuardian,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getPublicConfig,
  searchPublicStudents,
  getPublicVisitorStatus,
};