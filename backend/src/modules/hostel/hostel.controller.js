const { catchAsync } = require("../../lib/errors");
const hostelService = require("./hostel.service");

const listBuildings = catchAsync(async (req, res) => {
  const data = await hostelService.getBuildings(req.user);
  res.json({ success: true, buildings: data });
});

const addBuilding = catchAsync(async (req, res) => {
  const data = await hostelService.createBuilding({ user: req.user, data: req.body });
  res.json({ success: true, building: data });
});

const editBuilding = catchAsync(async (req, res) => {
  const data = await hostelService.updateBuilding({ id: req.params.id, data: req.body, user: req.user });
  res.json({ success: true, building: data });
});

const removeBuilding = catchAsync(async (req, res) => {
  const data = await hostelService.deleteBuilding({ id: req.params.id, user: req.user });
  res.json({ success: true, deleted: data });
});

const listRooms = catchAsync(async (req, res) => {
  const data = await hostelService.getRooms(req.user, req.query);
  res.json({ success: true, rooms: data });
});

const addRoom = catchAsync(async (req, res) => {
  const data = await hostelService.createRoom({ user: req.user, data: req.body });
  res.json({ success: true, room: data });
});

const assignStudent = catchAsync(async (req, res) => {
  const data = await hostelService.assignBed({ user: req.user, data: req.body });
  res.json({ success: true, assignment: data });
});

const removeAssignment = catchAsync(async (req, res) => {
  const data = await hostelService.unassignBed({ id: req.params.id, user: req.user });
  res.json({ success: true, deleted: data });
});

const listMaintenance = catchAsync(async (req, res) => {
  const data = await hostelService.getMaintenanceRequests(req.user, req.query);
  res.json({ success: true, requests: data });
});

const addMaintenance = catchAsync(async (req, res) => {
  const data = await hostelService.createMaintenanceRequest({ user: req.user, data: req.body });
  res.json({ success: true, request: data });
});

const editMaintenance = catchAsync(async (req, res) => {
  const data = await hostelService.updateMaintenanceRequest({ id: req.params.id, data: req.body, user: req.user });
  res.json({ success: true, request: data });
});

module.exports = {
  listBuildings,
  addBuilding,
  editBuilding,
  removeBuilding,
  listRooms,
  addRoom,
  assignStudent,
  removeAssignment,
  listMaintenance,
  addMaintenance,
  editMaintenance,
};
