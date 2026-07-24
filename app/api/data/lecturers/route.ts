import { NextRequest, NextResponse } from "next/server"

import {
  hasMongo,
  invalidateQueryCache,
  lecturerToDoc,
  lecturersCol,
  loadAllLecturers,
  touchMeta,
} from "@/lib/mongo"
import type { Lecturer } from "@/types/lecturer"
import { LECTURER_ROLES } from "@/types/lecturer"

export const dynamic = "force-dynamic"

function isLecturer(v: unknown): v is Lecturer {
  if (!v || typeof v !== "object") return false
  const l = v as Lecturer
  return (
    typeof l.id === "string" &&
    typeof l.name === "string" &&
    typeof l.role === "string" &&
    (LECTURER_ROLES as string[]).includes(l.role)
  )
}

/** GET — danh sách giảng viên */
export async function GET() {
  if (!hasMongo()) {
    return NextResponse.json({ error: "mongo_not_configured" }, { status: 503 })
  }
  try {
    const lecturers = await loadAllLecturers()
    const res = NextResponse.json({ lecturers })
    res.headers.set(
      "Cache-Control",
      "private, max-age=10, stale-while-revalidate=60"
    )
    return res
  } catch (e) {
    console.error("[api/data/lecturers GET]", e)
    return NextResponse.json({ error: "mongo_error" }, { status: 502 })
  }
}

/** PUT — replace toàn bộ danh sách */
export async function PUT(request: NextRequest) {
  if (!hasMongo()) {
    return NextResponse.json({ error: "mongo_not_configured" }, { status: 503 })
  }

  try {
    const body = (await request.json()) as { lecturers?: unknown }
    const list = body.lecturers
    if (!Array.isArray(list) || !list.every(isLecturer)) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 })
    }

    const now = Date.now()
    const col = await lecturersCol()
    const ids = new Set(list.map((l) => l.id))

    if (ids.size === 0) {
      await col.deleteMany({})
    } else {
      await col.deleteMany({ _id: { $nin: [...ids] } })
    }

    if (list.length > 0) {
      await col.bulkWrite(
        list.map((l) => ({
          replaceOne: {
            filter: { _id: l.id },
            replacement: lecturerToDoc(l, now),
            upsert: true,
          },
        }))
      )
    }

    await touchMeta({ lecturersAt: now })
    invalidateQueryCache()
    return NextResponse.json({ ok: true, updatedAt: now, count: list.length })
  } catch (e) {
    console.error("[api/data/lecturers PUT]", e)
    return NextResponse.json({ error: "mongo_error" }, { status: 502 })
  }
}
