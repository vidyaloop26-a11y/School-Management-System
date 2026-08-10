const router = require("express").Router();
const { authenticate } = require("../../middleware/auth");
const dashboardController = require("./dashboard.controller");

router.use(authenticate);
router.get("/", dashboardController.get);

module.exports = router;