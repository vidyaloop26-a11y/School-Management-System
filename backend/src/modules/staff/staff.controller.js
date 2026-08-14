const { catchAsync } = require("../../lib/errors");
const staffService = require("./staff.service");

const list = catchAsync(async (req, res) => {
  const staff = await staffService.listStaff({ user: req.user, query: req.query });
  res.json({ success: true, staff });
});

const get = catchAsync(async (req, res) => {
  const member = await staffService.getStaff({ user: req.user, id: req.params.id });
  res.json({ success: true, staff: member });
});

const create = catchAsync(async (req, res) => {
  const member = await staffService.createStaff({ user: req.user, data: req.body });
  res.status(201).json({ success: true, staff: member });
});

const update = catchAsync(async (req, res) => {
  const member = await staffService.updateStaff({ user: req.user, id: req.params.id, data: req.body });
  res.json({ success: true, staff: member });
});

const remove = catchAsync(async (req, res) => {
  const member = await staffService.deleteStaff({ user: req.user, id: req.params.id });
  res.json({ success: true, deleted: member });
});

const resetPassword = catchAsync(async (req, res) => {
  const result = await staffService.resetStaffPassword({ user: req.user, id: req.params.id });
  res.json({ success: true, ...result });
});

module.exports = { list, get, create, update, remove, resetPassword };