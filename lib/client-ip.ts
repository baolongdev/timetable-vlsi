import type { NextRequest } from "next/server"

/**
 * Lấy IP client từ reverse proxy (Vercel / CF).
 * Client không gửi / không đổi được giá trị này.
 */
export function getClientIp(request: NextRequest): string {
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

/**
 * Hash ổn định từ IP — không lưu IP thô trong DB.
 * Có thể thêm PRESENCE_IP_SALT trong env để tăng độ khó reverse.
 */
export function hashClientIp(ip: string): string {
  const salt = process.env.PRESENCE_IP_SALT?.trim() || "vlsi-presence-v1"
  const input = `${salt}|${ip}`
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // 8 hex — đủ phân biệt trong tổ, không lộ IP
  return (h >>> 0).toString(16).padStart(8, "0")
}

/** Mã hiển thị ngắn từ clientKey (không đổi, gắn mạng) */
export function shortClientLabel(clientKey: string): string {
  return clientKey.slice(-4).toUpperCase()
}
