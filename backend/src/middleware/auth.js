const prisma = require("../lib/prisma");
const { ApiError, catchAsync } = require("../lib/errors");
const { verifyAccessToken } = require("../utils/tokens");

// Requires a valid Bearer access token. Attaches the full, fresh user record
// (with school scope) to req.user.
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
  next();
});

module.exports = { authenticate };