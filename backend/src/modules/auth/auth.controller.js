const prisma = require("../../lib/prisma");
const { catchAsync, ApiError } = require("../../lib/errors");
const authService = require("./auth.service");

const bootstrapSuperAdmin = catchAsync(async (req, res) => {
  const existing = await prisma.user.count({ where: { role: "superAdmin" } });
  if (existing > 0) throw new ApiError(403, "Super admin already exists");

  const user = await authService.createSuperAdmin(req.body);
  res.status(201).json({ success: true, user });
});

const login = catchAsync(async (req, res) => {
  const data = await authService.login({
    identifier: req.body.identifier,
    password: req.body.password,
  });
  res.json({ success: true, ...data });
});

const refresh = catchAsync(async (req, res) => {
  const data = await authService.refresh(req.body.refreshToken);
  res.json({ success: true, ...data });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.json({ success: true });
});

const me = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ success: true, user: authService.toSafeUser(user) });
});

module.exports = {
  bootstrapSuperAdmin,
  login,
  refresh,
  logout,
  me,
};