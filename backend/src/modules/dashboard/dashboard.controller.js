const { catchAsync } = require("../../lib/errors");
const { dashboardFor } = require("./dashboard.service");

const get = catchAsync(async (req, res) => {
  const data = await dashboardFor(req.user);
  res.json({ success: true, ...data });
});

module.exports = { get };