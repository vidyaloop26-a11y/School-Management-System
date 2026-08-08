const { catchAsync } = require("../../lib/errors");
const schoolsService = require("./schools.service");

const createSchool = catchAsync(async (req, res) => {
  const result = await schoolsService.createSchool(req.body);
  res.status(201).json({ success: true, ...result });
});

const listSchools = catchAsync(async (req, res) => {
  const schools = await schoolsService.listSchools();
  res.json({ success: true, schools });
});

const getSchool = catchAsync(async (req, res) => {
  const school = await schoolsService.getSchool(req.params.id);
  res.json({ success: true, school });
});

const updateSchool = catchAsync(async (req, res) => {
  const school = await schoolsService.updateSchool(req.params.id, req.body);
  res.json({ success: true, school });
});

const deleteSchool = catchAsync(async (req, res) => {
  const school = await schoolsService.deleteSchool(req.params.id);
  res.json({ success: true, deleted: school });
});

module.exports = { createSchool, listSchools, getSchool, updateSchool, deleteSchool };