const { catchAsync } = require("../../lib/errors");
const timetableService = require("./timetable.service");

const getClass = catchAsync(async (req, res) => {
  const data = await timetableService.getClassTimetable({
    user: req.user,
    cls: req.query.cls,
    section: req.query.section,
  });
  res.json({ success: true, ...data });
});

const getByTeacher = catchAsync(async (req, res) => {
  const entries = await timetableService.getStaffTimetable({
    user: req.user,
    staffId: req.query.staffId,
  });
  res.json({ success: true, entries });
});

const upsertClass = catchAsync(async (req, res) => {
  const data = await timetableService.upsertClassTimetable({ user: req.user, data: req.body });
  res.json({ success: true, ...data });
});

const removeEntry = catchAsync(async (req, res) => {
  const entry = await timetableService.deleteEntry({ user: req.user, id: req.params.id });
  res.json({ success: true, deleted: entry });
});

module.exports = { getClass, getByTeacher, upsertClass, removeEntry };