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

module.exports = {
  hashPassword,
  createSuperAdmin,
  login,
  refresh,
  logout,
  findUserByEmail: findByIdentifier,
  toSafeUser,
};