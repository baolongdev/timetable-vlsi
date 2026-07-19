import { NextResponse } from "next/server"

import { getServerUpdatedAt, hasMongo } from "@/lib/mongo"

export const dynamic = "force-dynamic"

/** GET: Mongo đã cấu hình chưa + updatedAt */
export async function GET() {
  if (!hasMongo()) {
    return NextResponse.json({ configured: false, updatedAt: 0 })
  }
  try {
    const updatedAt = await getServerUpdatedAt()
    return NextResponse.json({ configured: true, updatedAt })
  } catch (e) {
    console.error("[api/data/status]", e)
    return NextResponse.json(
      { configured: true, updatedAt: 0, error: "mongo_unreachable" },
      { status: 502 }
    )
  }
}
