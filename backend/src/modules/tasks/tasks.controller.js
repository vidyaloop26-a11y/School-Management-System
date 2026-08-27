const { catchAsync } = require("../../lib/errors");
const tasksService = require("./tasks.service");

const getTasks = catchAsync(async (req, res) => {
  const data = await tasksService.getTasks(req.user, req.query);
  res.json({ success: true, tasks: data });
});

const getTaskById = catchAsync(async (req, res) => {
  const task = await tasksService.getTaskById(req.params.id, req.user);
  res.json({ success: true, task });
});

const createTask = catchAsync(async (req, res) => {
  const task = await tasksService.createTask({ user: req.user, data: req.body });
  res.status(201).json({ success: true, task });
});

const updateTask = catchAsync(async (req, res) => {
  const task = await tasksService.updateTask({ id: req.params.id, data: req.body, user: req.user });
  res.json({ success: true, task });
});

const deleteTask = catchAsync(async (req, res) => {
  const deleted = await tasksService.deleteTask({ id: req.params.id, user: req.user });
  res.json({ success: true, deleted });
});

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask };
