// One-off helper: initiates the local single-node MongoDB replica set
// (rs0) that Prisma requires when running against MongoDB.
// Usage: node scripts/init-replica-set.js
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27018";

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
      replSetInitiate: { _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27018" }] },
    });
    console.log("Replica set rs0 initialised on 127.0.0.1:27018");
  } finally {
    await client.close();
  }
})().catch((err) => {
  console.error("Failed to initialise replica set:", err.message);
  process.exitCode = 1;
});