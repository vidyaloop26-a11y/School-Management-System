// One-off helper: initiates the local single-node MongoDB replica set
// (rs0) that Prisma requires when running against MongoDB.
// Usage: node scripts/init-replica-set.js
const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const rawUri = process.env.MONGO_URI || process.env.DATABASE_URL || "mongodb://127.0.0.1:27017";
// Strip database path and query params for admin connection
const hostMatch = rawUri.match(/mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?/);
const host = hostMatch ? hostMatch[0].replace("mongodb://", "") : "127.0.0.1:27017";
const uri = `mongodb://${host}`;

(async () => {
  const client = new MongoClient(uri, { directConnection: true });
  try {
    await client.connect();
    const admin = client.db("admin");
    const status = await admin.command({ replSetGetStatus: 1 }).catch(() => null);
    if (status && status.myState >= 1) {
      console.log("Replica set already initialised:", status.set, "-", status.myState);
      return;
    }
    await admin.command({
      replSetInitiate: { _id: "rs0", members: [{ _id: 0, host }] },
    });
    console.log(`Replica set rs0 initialised on ${host}`);
  } finally {
    await client.close();
  }
})().catch((err) => {
  console.error("Failed to initialise replica set:", err.message);
  process.exitCode = 1;
});