const { catchAsync } = require("../../lib/errors");
const inventoryService = require("./inventory.service");

const getItems = catchAsync(async (req, res) => {
  const data = await inventoryService.getItems(req.user, req.query);
  res.json({ success: true, items: data });
});

const getLowStock = catchAsync(async (req, res) => {
  const data = await inventoryService.getLowStockItems(req.user);
  res.json({ success: true, items: data });
});

const getItemById = catchAsync(async (req, res) => {
  const data = await inventoryService.getItemById(req.params.id, req.user);
  res.json({ success: true, item: data });
});

const createItem = catchAsync(async (req, res) => {
  const data = await inventoryService.createItem({ user: req.user, data: req.body });
  res.status(201).json({ success: true, item: data });
});

const updateItem = catchAsync(async (req, res) => {
  const data = await inventoryService.updateItem({ id: req.params.id, data: req.body, user: req.user });
  res.json({ success: true, item: data });
});

const deleteItem = catchAsync(async (req, res) => {
  const data = await inventoryService.deleteItem({ id: req.params.id, user: req.user });
  res.json({ success: true, deleted: data });
});

const recordPurchase = catchAsync(async (req, res) => {
  const data = await inventoryService.recordPurchase({ user: req.user, data: req.body });
  res.status(201).json({ success: true, purchase: data });
});

const recordIssue = catchAsync(async (req, res) => {
  const data = await inventoryService.recordIssue({ user: req.user, data: req.body });
  res.status(201).json({ success: true, issue: data });
});

module.exports = {
  getItems,
  getLowStock,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  recordPurchase,
  recordIssue,
};
