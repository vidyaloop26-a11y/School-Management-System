const service = require("./certificates.service");

async function listCertificates(req, res, next) {
  try {
    const result = await service.listCertificates({ user: req.user, query: req.query });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function issueCertificate(req, res, next) {
  try {
    const result = await service.issueCertificate({ user: req.user, data: req.body });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function requestCertificate(req, res, next) {
  try {
    const result = await service.requestCertificate({ user: req.user, data: req.body });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCertificates,
  issueCertificate,
  requestCertificate,
};
