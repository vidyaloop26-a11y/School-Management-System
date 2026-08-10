const { catchAsync } = require("../../lib/errors");
const attendanceService = require("./attendance.service");

const getByClass = catchAsync(async (req, res) => {
  const data = await attendanceService.listByClass({
    user: req.user,
    cls: req.query.cls,
    section: req.query.section,
    date: req.query.date,
  });
  res.json({ success: true, ...data });
});

const mark = catchAsync(async (req, res) => {
  const data = await attendanceService.markBulk({ user: req.user, data: req.body });
  res.json({ success: true, ...data });
});

const getForStudent = catchAsync(async (req, res) => {
  const data = await attendanceService.getStudentAttendance({
    user: req.user,
    studentId: req.query.studentId,
    month: req.query.month,
    year: req.query.year,
  });
  res.json({ success: true, ...data });
});

module.exports = { getByClass, mark, getForStudent };