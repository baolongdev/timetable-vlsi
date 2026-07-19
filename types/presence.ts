export type PresenceUser = {
  sessionId: string
  displayName: string
  anonymous: boolean
  path?: string
  lastSeen: number
  /** true = tab hiện tại */
  isSelf?: boolean
}
