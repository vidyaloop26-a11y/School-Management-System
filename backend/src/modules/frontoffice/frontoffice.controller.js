const { catchAsync } = require("../../lib/errors");
const frontOfficeService = require("./frontoffice.service");

const getVisitors = catchAsync(async (req, res) => {
  const data = await frontOfficeService.getVisitors(req.user, req.query);
  res.json({ success: true, visitors: data });
});

const checkIn = catchAsync(async (req, res) => {
  const data = await frontOfficeService.checkIn({ user: req.user, data: req.body });
  res.json({ success: true, visitor: data.visitor, gatePass: data.gatePass });
});

const publicCheckIn = catchAsync(async (req, res) => {
  const data = await frontOfficeService.publicCheckIn({ data: req.body });
  res.json({ success: true, visitor: data.visitor, gatePass: data.gatePass });
});

const checkOut = catchAsync(async (req, res) => {
  const data = await frontOfficeService.checkOut({ id: req.params.id, user: req.user });
  res.json({ success: true, visitor: data });
});

const approveVisitor = catchAsync(async (req, res) => {
  const data = await frontOfficeService.approveVisitor({
    user: req.user,
    id: req.params.id,
    data: req.body,
  });
  res.json({ success: true, visitor: data });
});

const verifyPickup = catchAsync(async (req, res) => {
  const data = await frontOfficeService.verifyPickup({
    user: req.user,
    id: req.params.id,
    data: req.body,
  });
  res.json({ success: true, visitor: data });
});

const getGatePasses = catchAsync(async (req, res) => {
  const data = await frontOfficeService.getGatePasses(req.user, req.query);
  res.json({ success: true, gatePasses: data });
});

const getGatePassById = catchAsync(async (req, res) => {
  const data = await frontOfficeService.getGatePassById({ user: req.user, id: req.params.id });
  res.json({ success: true, gatePass: data });
});

const createGatePass = catchAsync(async (req, res) => {
  const data = await frontOfficeService.createGatePass({ user: req.user, data: req.body });
  res.json({ success: true, gatePass: data });
});

const cancelGatePass = catchAsync(async (req, res) => {
  const data = await frontOfficeService.cancelGatePass({ id: req.params.id, user: req.user });
  res.json({ success: true, gatePass: data });
});

const verifyGatePass = catchAsync(async (req, res) => {
  const data = await frontOfficeService.verifyGatePass({
    token: req.query.token,
    user: req.user || null,
  });
  res.json({ success: true, ...data });
});

// Guardians (authorised pickup list)
const getGuardians = catchAsync(async (req, res) => {
  const data = await frontOfficeService.getGuardians(req.user, req.query);
  res.json({ success: true, guardians: data });
});

const createGuardian = catchAsync(async (req, res) => {
  const data = await frontOfficeService.createGuardian({ user: req.user, data: req.body });
  res.json({ success: true, guardian: data });
});

const updateGuardian = catchAsync(async (req, res) => {
  const data = await frontOfficeService.updateGuardian({
    user: req.user,
    id: req.params.id,
    data: req.body,
  });
  res.json({ success: true, guardian: data });
});

const deleteGuardian = catchAsync(async (req, res) => {
  const data = await frontOfficeService.deleteGuardian({ user: req.user, id: req.params.id });
  res.json({ success: true, deleted: data });
});

// In-app notifications
const getNotifications = catchAsync(async (req, res) => {
  const data = await frontOfficeService.getNotifications({ user: req.user, query: req.query });
  res.json({ success: true, notifications: data });
});

const markNotificationRead = catchAsync(async (req, res) => {
  const data = await frontOfficeService.markNotificationRead({
    user: req.user,
    id: req.params.id,
  });
  res.json({ success: true, notification: data });
});

const markAllNotificationsRead = catchAsync(async (req, res) => {
  const data = await frontOfficeService.markAllNotificationsRead({ user: req.user });
  res.json({ success: true, ...data });
});

// Public kiosk / QR endpoints
const getPublicConfig = catchAsync(async (req, res) => {
  const data = await frontOfficeService.getPublicConfig(req.query.schoolId);
  res.json({ success: true, ...data });
});

const searchPublicStudents = catchAsync(async (req, res) => {
  const data = await frontOfficeService.searchPublicStudents({
    schoolId: req.query.schoolId,
    q: req.query.q,
  });
  res.json({ success: true, students: data });
});

const getPublicVisitorStatus = catchAsync(async (req, res) => {
  const data = await frontOfficeService.getPublicVisitorStatus(req.params.id);
  res.json({ success: true, visitor: data });
});

const getHostMappings = catchAsync(async (req, res) => {
  const data = await frontOfficeService.getHostMappings(req.user);
  res.json({ success: true, hostMappings: data });
});

const createHostMapping = catchAsync(async (req, res) => {
  const data = await frontOfficeService.createHostMapping({ user: req.user, data: req.body });
  res.json({ success: true, hostMapping: data });
});

const deleteHostMapping = catchAsync(async (req, res) => {
  const data = await frontOfficeService.deleteHostMapping({ id: req.params.id, user: req.user });
  res.json({ success: true, deleted: data });
});

module.exports = {
  getVisitors,
  checkIn,
  publicCheckIn,
  checkOut,
  approveVisitor,
  verifyPickup,
  getGatePasses,
  getGatePassById,
  createGatePass,
  cancelGatePass,
  verifyGatePass,
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
  getHostMappings,
  createHostMapping,
  deleteHostMapping,
};