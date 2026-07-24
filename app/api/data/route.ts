import { NextRequest, NextResponse } from "next/server"

import {
  getServerUpdatedAt,
  hasMongo,
  loadAllDepartments,
  loadAllLecturers,
} from "@/lib/mongo"

export const dynamic = "force-dynamic"

/** GET /api/data — full snapshot; ?since=ms → 304 nếu không đổi */
export async function GET(request: NextRequest) {
  if (!hasMongo()) {
    return NextResponse.json(
      { error: "mongo_not_configured", configured: false },
      { status: 503 }
    )
  }

  try {
    const sinceRaw = request.nextUrl.searchParams.get("since")
    const since = sinceRaw ? Number(sinceRaw) : 0
    const updatedAt = await getServerUpdatedAt()

    if (since > 0 && updatedAt > 0 && updatedAt <= since) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          "Cache-Control": "private, max-age=0, must-revalidate",
          ETag: `"${updatedAt}"`,
        },
      })
    }

    const [departments, lecturers] = await Promise.all([
      loadAllDepartments(),
      loadAllLecturers(),
    ])

    const res = NextResponse.json({
      configured: true,
      departments,
      lecturers,
      updatedAt: updatedAt || Date.now(),
    })
    res.headers.set(
      "Cache-Control",
      "private, max-age=5, stale-while-revalidate=30"
    )
    if (updatedAt) res.headers.set("ETag", `"${updatedAt}"`)
    return res
  } catch (e) {
    console.error("[api/data GET]", e)
    return NextResponse.json(
      { error: "mongo_error", configured: true },
      { status: 502 }
    )
  }
}
