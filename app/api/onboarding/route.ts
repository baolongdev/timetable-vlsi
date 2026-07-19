import { NextRequest, NextResponse } from "next/server"

import { TOUR_COOKIE_NAME } from "@/lib/onboarding"

/**
 * Lưu IP đã hoàn thành tour trong process (Vercel instance).
 * Kết hợp cookie → lần đầu IP/browser mới sẽ thấy tour.
 */
type TourGlobal = { __vlsiTourDoneIps?: Set<string> }

function getDoneIps(): Set<string> {
  const g = globalThis as TourGlobal
  if (!g.__vlsiTourDoneIps) g.__vlsiTourDoneIps = new Set()
  return g.__vlsiTourDoneIps
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  )
}

/** Hash nhẹ — không lưu IP thô */
function hashIp(ip: string): string {
  let h = 2166136261
  for (let i = 0; i < ip.length; i++) {
    h ^= ip.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16)
}

/** GET: IP/browser này đã xem tour chưa? */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const ipHash = hashIp(ip)
  const cookie = request.cookies.get(TOUR_COOKIE_NAME)?.value
  const doneIps = getDoneIps()

  const alreadyDone = cookie === "1" || doneIps.has(ipHash)

  return NextResponse.json({
    showTour: !alreadyDone,
    firstVisit: !alreadyDone,
  })
}

/** POST: đánh dấu đã xem tour (cookie + IP) */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const ipHash = hashIp(ip)
  getDoneIps().add(ipHash)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(TOUR_COOKIE_NAME, "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
  })
  return res
}
