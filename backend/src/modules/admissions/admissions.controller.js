const { catchAsync } = require("../../lib/errors");
const admissionsService = require("./admissions.service");

const list = catchAsync(async (req, res) => {
  const data = await admissionsService.listInquiries({ user: req.user, query: req.query });
  res.json({ success: true, ...data });
});

const get = catchAsync(async (req, res) => {
  const inquiry = await admissionsService.getInquiry({ user: req.user, id: req.params.id });
  res.json({ success: true, inquiry });
});

const create = catchAsync(async (req, res) => {
  const inquiry = await admissionsService.createInquiry({ user: req.user, data: req.body });
  res.status(201).json({ success: true, inquiry });
});

const update = catchAsync(async (req, res) => {
  const inquiry = await admissionsService.updateInquiry({ user: req.user, id: req.params.id, data: req.body });
  res.json({ success: true, inquiry });
});

const remove = catchAsync(async (req, res) => {
  const inquiry = await admissionsService.deleteInquiry({ user: req.user, id: req.params.id });
  res.json({ success: true, deleted: inquiry });
});

const enroll = catchAsync(async (req, res) => {
  const result = await admissionsService.enrollInquiry({
    user: req.user,
    id: req.params.id,
    data: req.body,
  });
  res.json({ success: true, ...result });
});

module.exports = { list, get, create, update, remove, enroll };
