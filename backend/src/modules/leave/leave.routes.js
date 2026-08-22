const express = require("express");
const controller = require("./leave.controller");
const { authenticate } = require("../../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.listLeaves);
router.post("/", controller.applyLeave);
router.post("/apply", controller.applyLeave);
router.put("/:id/status", controller.updateStatus);
router.patch("/:id/status", controller.updateStatus);

module.exports = router;
