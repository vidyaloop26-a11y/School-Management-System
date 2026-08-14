const { catchAsync } = require("../../lib/errors");
const examService = require("./examination.service");

const getRoster = catchAsync(async (req, res) => {
  const data = await examService.listClassExamRoster({ user: req.user, query: req.query });
  res.json({ success: true, ...data });
});

const saveMarks = catchAsync(async (req, res) => {
  const data = await examService.saveExamMarks({ user: req.user, data: req.body });
  res.json({ success: true, ...data });
});

const getReportCard = catchAsync(async (req, res) => {
  const data = await examService.generateReportCard({ user: req.user, query: req.query });
  res.json({ success: true, ...data });
});

module.exports = {
  getRoster,
  saveMarks,
  getReportCard,
};
