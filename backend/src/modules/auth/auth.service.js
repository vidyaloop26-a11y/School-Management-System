const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma = require("../../lib/prisma");
const env = require("../../config/env");
const { ApiError } = require("../../lib/errors");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../../utils/tokens");

const hashPassword = (plain) => bcrypt.hash(plain, 10);
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

async function findByIdentifier(identifier) {
  const key = identifier.toLowerCase().trim();
  return prisma.user.findFirst({
    where: {
      OR: [{ email: key }, { username: key }],
    },
  });
}

async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
}

// Creates the very first superAdmin. Guarded at the controller layer so it
// can only ever run while no superAdmin exists.
async function createSuperAdmin({ name, email, password }) {
  const finalEmail = email.toLowerCase().trim();
  if (await findUserByEmail(finalEmail)) {
    throw new ApiError(409, "A user with that email already exists");
  }
  const user = await prisma.user.create({
    data: {
      name: name || "Super Admin",
      email: finalEmail,
      username: finalEmail, // MongoDB unique index requires a non-null username
      passwordHash: await hashPassword(password),
      role: "superAdmin",
      mustChangePassword: false,
    },
  });
  return toSafeUser(user);
}

async function login({ identifier, password }) {
  const user = await findByIdentifier(identifier);
  if (!user || !user.isActive) throw new ApiError(401, "Invalid credentials");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Invalid credentials");

  const refreshToken = signRefreshToken(user);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + env.refreshTtlDays * 24 * 60 * 60 * 1000),
    },
  });

  return {
    user: toSafeUser(user),
    accessToken: signAccessToken(user),
    refreshToken,
  };
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new ApiError(401, "Refresh token revoked or expired");
  }

  const newRefreshToken = signRefreshToken(stored.user);
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: {
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + env.refreshTtlDays * 24 * 60 * 60 * 1000),
    },
  });

  return {
    user: toSafeUser(stored.user),
    accessToken: signAccessToken(stored.user),
    refreshToken: newRefresh,
  };
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revoked: false },
    data: { revoked: true },
  });
}

function toSafeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    schoolId: user.schoolId,
    studentId: user.studentId,
    staffId: user.staffId,
    mustChangePassword: user.mustChangePassword,
  };
}

module.exports = {
  hashPassword,
  hashToken,
  createSuperAdmin,
  login,
  refresh,
  logout,
  toSafeUser,
  findUserByEmail,
};