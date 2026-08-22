const service = require("./payroll.service");

async function listPayroll(req, res, next) {
  try {
    const result = await service.listPayroll({ user: req.user, query: req.query });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function processPayroll(req, res, next) {
  try {
    const result = await service.processPayroll({ user: req.user, data: req.body });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPayroll,
  processPayroll,
};
