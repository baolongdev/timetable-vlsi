/**
 * Test Mongo connection:
 *   node --env-file=.env.local scripts/test-mongo.mjs
 */
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
if (!uri) {
  console.log("RESULT: FAIL")
  console.log("Set MONGODB_URI (e.g. node --env-file=.env.local scripts/test-mongo.mjs)")
  process.exit(2)
}

const dbName = process.env.MONGODB_DB || "timetable-vlsi"
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15_000 })

try {
  await client.connect()
  const ping = await client.db("admin").command({ ping: 1 })
  console.log("PING", ping)
  const db = client.db(dbName)
  const cols = await db.listCollections().toArray()
  console.log(
    `DB ${dbName} collections:`,
    cols.map((c) => c.name).join(", ") || "(empty ok)"
  )
  console.log("RESULT: OK")
  await client.close()
} catch (e) {
  console.log("RESULT: FAIL")
  console.log(e?.name + ":", e?.message)
  process.exit(1)
}
