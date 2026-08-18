const { catchAsync } = require("../../lib/errors");
const communicationService = require("./communication.service");

const list = catchAsync(async (req, res) => {
  const data = await communicationService.listNotices({ user: req.user, query: req.query });
  res.json({ success: true, ...data });
});

const get = catchAsync(async (req, res) => {
  const notice = await communicationService.getNotice({ user: req.user, id: req.params.id });
  res.json({ success: true, notice });
});

const create = catchAsync(async (req, res) => {
  const notice = await communicationService.createNotice({ user: req.user, data: req.body });
  res.status(201).json({ success: true, notice });
});

const update = catchAsync(async (req, res) => {
  const notice = await communicationService.updateNotice({ user: req.user, id: req.params.id, data: req.body });
  res.json({ success: true, notice });
});

const remove = catchAsync(async (req, res) => {
  const notice = await communicationService.deleteNotice({ user: req.user, id: req.params.id });
  res.json({ success: true, deleted: notice });
});

module.exports = { list, get, create, update, remove };
