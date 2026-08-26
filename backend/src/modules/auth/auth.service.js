const bcrypt = require("bcryptjs");
const prisma = require("../../lib/prisma");
const env = require("../../config/env");
const { ApiError } = require("../../lib/errors");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require("../../utils/tokens");

const SALT_ROUNDS = 10;

const toSafeUser = (u) => {
  const { passwordHash, ...safe } = u;
  return safe;
};

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function findByIdentifier(identifier) {
  const clean = identifier.trim();
  return prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: clean, mode: "insensitive" } },
        { username: { equals: clean, mode: "insensitive" } },
      ],
    },
  });
}

async function createSuperAdmin(data) {
  const existing = await findByIdentifier(data.email);
  if (existing) return toSafeUser(existing);
  const password = data.password || env.superAdmin.password;
  const user = await prisma.user.create({
    data: {
      name: data.name || env.superAdmin.name,
      email: data.email.toLowerCase().trim(),
      username: data.email.toLowerCase().trim(),
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

  // Prune expired refresh tokens database-wide to keep the collection clean
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  const refreshToken = signRefreshToken(user);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: hashToken(refreshToken),
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
    where: { token: tokenHash },
    include: { user: true },
  });
  if (!stored || stored.expiresAt < new Date()) {
    throw new ApiError(401, "Refresh token revoked or expired");
  }

  // Prune expired refresh tokens
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  const newRefreshToken = signRefreshToken(stored.user);
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: {
      token: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + env.refreshTtlDays * 24 * 60 * 60 * 1000),
    },
  });

  return {
    user: toSafeUser(stored.user),
    accessToken: signAccessToken(stored.user),
    refreshToken: newRefreshToken,
  };
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.deleteMany({
    where: { token: tokenHash },
  });
}

// Self-service password change. Verifies the current password, rotates the
// hash and clears the mustChangePassword flag.
async function changePassword({ user, currentPassword, newPassword }) {
  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record) throw new ApiError(401, "Account not found");

  const valid = await bcrypt.compare(currentPassword, record.passwordHash);
  if (!valid) throw new ApiError(401, "Current password is incorrect");

  const passwordHash = await hashPassword(newPassword);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
  });

  // Rotate sessions: old refresh tokens are revoked so a stolen session
  // can't outlive a password change.
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  const refreshToken = signRefreshToken(updated);
  await prisma.refreshToken.create({
    data: {
      userId: updated.id,
      token: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + env.refreshTtlDays * 24 * 60 * 60 * 1000),
    },
  });

  return {
    user: toSafeUser(updated),
    accessToken: signAccessToken(updated),
    refreshToken,
  };
}

module.exports = {
  hashPassword,
  createSuperAdmin,
  login,
  refresh,
  logout,
  changePassword,
  findUserByEmail: findByIdentifier,
  toSafeUser,
};