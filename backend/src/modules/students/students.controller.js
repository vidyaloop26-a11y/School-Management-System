const { catchAsync, ApiError } = require("../../lib/errors");
const studentsService = require("./students.service");
const { ROLES } = require("../../middleware/rbac");

const list = catchAsync(async (req, res) => {
  const data = await studentsService.listStudents({ user: req.user, query: req.query });
  res.json({ success: true, ...data });
});

const get = catchAsync(async (req, res) => {
  const student = await studentsService.getStudent({ user: req.user, id: req.params.id });
  res.json({ success: true, student });
});

const create = catchAsync(async (req, res) => {
  const result = await studentsService.createStudent({ user: req.user, data: req.body });
  res.status(201).json({ success: true, ...result });
});

const update = catchAsync(async (req, res) => {
  const isTeacherCorrection = req.user.role === ROLES.TEACHER;
  if (req.user.role === ROLES.PARENT) {
    throw new ApiError(403, "Parents cannot edit student records");
  }
  const student = await studentsService.updateStudent({
    user: req.user,
    id: req.params.id,
    data: req.body,
    isTeacherCorrection,
  });
  res.json({ success: true, student });
});

const remove = catchAsync(async (req, res) => {
  const student = await studentsService.deleteStudent({ user: req.user, id: req.params.id });
  res.json({ success: true, deleted: student });
});

const bulkCreate = catchAsync(async (req, res) => {
  const students = req.body.students || req.body.studentList || [];
  const result = await studentsService.bulkCreateStudents({ user: req.user, students });
  res.status(201).json({ success: true, ...result });
});

const bulkDelete = catchAsync(async (req, res) => {
  const ids = req.body.ids || [];
  const result = await studentsService.bulkDeleteStudents({ user: req.user, ids });
  res.json({ success: true, ...result });
});

const resetParent = catchAsync(async (req, res) => {
  const result = await studentsService.resetParentPassword({ user: req.user, id: req.params.id });
  res.json({ success: true, ...result });
});

module.exports = { list, get, create, bulkCreate, update, remove, bulkDelete, resetParent };