const { catchAsync } = require("../../lib/errors");
const settingsService = require("./settings.service");

const getSettings = catchAsync(async (req, res) => {
  const data = await settingsService.getSettings(req.user);
  res.json({ success: true, settings: data });
});

const updateSettings = catchAsync(async (req, res) => {
  const data = await settingsService.updateSettings(req.user, req.body);
  res.json({ success: true, settings: data });
});

const listEvents = catchAsync(async (req, res) => {
  const data = await settingsService.listEvents(req.user, req.query);
  res.json({ success: true, events: data });
});

const createEvent = catchAsync(async (req, res) => {
  const data = await settingsService.createEvent(req.user, req.body);
  res.json({ success: true, event: data });
});

const deleteEvent = catchAsync(async (req, res) => {
  await settingsService.deleteEvent(req.user, req.params.id);
  res.json({ success: true });
});

const syncHolidays = catchAsync(async (req, res) => {
  const { year, country } = req.body;
  const data = await settingsService.syncHolidays(req.user, year, country);
  res.json({ success: true, ...data });
});

const listSubjects = catchAsync(async (req, res) => {
  const data = await settingsService.listSubjects(req.user);
  res.json({ success: true, subjects: data });
});

const createSubject = catchAsync(async (req, res) => {
  const data = await settingsService.createSubject(req.user, req.body);
  res.json({ success: true, subject: data });
});

const deleteSubject = catchAsync(async (req, res) => {
  await settingsService.deleteSubject(req.user, req.params.id);
  res.json({ success: true });
});

const reorderSubjects = catchAsync(async (req, res) => {
  await settingsService.reorderSubjects(req.user, req.body.subjectIds);
  res.json({ success: true });
});

module.exports = {
  getSettings,
  updateSettings,
  listEvents,
  createEvent,
  deleteEvent,
  syncHolidays,
  listSubjects,
  createSubject,
  deleteSubject,
  reorderSubjects,
};
