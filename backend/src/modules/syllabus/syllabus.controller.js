const { catchAsync } = require("../../lib/errors");
const syllabusService = require("./syllabus.service");

const getTopics = catchAsync(async (req, res) => {
  const data = await syllabusService.getTopics(req.user, req.query);
  res.json({ success: true, topics: data });
});

const createTopic = catchAsync(async (req, res) => {
  const topic = await syllabusService.createTopic({ user: req.user, data: req.body });
  res.status(201).json({ success: true, topic });
});

const updateTopic = catchAsync(async (req, res) => {
  const topic = await syllabusService.updateTopic({ id: req.params.id, data: req.body, user: req.user });
  res.json({ success: true, topic });
});

const markCompleted = catchAsync(async (req, res) => {
  const progress = await syllabusService.markCompleted({ id: req.params.id, user: req.user, notes: req.body.notes });
  res.json({ success: true, progress });
});

const getPaceDashboard = catchAsync(async (req, res) => {
  const data = await syllabusService.getPaceDashboard(req.user, req.query);
  res.json({ success: true, dashboard: data });
});

module.exports = { getTopics, createTopic, updateTopic, markCompleted, getPaceDashboard };
