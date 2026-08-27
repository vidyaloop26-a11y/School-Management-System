const { catchAsync } = require("../../lib/errors");
const copyCheckingService = require("./copychecking.service");

const getBatches = catchAsync(async (req, res) => {
  const data = await copyCheckingService.getBatches(req.user, req.query);
  res.json({ success: true, batches: data });
});

const getBatchById = catchAsync(async (req, res) => {
  const batch = await copyCheckingService.getBatchById(req.params.id, req.user);
  res.json({ success: true, batch });
});

const createBatch = catchAsync(async (req, res) => {
  const batch = await copyCheckingService.createBatch({ user: req.user, data: req.body });
  res.status(201).json({ success: true, batch });
});

const addEntry = catchAsync(async (req, res) => {
  const entry = await copyCheckingService.addEntry({ batchId: req.params.batchId, data: req.body, user: req.user });
  res.status(201).json({ success: true, entry });
});

const updateEntry = catchAsync(async (req, res) => {
  const entry = await copyCheckingService.updateEntry({ entryId: req.params.entryId, data: req.body, user: req.user });
  res.json({ success: true, entry });
});

const deleteBatch = catchAsync(async (req, res) => {
  const deleted = await copyCheckingService.deleteBatch({ id: req.params.id, user: req.user });
  res.json({ success: true, deleted });
});

module.exports = { getBatches, getBatchById, createBatch, addEntry, updateEntry, deleteBatch };
