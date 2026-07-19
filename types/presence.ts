export type PresenceUser = {
  /** ID thiết bị/trình duyệt (mỗi máy một cái — thấy đủ nhiều người) */
  deviceId: string
  /**
   * Hash IP do server gán — client không đổi được.
   * Cùng WiFi → cùng networkKey.
   */
  networkKey: string
  /** Mã ngắn 4 ký tự từ networkKey */
  networkTag: string
  displayName: string
  anonymous: boolean
  path?: string
  lastSeen: number
  /** true = đúng thiết bị đang xem */
  isSelf?: boolean
}
