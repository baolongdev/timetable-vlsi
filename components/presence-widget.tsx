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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
/** Nhãn team luôn hiện trước; tên cá nhân xem khi hover */
export const PRESENCE_TEAM_LABEL = "ACLAB TEAM"

function personalLabel(u: {
  displayName: string
  anonymous: boolean
}): string {
  return u.anonymous || !u.displayName.trim() ? "Ẩn danh" : u.displayName.trim()
}

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
                Tên trong {PRESENCE_TEAM_LABEL}
              </DialogTitle>
              <DialogDescription>
                Mọi người đều thuộc <strong>{PRESENCE_TEAM_LABEL}</strong>.
                Tên bên dưới (vd. Lê Bảo Long) chỉ hiện khi hover danh sách
                đang xem.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="presence-name">Tên cá nhân (khi hover)</Label>
              <Input
                id="presence-name"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Ví dụ: Lê Bảo Long"
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
 * Chip header: bấm → danh sách người đang xem; «Đổi tên» mở form tên.
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
        <span className="font-medium tracking-tight">{PRESENCE_TEAM_LABEL}</span>
        <span className="tabular-nums text-muted-foreground">—</span>
      </Button>
    )
  }

  const shown = users.slice(0, MAX_AVATARS)
  const extra = Math.max(0, count - MAX_AVATARS)
  const displayCount = count > 0 ? count : ready ? 1 : 0
  const countLabel = displayCount > 0 ? String(displayCount) : "—"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
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
            aria-label={`${PRESENCE_TEAM_LABEL} — bấm xem người đang online`}
          />
        }
      >
        <Users data-icon="inline-start" className="size-3.5 opacity-70" />
        <span className="max-w-[6.5rem] truncate font-medium tracking-tight sm:max-w-none">
          {PRESENCE_TEAM_LABEL}
        </span>
        <span className="tabular-nums text-muted-foreground">{countLabel}</span>
        {shown.length > 0 ? (
          <AvatarGroup className="ml-0.5">
            {shown.map((u) => {
              const color = getPersonColor(u.deviceId)
              const person = personalLabel(u)
              const initials = u.anonymous
                ? "AT"
                : getInitials(person) || "AT"
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
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-[min(calc(100vw-2rem),18rem)] min-w-[16rem] p-0"
      >
        <div className="px-3 py-2.5">
          <p className="text-sm font-semibold tracking-tight">
            {PRESENCE_TEAM_LABEL}
          </p>
          <p className="text-xs text-muted-foreground">
            {countLabel} đang xem
            {configured === false ? " · chỉ máy này" : ""}
          </p>
        </div>
        <DropdownMenuSeparator className="my-0" />

        <div className="scrollbar-minimal max-h-52 overflow-y-auto py-1">
          {users.length > 0 ? (
            users.map((u) => {
              const person = personalLabel(u)
              const isYou = u.isSelf || u.deviceId === selfDeviceId
              const color = getPersonColor(u.deviceId)
              const initials = u.anonymous
                ? "AT"
                : getInitials(person) || "AT"
              return (
                <div
                  key={u.deviceId}
                  className="flex items-center gap-2.5 px-3 py-2"
                >
                  <Avatar size="sm" className="shrink-0">
                    <AvatarFallback
                      className={cn(
                        "text-[10px] font-semibold",
                        color.bg,
                        color.text
                      )}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">
                      {person}
                      {isYou ? (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          (bạn)
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {PRESENCE_TEAM_LABEL}
                      <span className="ml-1 font-mono tabular-nums opacity-80">
                        #{u.networkTag}
                      </span>
                    </p>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="px-3 py-3 text-xs text-muted-foreground">
              Chưa có ai online. Chọn tên hoặc ẩn danh để hiện mặt.
            </p>
          )}
        </div>

        <DropdownMenuSeparator className="my-0" />
        <div className="p-1">
          <DropdownMenuItem
            className="cursor-pointer gap-2 rounded-lg px-2.5 py-2"
            onClick={() => {
              // Đợi menu đóng rồi mở dialog tên
              window.setTimeout(() => openNameDialog(), 50)
            }}
          >
            <Pencil className="size-3.5 opacity-70" />
            Đổi tên cá nhân
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** @deprecated */
export function PresenceWidget() {
  return null
}
