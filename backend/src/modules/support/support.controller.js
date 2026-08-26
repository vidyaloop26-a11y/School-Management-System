const supportService = require("./support.service");
const { catchAsync } = require("../../lib/errors");

// Every handler here records the access in AuditLog — privileged reads are
// never silent.

const stats = catchAsync(async (req, res) => {
  const data = await supportService.stats();
  await supportService.audit({ actor: req.user, action: "SUPPORT_STATS_VIEWED" });
  res.json({ success: true, stats: data });
});

const schoolsSummary = catchAsync(async (req, res) => {
  const data = await supportService.schoolsSummary();
  await supportService.audit({ actor: req.user, action: "SUPPORT_SCHOOLS_SUMMARY_VIEWED" });
  res.json({ success: true, ...data });
});

const schoolProfile = catchAsync(async (req, res) => {
  const profile = await supportService.schoolProfile(req.params.id);
  await supportService.audit({
    actor: req.user,
    action: "SUPPORT_SCHOOL_PROFILE_VIEWED",
    targetType: "School",
    targetId: req.params.id,
    schoolId: req.params.id,
  });
  if (!profile) return res.status(404).json({ success: false, message: "School not found" });
  res.json({ success: true, school: profile });
});

const findStudent = catchAsync(async (req, res) => {
  const result = await supportService.findStudentByEmail(req.body);
  await supportService.audit({
    actor: req.user,
    action: "SUPPORT_STUDENT_LOOKUP",
    targetType: "Student",
    targetId: result.student?.id || null,
    schoolId: req.body.schoolId,
    metadata: { email: req.body.email, found: result.found },
  });
  res.json({ success: true, ...result });
});

module.exports = { stats, schoolsSummary, schoolProfile, findStudent };
