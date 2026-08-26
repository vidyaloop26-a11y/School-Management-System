const prisma = require("../lib/prisma");
const { ApiError, catchAsync } = require("../lib/errors");
const { verifyAccessToken } = require("../utils/tokens");

// Paths a user may still access while flagged mustChangePassword.
const PASSWORD_CHANGE_EXEMPT = /\/api\/auth\/(login|refresh|logout|me|change-password)$/;

// Requires a valid Bearer access token. Attaches the full, fresh user record
// (with school scope) to req.user. Also enforces the mustChangePassword
// lifecycle: freshly provisioned or reset accounts can do nothing except
// authenticate, read their own profile and set a new password.
const authenticate = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new ApiError(401, "Authentication required");

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired access token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw new ApiError(401, "Account disabled or not found");

  req.user = user;

  if (
    user.mustChangePassword &&
    !PASSWORD_CHANGE_EXEMPT.test(req.originalUrl.split("?")[0])
  ) {
    throw Object.assign(new ApiError(403, "Password change required before using the platform"), {
      code: "PASSWORD_CHANGE_REQUIRED",
    });
  }

  next();
});

module.exports = { authenticate };
