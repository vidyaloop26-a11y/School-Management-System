const { catchAsync } = require("../../lib/errors");
const timetableService = require("./timetable.service");

const getClass = catchAsync(async (req, res) => {
  const data = await timetableService.getClassTimetable({
    user: req.user,
    cls: req.query.cls || "8",
    section: req.query.section || "A",
    query: req.query,
  });
  res.json({ success: true, ...data });
});

const getByTeacher = catchAsync(async (req, res) => {
  const data = await timetableService.getStaffTimetable({
    user: req.user,
    staffId: req.query.staffId,
    query: req.query,
  });
  res.json({ success: true, ...data });
});

const upsertClass = catchAsync(async (req, res) => {
  const data = await timetableService.upsertSlot({ user: req.user, data: req.body });
  res.json({ success: true, slot: data });
});

const removeEntry = catchAsync(async (req, res) => {
  const entry = await timetableService.deleteEntry({ user: req.user, id: req.params.id });
  res.json({ success: true, deleted: entry });
});

module.exports = { getClass, getByTeacher, upsertClass, removeEntry };