const service = require("./finance.service");

async function listRecords(req, res, next) {
  try {
    const result = await service.listRecords({ user: req.user, query: req.query });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function createRecord(req, res, next) {
  try {
    const result = await service.createRecord({ user: req.user, data: req.body });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listRecords,
  createRecord,
};
