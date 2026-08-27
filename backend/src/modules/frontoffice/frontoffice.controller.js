const { catchAsync } = require("../../lib/errors");
const frontOfficeService = require("./frontoffice.service");

const getVisitors = catchAsync(async (req, res) => {
  const data = await frontOfficeService.getVisitors(req.user, req.query);
  res.json({ success: true, visitors: data });
});

const checkIn = catchAsync(async (req, res) => {
  const data = await frontOfficeService.checkIn({ user: req.user, data: req.body });
  res.json({ success: true, visitor: data });
});

const checkOut = catchAsync(async (req, res) => {
  const data = await frontOfficeService.checkOut({ id: req.params.id, user: req.user });
  res.json({ success: true, visitor: data });
});

const getGatePasses = catchAsync(async (req, res) => {
  const data = await frontOfficeService.getGatePasses(req.user, req.query);
  res.json({ success: true, gatePasses: data });
});

const createGatePass = catchAsync(async (req, res) => {
  const data = await frontOfficeService.createGatePass({ user: req.user, data: req.body });
  res.json({ success: true, gatePass: data });
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
  checkOut,
  getGatePasses,
  createGatePass,
  getHostMappings,
  createHostMapping,
  deleteHostMapping,
};
