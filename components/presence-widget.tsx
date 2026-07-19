"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Pencil, Users } from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getInitials, getPersonColor } from "@/lib/person-color"
import { cn } from "@/lib/utils"
import type { PresenceUser } from "@/types/presence"

/** localStorage — OnboardingTour chờ key này ready trước khi chạy driver.js */
export const PRESENCE_PROFILE_KEY = "vlsi-presence-profile-v1"
const PROFILE_KEY = PRESENCE_PROFILE_KEY
/** ID thiết bị cố định trong trình duyệt — mỗi máy một cái */
const DEVICE_KEY = "vlsi-presence-device-v1"
const HEARTBEAT_MS = 12_000
const MAX_AVATARS = 5

type Profile = {
  displayName: string
  anonymous: boolean
  ready: boolean
}

type PresenceContextValue = {
  users: PresenceUser[]
  count: number
  configured: boolean | null
  selfDeviceId: string | null
  profile: Profile
  openNameDialog: () => void
  ready: boolean
  mounted: boolean
}

const PresenceContext = React.createContext<PresenceContextValue | null>(null)

const EMPTY_PROFILE: Profile = {
  displayName: "",
  anonymous: true,
  ready: false,
}

function loadProfile(): Profile {
  if (typeof window === "undefined") {
    return { displayName: "", anonymous: true, ready: false }
  }
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return { displayName: "", anonymous: true, ready: false }
    const p = JSON.parse(raw) as Profile
    return {
      displayName: p.displayName ?? "",
      anonymous: Boolean(p.anonymous),
      ready: Boolean(p.ready),
    }
  } catch {
    return { displayName: "", anonymous: true, ready: false }
  }
}

function saveProfile(p: Profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
  } catch {
    // ignore
  }
}

