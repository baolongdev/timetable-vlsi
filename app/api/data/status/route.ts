import { NextResponse } from "next/server"

import { getServerUpdatedAt, hasMongo } from "@/lib/mongo"

export const dynamic = "force-dynamic"

/** GET: Mongo đã cấu hình chưa + updatedAt */
export async function GET() {
  if (!hasMongo()) {
    return NextResponse.json(
      { configured: false, updatedAt: 0 },
      { headers: { "Cache-Control": "private, max-age=10" } }
    )
  }
  try {
    const updatedAt = await getServerUpdatedAt()
    const res = NextResponse.json({ configured: true, updatedAt })
    res.headers.set("Cache-Control", "private, max-age=10, stale-while-revalidate=30")
    res.headers.set("ETag", `"${updatedAt}"`)
    return res
  } catch (e) {
    console.error("[api/data/status]", e)
    return NextResponse.json(
      { configured: true, updatedAt: 0, error: "mongo_unreachable" },
      { status: 502 }
    )
  }
}
