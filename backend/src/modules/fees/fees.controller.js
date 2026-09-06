const { catchAsync } = require("../../lib/errors");
const feesService = require("./fees.service");

const getComponents = catchAsync(async (req, res) => {
  const data = await feesService.getComponents({ user: req.user, query: req.query });
  res.json({ success: true, components: data });
});

const createComponent = catchAsync(async (req, res) => {
  const component = await feesService.createComponent({ user: req.user, data: req.body });
  res.status(201).json({ success: true, component });
});

const getStructures = catchAsync(async (req, res) => {
  const data = await feesService.getStructures({ user: req.user, query: req.query });
  res.json({ success: true, structures: data });
});

const createStructure = catchAsync(async (req, res) => {
  const structure = await feesService.createStructure({ user: req.user, data: req.body });
  res.status(201).json({ success: true, structure });
});

const getLedger = catchAsync(async (req, res) => {
  const data = await feesService.getLedger({ user: req.user, query: req.query });
  res.json({ success: true, ledger: data });
});

const createLedgerEntry = catchAsync(async (req, res) => {
  const entry = await feesService.createLedgerEntry({ user: req.user, data: req.body });
  res.status(201).json({ success: true, entry });
});

const createLedgerBulk = catchAsync(async (req, res) => {
  const result = await feesService.createLedgerBulk({ user: req.user, data: req.body });
  res.status(201).json({ success: true, ...result });
});

const recordPayment = catchAsync(async (req, res) => {
  const result = await feesService.recordPayment({ user: req.user, data: req.body });
  res.status(201).json({ success: true, ...result });
});

const getSummary = catchAsync(async (req, res) => {
  const data = await feesService.getSummary({ user: req.user, query: req.query });
  res.json({ success: true, ...data });
});

const getReceipt = catchAsync(async (req, res) => {
  const payment = await feesService.getReceipt(req.params.id, req.user);
  res.json({ success: true, payment });
});

const getStudentHistory = catchAsync(async (req, res) => {
  const data = await feesService.getStudentHistory({ user: req.user, studentId: req.params.studentId });
  res.json({ success: true, ...data });
});

module.exports = {
  getComponents,
  createComponent,
  getStructures,
  createStructure,
  getLedger,
  createLedgerEntry,
  createLedgerBulk,
  recordPayment,
  getSummary,
  getReceipt,
  getStudentHistory,
};