function loadOrCreateDeviceId(): string {
  if (typeof window === "undefined") return ""
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `d-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    return `d-${Date.now()}`
  }
}

async function heartbeat(body: {
  deviceId: string
  displayName: string
  anonymous: boolean
  path: string
}): Promise<{
  users: PresenceUser[]
  count: number
  configured: boolean
  selfDeviceId: string | null
} | null> {
  try {
    const res = await fetch("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    if (res.status === 503) {
      return { users: [], count: 0, configured: false, selfDeviceId: null }
    }
    if (!res.ok) return null
    const data = (await res.json()) as {
      users?: PresenceUser[]
      count?: number
      selfDeviceId?: string
    }
    return {
      users: data.users ?? [],
      count: data.count ?? 0,
      configured: true,
      selfDeviceId: data.selfDeviceId ?? body.deviceId,
    }
  } catch {
    return null
  }
}

/**
 * Provider: mỗi thiết bị 1 slot online; networkTag = hash IP (server).
 * Nhiều máy cùng WiFi vẫn hiện đủ nhiều người.
 */
export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false)
  const [deviceId, setDeviceId] = React.useState("")
  const [profile, setProfile] = React.useState<Profile>(EMPTY_PROFILE)
  const [users, setUsers] = React.useState<PresenceUser[]>([])
  const [configured, setConfigured] = React.useState<boolean | null>(null)
  const [selfDeviceId, setSelfDeviceId] = React.useState<string | null>(null)
  const [nameOpen, setNameOpen] = React.useState(false)
  const [nameDraft, setNameDraft] = React.useState("")

  React.useEffect(() => {
    setMounted(true)
    const id = loadOrCreateDeviceId()
    setDeviceId(id)
    const stored = loadProfile()
    setProfile(stored)
    setNameDraft(stored.displayName)
    if (!stored.ready) {
      setNameOpen(true)
    }
  }, [])

  const applyProfile = React.useCallback((next: Profile) => {
    setProfile(next)
    saveProfile(next)
  }, [])

  const openNameDialog = React.useCallback(() => {
    setNameDraft(profile.displayName)
    setNameOpen(true)
  }, [profile.displayName])

  const tick = React.useCallback(async () => {
    if (!profile.ready || !deviceId) return
    const result = await heartbeat({
      deviceId,
      displayName: profile.anonymous ? "Ẩn danh" : profile.displayName,
      anonymous: profile.anonymous,
      path: pathname || "/",
    })
    if (!result) return
    setConfigured(result.configured)
    setSelfDeviceId(result.selfDeviceId)
    if (result.configured) {
      setUsers(result.users)
    } else {
      setUsers([
        {
          deviceId,
          networkKey: "local",
          networkTag: "LOC",
          displayName: profile.anonymous
            ? "Ẩn danh"
            : profile.displayName || "Ẩn danh",
          anonymous: profile.anonymous,
          lastSeen: Date.now(),
          isSelf: true,
        },
      ])
    }
  }, [profile, pathname, deviceId])

  React.useEffect(() => {
    if (!profile.ready || !deviceId) return
    void tick()
    const id = window.setInterval(() => void tick(), HEARTBEAT_MS)
    const onFocus = () => void tick()
    window.addEventListener("focus", onFocus)
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void tick()
    })

    const leave = () => {
      try {
        void fetch(
          `/api/presence?deviceId=${encodeURIComponent(deviceId)}`,
          { method: "DELETE", keepalive: true }
        )
      } catch {
        // ignore
      }
    }
    window.addEventListener("pagehide", leave)

    return () => {
      window.clearInterval(id)
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("pagehide", leave)
    }
  }, [profile.ready, tick, deviceId])

  const saveName = (anonymous: boolean) => {
    const name = nameDraft.trim()
    if (!anonymous && !name) return
    applyProfile({
      displayName: anonymous ? "" : name,
      anonymous,
      ready: true,
    })
    setNameOpen(false)
  }

  const value = React.useMemo<PresenceContextValue>(
    () => ({
      users,
      count: users.length,
      configured,
      selfDeviceId,
      profile,
      openNameDialog,
      ready: profile.ready,
      mounted,
    }),
    [users, configured, selfDeviceId, profile, openNameDialog, mounted]
  )

  return (
    <PresenceContext.Provider value={value}>
      {children}
      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-sm">
          <div className="flex flex-col gap-4 p-6">
            <DialogHeader className="gap-1.5">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Tên hiển thị
              </DialogTitle>
              <DialogDescription>
                Mỗi thiết bị hiện một người riêng (kể cả cùng WiFi). Tên có
                thể đổi; mã mạng do server gán theo IP.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="presence-name">Tên của bạn</Label>
              <Input
                id="presence-name"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Ví dụ: Long, Tổ VLSI…"
                className="h-10 rounded-xl"
                maxLength={40}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    saveName(false)
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="mx-0 mb-0 border-t border-border/60 bg-muted/30 px-6 py-4 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => saveName(true)}
            >
              Ẩn danh
            </Button>
            <div className="flex gap-2">
              {profile.ready ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setNameOpen(false)}
                >
                  Hủy
                </Button>
              ) : null}
              <Button
                type="button"
                className="rounded-xl"
                disabled={!nameDraft.trim()}
                onClick={() => saveName(false)}
              >
                Lưu tên
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PresenceContext.Provider>
  )
}

export function usePresence() {
  return React.useContext(PresenceContext)
}

export function usePresenceReady(): boolean {
  const ctx = React.useContext(PresenceContext)
  return Boolean(ctx?.mounted && ctx?.ready)
}

export function isPresenceProfileReady(): boolean {
  return loadProfile().ready
}

/**
 * Chip header: số người + avatar tất cả thiết bị online.
 */
export function PresenceHeaderControl({ className }: { className?: string }) {
  const ctx = usePresence()
  if (!ctx) return null

  const {
    users,
    count,
    configured,
    openNameDialog,
    ready,
    selfDeviceId,
    mounted,
  } = ctx

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        data-tour="presence"
        className={cn(
          "h-8 gap-1.5 px-2 transition-opacity duration-150 hover:opacity-80",
          className
        )}
        disabled
        aria-label="Người đang xem"
      >
        <Users data-icon="inline-start" className="size-3.5 opacity-70" />
        <span className="tabular-nums">—</span>
        <span className="hidden sm:inline">đang xem</span>
      </Button>
    )
  }

  const shown = users.slice(0, MAX_AVATARS)
  const extra = Math.max(0, count - MAX_AVATARS)
  const displayCount = count > 0 ? count : ready ? 1 : 0
  const countLabel = displayCount > 0 ? String(displayCount) : "—"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-tour="presence"
            className={cn(
              "h-8 gap-1.5 px-2 transition-opacity duration-150 hover:opacity-80",
              className
            )}
            onClick={openNameDialog}
            aria-label="Người đang xem — bấm để đổi tên"
          />
        }
      >
        <Users data-icon="inline-start" className="size-3.5 opacity-70" />
        <span className="tabular-nums">{countLabel}</span>
        <span className="hidden sm:inline">đang xem</span>
        {shown.length > 0 ? (
          <AvatarGroup className="ml-0.5">
            {shown.map((u) => {
              // Màu theo thiết bị (mỗi máy khác nhau)
              const color = getPersonColor(u.deviceId)
              const initials = u.anonymous
                ? u.networkTag.slice(0, 2)
                : getInitials(u.displayName) || u.networkTag.slice(0, 2)
              return (
                <Avatar key={u.deviceId} size="sm">
                  <AvatarFallback
                    className={cn(
                      "text-[10px] font-semibold",
                      color.bg,
                      color.text,
                      u.isSelf && "ring-2 ring-primary ring-offset-1"
                    )}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              )
            })}
            {extra > 0 ? (
              <AvatarGroupCount className="size-6 text-[10px] font-medium">
                +{extra}
              </AvatarGroupCount>
            ) : null}
          </AvatarGroup>
        ) : null}
        <Pencil className="size-3 opacity-50" />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[280px]">
        <p className="font-medium">
          {displayCount > 0 ? displayCount : "—"} thiết bị đang xem
          {configured === false ? " (chỉ máy này)" : ""}
        </p>
        {users.length > 0 ? (
          <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto text-xs text-muted-foreground">
            {users.map((u) => (
              <li key={u.deviceId} className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] tabular-nums text-foreground/70">
                  #{u.networkTag}
                </span>
                <span className="min-w-0 truncate">
                  {u.anonymous ? "Ẩn danh" : u.displayName}
                  {u.isSelf || u.deviceId === selfDeviceId ? " · bạn" : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            Chọn tên hoặc ẩn danh để hiện mặt
          </p>
        )}
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Mỗi thiết bị = 1 người. Mã #xxxx = mạng (IP). Cùng WiFi vẫn thấy
          đủ mọi máy. Bấm để đổi tên.
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

/** @deprecated */
export function PresenceWidget() {
  return null
}
