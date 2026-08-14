const { catchAsync } = require("../../lib/errors");
const examinationService = require("./examination.service");

const getRoster = catchAsync(async (req, res) => {
  const data = await examinationService.listClassExamRoster({
    user: req.user,
    query: req.query,
  });
  res.json({ success: true, ...data });
});

const saveMarks = catchAsync(async (req, res) => {
  const data = await examinationService.saveExamMarks({
    user: req.user,
    data: req.body,
  });
  res.json({ success: true, ...data });
});

const getReportCard = catchAsync(async (req, res) => {
  const data = await examinationService.getStudentReportCard({
    user: req.user,
    query: req.query,
  });
  res.json({ success: true, ...data });
});

module.exports = {
  getRoster,
  saveMarks,
  getReportCard,
};
