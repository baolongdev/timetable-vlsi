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
const ONLINE_MS = 90_000
/** Dọn bản ghi cũ hơn */
const STALE_MS = 180_000

function toUser(doc: PresenceDoc, selfDeviceId: string | null): PresenceUser {
  const networkKey = doc.networkKey || ""
  return {
    deviceId: doc.deviceId || String(doc._id),
    networkKey,
    networkTag: shortClientLabel(networkKey || String(doc._id)),
    displayName: doc.displayName,
    anonymous: doc.anonymous,
    path: doc.path,
    lastSeen: doc.lastSeen,
    isSelf: Boolean(selfDeviceId && doc.deviceId === selfDeviceId),
  }
}

function networkKeyFromRequest(request: NextRequest): string {
  return hashClientIp(getClientIp(request))
}

function isValidDeviceId(id: string): boolean {
  // uuid hoặc id sinh client: chữ số, gạch, dài hợp lý
  return id.length >= 8 && id.length <= 80 && /^[a-zA-Z0-9_-]+$/.test(id)
}

async function listOnline(
  selfDeviceId: string | null
): Promise<PresenceUser[]> {
  const col = await presenceCol()
  const now = Date.now()
  await col.deleteMany({ lastSeen: { $lt: now - STALE_MS } })

  const docs = await col
    .find({ lastSeen: { $gte: now - ONLINE_MS } })
    .sort({ lastSeen: -1 })
    .limit(80)
    .toArray()

  return docs.map((d) => toUser(d, selfDeviceId))
}

/** GET — danh sách tất cả thiết bị đang online */
export async function GET(request: NextRequest) {
  if (!hasMongo()) {
    return NextResponse.json({
      configured: false,
      users: [] as PresenceUser[],
      count: 0,
      selfDeviceId: null as string | null,
      networkKey: null as string | null,
    })
  }

  try {
    const networkKey = networkKeyFromRequest(request)
    const selfDeviceId =
      request.nextUrl.searchParams.get("deviceId")?.trim() || null
    const users = await listOnline(selfDeviceId)
    return NextResponse.json({
      configured: true,
      users,
      count: users.length,
      selfDeviceId,
      networkKey,
    })
  } catch (e) {
    console.error("[api/presence GET]", e)
    return NextResponse.json(
      {
        configured: true,
        users: [],
        count: 0,
        selfDeviceId: null,
        networkKey: null,
        error: "mongo_error",
      },
      { status: 502 }
    )
  }
}

/**
 * POST — heartbeat.
 * - deviceId: do client sinh 1 lần / trình duyệt (nhiều máy = nhiều người)
 * - networkKey: server gán từ IP (không tin body client)
 */
export async function POST(request: NextRequest) {
  if (!hasMongo()) {
    return NextResponse.json({ error: "mongo_not_configured" }, { status: 503 })
  }

  try {
    const body = (await request.json()) as {
      deviceId?: unknown
      displayName?: unknown
      anonymous?: unknown
      path?: unknown
    }

    const deviceId =
      typeof body.deviceId === "string" ? body.deviceId.trim() : ""
    if (!isValidDeviceId(deviceId)) {
      return NextResponse.json({ error: "invalid_device" }, { status: 400 })
    }

    const networkKey = networkKeyFromRequest(request)

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
      _id: deviceId,
      deviceId,
      networkKey,
      displayName,
      anonymous: anonymous || displayName === "Ẩn danh",
      path,
      lastSeen: now,
    }
    await col.replaceOne({ _id: deviceId }, doc, { upsert: true })

    // Dọn schema cũ (1 IP = 1 doc, hoặc sessionId)
    await col.deleteMany({
      $or: [
        { clientKey: { $exists: true }, deviceId: { $exists: false } },
        { sessionId: { $exists: true }, deviceId: { $exists: false } },
      ],
    } as never)

    const users = await listOnline(deviceId)

    return NextResponse.json({
      ok: true,
      users,
      count: users.length,
      selfDeviceId: deviceId,
      networkKey,
    })
  } catch (e) {
    console.error("[api/presence POST]", e)
    return NextResponse.json({ error: "mongo_error" }, { status: 502 })
  }
}

/**
 * DELETE — rời trang: chỉ xóa đúng deviceId của tab đó
 * (không xóa cả mạng theo IP — tránh mất người khác cùng WiFi).
 */
export async function DELETE(request: NextRequest) {
  if (!hasMongo()) {
    return NextResponse.json({ ok: true })
  }

  try {
    let deviceId =
      request.nextUrl.searchParams.get("deviceId")?.trim() || ""
    if (!deviceId) {
      try {
        const body = (await request.json()) as { deviceId?: string }
        deviceId = body.deviceId?.trim() || ""
      } catch {
        // no body
      }
    }
    if (!isValidDeviceId(deviceId)) {
      return NextResponse.json({ ok: true })
    }

    const networkKey = networkKeyFromRequest(request)
    const col = await presenceCol()
    // Chỉ xóa nếu doc thuộc cùng mạng request (tránh xóa bừa deviceId đoán được)
    await col.deleteOne({ _id: deviceId, networkKey })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[api/presence DELETE]", e)
    return NextResponse.json({ ok: true })
  }
}
