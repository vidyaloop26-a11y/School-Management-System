const { catchAsync } = require("../../lib/errors");
const transportService = require("./transport.service");

const listRoutes = catchAsync(async (req, res) => {
  const data = await transportService.getRoutes(req.user);
  res.json({ success: true, routes: data });
});

const getRoute = catchAsync(async (req, res) => {
  const data = await transportService.getRouteById(req.params.id, req.user);
  res.json({ success: true, route: data });
});

const createRoute = catchAsync(async (req, res) => {
  const data = await transportService.createRoute({ user: req.user, data: req.body });
  res.status(201).json({ success: true, route: data });
});

const updateRoute = catchAsync(async (req, res) => {
  const data = await transportService.updateRoute({ id: req.params.id, data: req.body, user: req.user });
  res.json({ success: true, route: data });
});

const deleteRoute = catchAsync(async (req, res) => {
  const data = await transportService.deleteRoute({ id: req.params.id, user: req.user });
  res.json({ success: true, deleted: data });
});

const listVehicles = catchAsync(async (req, res) => {
  const data = await transportService.getVehicles(req.user);
  res.json({ success: true, vehicles: data });
});

const createVehicle = catchAsync(async (req, res) => {
  const data = await transportService.createVehicle({ user: req.user, data: req.body });
  res.status(201).json({ success: true, vehicle: data });
});

const updateVehicle = catchAsync(async (req, res) => {
  const data = await transportService.updateVehicle({ id: req.params.id, data: req.body, user: req.user });
  res.json({ success: true, vehicle: data });
});

const deleteVehicle = catchAsync(async (req, res) => {
  const data = await transportService.deleteVehicle({ id: req.params.id, user: req.user });
  res.json({ success: true, deleted: data });
});

const assignStudent = catchAsync(async (req, res) => {
  const data = await transportService.assignStudent({ user: req.user, data: req.body });
  res.status(201).json({ success: true, assignment: data });
});

const removeStudent = catchAsync(async (req, res) => {
  const data = await transportService.removeStudent({ id: req.params.id, user: req.user });
  res.json({ success: true, deleted: data });
});

module.exports = {
  listRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  assignStudent,
  removeStudent,
};
