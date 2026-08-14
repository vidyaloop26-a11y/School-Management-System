const { MongoClient } = require("mongodb");

async function main() {
  const client = new MongoClient("mongodb://127.0.0.1:27018");
  await client.connect();
  try {
    const admin = client.db().admin();
    const status = await admin.command({ replSetGetStatus: 1 });
    console.log("Replica set status:", status.ok ? "initialized" : "error");
  } catch (e) {
    if (e.codeName === "NotYetInitialized") {
      const admin = client.db().admin();
      await admin.command({
        replSetInitiate: {
          _id: "rs0",
          members: [{ _id: 0, host: "127.0.0.1:27018" }],
        },
      });
      console.log("Replica set initialized successfully");
      // Wait for it to be ready
      await new Promise((r) => setTimeout(r, 2000));
    } else {
      console.log("Error:", e.message);
    }
  } finally {
    await client.close();
  }
}

main().catch(console.error);
