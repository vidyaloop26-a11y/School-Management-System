const { catchAsync } = require("../../lib/errors");
const diaryService = require("./diary.service");

const listEntries = catchAsync(async (req, res) => {
  const data = await diaryService.listEntries({ user: req.user, query: req.query });
  res.json({ success: true, entries: data });
});

const createEntry = catchAsync(async (req, res) => {
  const entry = await diaryService.createEntry({ user: req.user, data: req.body });
  res.status(201).json({ success: true, entry });
});

module.exports = { listEntries, createEntry };
