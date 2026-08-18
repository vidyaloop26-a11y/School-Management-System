const { catchAsync } = require("../../lib/errors");
const attendanceService = require("./attendance.service");

const getByClass = catchAsync(async (req, res) => {
  const data = await attendanceService.listByClass({
    user: req.user,
    cls: req.query.cls || "8",
    section: req.query.section || "A",
    date: req.query.date,
    query: req.query,
  });
  res.json({ success: true, ...data });
});

const mark = catchAsync(async (req, res) => {
  const data = await attendanceService.markClassAttendance({ user: req.user, data: req.body });
  res.json({ success: true, ...data });
});

const getForStudent = catchAsync(async (req, res) => {
  const data = await attendanceService.studentSummary({
    user: req.user,
    studentId: req.query.studentId,
    month: req.query.month ? parseInt(req.query.month, 10) : undefined,
    year: req.query.year ? parseInt(req.query.year, 10) : undefined,
  });
  res.json({ success: true, ...data });
});

const markers = catchAsync(async (req, res) => {
  const data = await attendanceService.auditMarkers({ user: req.user, query: req.query });
  res.json({ success: true, ...data });
});

const clear = catchAsync(async (req, res) => {
  const data = await attendanceService.clearDayAttendance({ user: req.user, query: req.query });
  res.json({ success: true, ...data });
});

module.exports = { getByClass, mark, getForStudent, markers, clear };