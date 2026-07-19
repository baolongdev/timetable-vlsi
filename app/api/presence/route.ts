import { NextRequest, NextResponse } from "next/server"

import {
  getClientIp,
  hashClientIp,
  shortClientLabel,
} from "@/lib/client-ip"
import { hasMongo, presenceCol, type PresenceDoc } from "@/lib/mongo"
import type { PresenceUser } from "@/types/presence"

export const dynamic = "force-dynamic"

/** Coi online nếu heartbeat trong khoảng này */
const ONLINE_MS = 45_000
/** Dọn bản ghi cũ hơn */
const STALE_MS = 120_000

function toUser(doc: PresenceDoc, selfKey: string): PresenceUser {
  return {
    clientKey: doc.clientKey,
    networkTag: shortClientLabel(doc.clientKey),
    displayName: doc.displayName,
    anonymous: doc.anonymous,
    path: doc.path,
    lastSeen: doc.lastSeen,
    isSelf: doc.clientKey === selfKey,
  }
}

function selfKeyFromRequest(request: NextRequest): string {
  return hashClientIp(getClientIp(request))
}

/** GET — danh sách người đang online (identity = IP hash) */
export async function GET(request: NextRequest) {
  if (!hasMongo()) {
    return NextResponse.json({
      configured: false,
      users: [] as PresenceUser[],
      count: 0,
      selfKey: null as string | null,
    })
  }

  try {
    const selfKey = selfKeyFromRequest(request)
    const col = await presenceCol()
    const now = Date.now()
    await col.deleteMany({ lastSeen: { $lt: now - STALE_MS } })

    const docs = await col
      .find({ lastSeen: { $gte: now - ONLINE_MS } })
      .sort({ lastSeen: -1 })
      .limit(50)
      .toArray()

    const users = docs.map((d) => toUser(d, selfKey))
    return NextResponse.json({
      configured: true,
      users,
      count: users.length,
      selfKey,
    })
  } catch (e) {
    console.error("[api/presence GET]", e)
    return NextResponse.json(
      {
        configured: true,
        users: [],
        count: 0,
        selfKey: null,
        error: "mongo_error",
      },
      { status: 502 }
    )
  }
}

/**
 * POST — heartbeat / cập nhật tên hiển thị.
 * Identity lấy từ IP server-side — bỏ qua mọi id do client gửi.
 */
export async function POST(request: NextRequest) {
  if (!hasMongo()) {
    return NextResponse.json({ error: "mongo_not_configured" }, { status: 503 })
  }

  try {
    const body = (await request.json()) as {
      displayName?: unknown
      anonymous?: unknown
      path?: unknown
      // sessionId cũ — bỏ qua (không tin client)
      sessionId?: unknown
    }
    void body.sessionId

    const clientKey = selfKeyFromRequest(request)
    if (!clientKey || clientKey === hashClientIp("unknown")) {
      // Vẫn cho hoạt động nhưng gắn "unknown" — hiếm khi xảy ra trên Vercel
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
      _id: clientKey,
      clientKey,
      displayName,
      anonymous: anonymous || displayName === "Ẩn danh",
      path,
      lastSeen: now,
    }
    // replace theo _id = IP hash → 1 mạng = 1 người (nhiều tab gộp 1)
    await col.replaceOne({ _id: clientKey }, doc, { upsert: true })
    await col.deleteMany({ lastSeen: { $lt: now - STALE_MS } })

    // Dọn schema cũ (sessionId client-generated) nếu còn
    await col.deleteMany({
      sessionId: { $exists: true },
      clientKey: { $exists: false },
    } as never)

    const docs = await col
      .find({ lastSeen: { $gte: now - ONLINE_MS } })
      .sort({ lastSeen: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({
      ok: true,
      users: docs.map((d) => toUser(d, clientKey)),
      count: docs.length,
      selfKey: clientKey,
    })
  } catch (e) {
    console.error("[api/presence POST]", e)
    return NextResponse.json({ error: "mongo_error" }, { status: 502 })
  }
}

/**
 * DELETE — rời trang: xóa theo IP của request (không tin query client).
 */
export async function DELETE(request: NextRequest) {
  if (!hasMongo()) {
    return NextResponse.json({ ok: true })
  }

  try {
    const clientKey = selfKeyFromRequest(request)
    const col = await presenceCol()
    await col.deleteOne({ _id: clientKey })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[api/presence DELETE]", e)
    return NextResponse.json({ ok: true })
  }
}
