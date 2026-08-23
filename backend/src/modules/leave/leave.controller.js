const service = require("./leave.service");

async function listLeaves(req, res, next) {
  try {
    const result = await service.listLeaves({ user: req.user, query: req.query });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function applyLeave(req, res, next) {
  try {
    const result = await service.applyLeave({ user: req.user, data: req.body });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const result = await service.updateStatus({ user: req.user, id: req.params.id, data: req.body });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listLeaves,
  applyLeave,
  updateStatus,
};
