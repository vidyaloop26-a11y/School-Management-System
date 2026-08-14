const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

const TEST_USER = {
  identifier: "testadmin@vidyaloop.in",
  password: "Test@1234",
  name: "Test Admin",
};

let refreshToken;
let accessToken;

before(async () => {
  await prisma.$connect();
  await prisma.user.deleteMany({ where: { email: TEST_USER.identifier } });
});

after(async () => {
  await prisma.refreshToken.deleteMany({
    where: { user: { email: TEST_USER.identifier } },
  });
  await prisma.user.deleteMany({ where: { email: TEST_USER.identifier } });
  await prisma.$disconnect();
});

describe("Auth API", () => {
  describe("POST /api/auth/bootstrap", () => {
    it("should create a super admin when none exists", async () => {
      const existing = await prisma.user.count({ where: { role: "superAdmin" } });
      if (existing > 0) {
        console.log("  (skipped: super admin already exists)");
        return;
      }

      const res = await request(app)
        .post("/api/auth/bootstrap")
        .send({
          name: TEST_USER.name,
          email: TEST_USER.identifier,
          password: TEST_USER.password,
        })
        .expect(201);

      assert.equal(res.body.success, true);
      assert.equal(res.body.user.email, TEST_USER.identifier);
      assert.equal(res.body.user.role, "superAdmin");
    });

    it("should reject bootstrap if super admin already exists", async () => {
      const existing = await prisma.user.count({ where: { role: "superAdmin" } });
      if (existing === 0) {
        console.log("  (skipped: no super admin to test rejection)");
        return;
      }

      const res = await request(app)
        .post("/api/auth/bootstrap")
        .send({ email: "another@test.com", password: "Test@1234" })
        .expect(403);

      assert.equal(res.body.success, false);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid email and password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ identifier: TEST_USER.identifier, password: TEST_USER.password })
        .expect(200);

      assert.equal(res.body.success, true);
      assert.ok(res.body.accessToken, "accessToken should be returned");
      assert.ok(res.body.refreshToken, "refreshToken should be returned");
      assert.ok(res.body.user, "user should be returned");
      assert.equal(res.body.user.email, TEST_USER.identifier);

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it("should reject login with wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ identifier: TEST_USER.identifier, password: "wrongpassword" })
        .expect(401);

      assert.equal(res.body.success, false);
      assert.equal(res.body.message, "Invalid credentials");
    });

    it("should reject login with non-existent user", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ identifier: "nonexistent@test.com", password: "Test@1234" })
        .expect(401);

      assert.equal(res.body.success, false);
    });

    it("should reject login with empty fields", async () => {
      await request(app)
        .post("/api/auth/login")
        .send({ identifier: "", password: "" })
        .expect(422);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return current user with valid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.user.email, TEST_USER.identifier);
    });

    it("should reject request without token", async () => {
      await request(app).get("/api/auth/me").expect(401);
    });

    it("should reject request with invalid token", async () => {
      await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token-here")
        .expect(401);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should return new tokens with valid refresh token", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      assert.equal(res.body.success, true);
      assert.ok(res.body.accessToken, "new accessToken should be returned");
      assert.ok(res.body.refreshToken, "new refreshToken should be returned");

      // Update tokens for subsequent tests
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it("should reject with invalid refresh token", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "invalid-refresh-token" })
        .expect(401);

      assert.equal(res.body.success, false);
    });

    it("should reject with empty refresh token", async () => {
      await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "" })
        .expect(422);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should revoke refresh token on logout", async () => {
      // First login to get a fresh token
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ identifier: TEST_USER.identifier, password: TEST_USER.password })
        .expect(200);

      const logoutRefreshToken = loginRes.body.refreshToken;

      const res = await request(app)
        .post("/api/auth/logout")
        .send({ refreshToken: logoutRefreshToken })
        .expect(200);

      assert.equal(res.body.success, true);

      // Verify the revoked token can no longer be used
      const refreshRes = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: logoutRefreshToken })
        .expect(401);

      assert.equal(refreshRes.body.success, false);
    });
  });
});
