import { NextRequest, NextResponse } from "next/server"

import { hasMongo, presenceCol, type PresenceDoc } from "@/lib/mongo"
import type { PresenceUser } from "@/types/presence"

export const dynamic = "force-dynamic"

/** Coi online nếu heartbeat trong khoảng này */
const ONLINE_MS = 45_000
/** Dọn bản ghi cũ hơn */
const STALE_MS = 120_000

function toUser(doc: PresenceDoc): PresenceUser {
  return {
    sessionId: doc.sessionId,
    displayName: doc.displayName,
    anonymous: doc.anonymous,
    path: doc.path,
    lastSeen: doc.lastSeen,
  }
}

/** GET — danh sách người đang online */
export async function GET() {
  if (!hasMongo()) {
    return NextResponse.json({
      configured: false,
      users: [] as PresenceUser[],
      count: 0,
    })
  }

  try {
    const col = await presenceCol()
    const now = Date.now()
    // Dọn stale (best-effort)
    await col.deleteMany({ lastSeen: { $lt: now - STALE_MS } })

    const docs = await col
      .find({ lastSeen: { $gte: now - ONLINE_MS } })
      .sort({ lastSeen: -1 })
      .limit(50)
      .toArray()

    const users = docs.map(toUser)
    return NextResponse.json({
      configured: true,
      users,
      count: users.length,
    })
  } catch (e) {
    console.error("[api/presence GET]", e)
    return NextResponse.json(
      { configured: true, users: [], count: 0, error: "mongo_error" },
      { status: 502 }
    )
  }
}

/** POST — heartbeat / cập nhật tên */
export async function POST(request: NextRequest) {
  if (!hasMongo()) {
    return NextResponse.json({ error: "mongo_not_configured" }, { status: 503 })
  }

  try {
    const body = (await request.json()) as {
      sessionId?: unknown
      displayName?: unknown
      anonymous?: unknown
      path?: unknown
    }

    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.trim() : ""
    if (!sessionId || sessionId.length > 80) {
      return NextResponse.json({ error: "invalid_session" }, { status: 400 })
    }

    const anonymous = Boolean(body.anonymous)
    let displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : ""
    if (anonymous || !displayName) {
      displayName = "Ẩn danh"
    }
    if (displayName.length > 40) displayName = displayName.slice(0, 40)

    const path =
      typeof body.path === "string" ? body.path.slice(0, 200) : undefined
    const now = Date.now()

    const col = await presenceCol()
    const doc: PresenceDoc = {
      _id: sessionId,
      sessionId,
      displayName,
      anonymous: anonymous || displayName === "Ẩn danh",
      path,
      lastSeen: now,
    }
    await col.replaceOne({ _id: sessionId }, doc, { upsert: true })
    await col.deleteMany({ lastSeen: { $lt: now - STALE_MS } })

    const docs = await col
      .find({ lastSeen: { $gte: now - ONLINE_MS } })
      .sort({ lastSeen: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({
      ok: true,
      users: docs.map(toUser),
      count: docs.length,
    })
  } catch (e) {
    console.error("[api/presence POST]", e)
    return NextResponse.json({ error: "mongo_error" }, { status: 502 })
  }
}

/** DELETE — rời trang (best-effort) */
export async function DELETE(request: NextRequest) {
  if (!hasMongo()) {
    return NextResponse.json({ ok: true })
  }

  try {
    const sessionId =
      request.nextUrl.searchParams.get("sessionId")?.trim() ||
      ((await request.json().catch(() => null)) as { sessionId?: string } | null)
        ?.sessionId

    if (sessionId) {
      const col = await presenceCol()
      await col.deleteOne({ _id: sessionId })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[api/presence DELETE]", e)
    return NextResponse.json({ ok: true })
  }
}
