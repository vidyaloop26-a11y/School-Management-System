const { catchAsync } = require("../../lib/errors");
const homeworkService = require("./homework.service");

const listHomework = catchAsync(async (req, res) => {
  const data = await homeworkService.listHomework({ user: req.user, query: req.query });
  res.json({ success: true, homework: data });
});

const createHomework = catchAsync(async (req, res) => {
  const homework = await homeworkService.createHomework({ user: req.user, data: req.body });
  res.status(201).json({ success: true, homework });
});

const updateHomework = catchAsync(async (req, res) => {
  const homework = await homeworkService.updateHomework({ id: req.params.id, data: req.body, user: req.user });
  res.json({ success: true, homework });
});

const deleteHomework = catchAsync(async (req, res) => {
  const deleted = await homeworkService.deleteHomework({ id: req.params.id, user: req.user });
  res.json({ success: true, deleted });
});

const submitHomework = catchAsync(async (req, res) => {
  const submission = await homeworkService.submitHomework({ id: req.params.id, data: req.body, user: req.user });
  res.json({ success: true, submission });
});

const getSubmissions = catchAsync(async (req, res) => {
  const submissions = await homeworkService.getSubmissions(req.params.id, req.user);
  res.json({ success: true, submissions });
});

module.exports = {
  listHomework,
  createHomework,
  updateHomework,
  deleteHomework,
  submitHomework,
  getSubmissions,
};
