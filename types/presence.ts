export type PresenceUser = {
  /**
   * Khóa cố định theo địa chỉ mạng (hash IP phía server).
   * Client không thể tự đặt / đổi.
   */
  clientKey: string
  /** Mã ngắn hiển thị (4 ký tự) — gắn mạng, không đổi */
  networkTag: string
  displayName: string
  anonymous: boolean
  path?: string
  lastSeen: number
  /** true = cùng IP với trình duyệt hiện tại */
  isSelf?: boolean
}
