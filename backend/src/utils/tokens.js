const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, schoolId: user.schoolId || null },
    env.accessSecret,
    { expiresIn: env.accessTtl }
  );
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user.id }, env.refreshSecret, {
    expiresIn: `${env.refreshTtlDays}d`,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshSecret);
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
};