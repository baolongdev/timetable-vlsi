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

const PROFILE_KEY = "vlsi-presence-profile-v1"
const HEARTBEAT_MS = 15_000
const MAX_AVATARS = 4

type Profile = {
  displayName: string
  anonymous: boolean
  ready: boolean
}

type PresenceContextValue = {
  users: PresenceUser[]
  count: number
  configured: boolean | null
  selfKey: string | null
  profile: Profile
  openNameDialog: () => void
  ready: boolean
  /** false cho đến khi client mount — tránh hydration mismatch */
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

async function heartbeat(body: {
  displayName: string
  anonymous: boolean
  path: string
}): Promise<{
  users: PresenceUser[]
  count: number
  configured: boolean
  selfKey: string | null
} | null> {
  try {
    const res = await fetch("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    if (res.status === 503) {
      return { users: [], count: 0, configured: false, selfKey: null }
    }
    if (!res.ok) return null
    const data = (await res.json()) as {
      users?: PresenceUser[]
      count?: number
      selfKey?: string
    }
    return {
      users: data.users ?? [],
      count: data.count ?? 0,
      configured: true,
      selfKey: data.selfKey ?? null,
    }
  } catch {
    return null
  }
}

/**
 * Provider: heartbeat + dialog tên.
 * Danh tính online = hash IP phía server (client không đổi được).
 */
export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // SSR + first client paint: luôn EMPTY — localStorage chỉ load sau mount
  const [mounted, setMounted] = React.useState(false)
  const [profile, setProfile] = React.useState<Profile>(EMPTY_PROFILE)
  const [users, setUsers] = React.useState<PresenceUser[]>([])
  const [configured, setConfigured] = React.useState<boolean | null>(null)
  const [selfKey, setSelfKey] = React.useState<string | null>(null)
  const [nameOpen, setNameOpen] = React.useState(false)
  const [nameDraft, setNameDraft] = React.useState("")

  React.useEffect(() => {
    setMounted(true)
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
    if (!profile.ready) return
    const result = await heartbeat({
      displayName: profile.anonymous ? "Ẩn danh" : profile.displayName,
      anonymous: profile.anonymous,
      path: pathname || "/",
    })
    if (!result) return
    setConfigured(result.configured)
    setSelfKey(result.selfKey)
    if (result.configured) {
      // isSelf đã set server-side theo IP
      setUsers(result.users)
    } else {
      setUsers([
        {
          clientKey: "local",
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
  }, [profile, pathname])

  React.useEffect(() => {
    if (!profile.ready) return
    void tick()
    const id = window.setInterval(() => void tick(), HEARTBEAT_MS)
    const onFocus = () => void tick()
    window.addEventListener("focus", onFocus)

    const leave = () => {
      try {
        // Server xóa theo IP của request — không gửi id client
        void fetch("/api/presence", { method: "DELETE", keepalive: true })
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
  }, [profile.ready, tick])

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
      selfKey,
      profile,
      openNameDialog,
      ready: profile.ready,
      mounted,
    }),
    [users, configured, selfKey, profile, openNameDialog, mounted]
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
                Tên có thể đổi. Mỗi người được phân biệt theo{" "}
                <strong>địa chỉ mạng</strong> (IP) — không thể giả mạo từ
                trình duyệt. Nhiều tab cùng mạng chỉ tính 1 người.
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

function usePresence() {
  return React.useContext(PresenceContext)
}

/**
 * Chip gọn — cùng hàng header.
 * Avatar / màu theo clientKey (hash IP) — cố định theo mạng.
 */
export function PresenceHeaderControl({ className }: { className?: string }) {
  const ctx = usePresence()
  if (!ctx) return null

  const { users, count, configured, openNameDialog, ready, selfKey, mounted } =
    ctx

  // Trước mount: markup cố định giống SSR — không đọc localStorage / users
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
  const myTag = selfKey ? selfKey.slice(-4).toUpperCase() : null

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
              // Màu cố định theo mạng (clientKey), không theo tên đổi được
              const color = getPersonColor(u.clientKey)
              const initials = u.anonymous
                ? u.networkTag.slice(0, 2)
                : getInitials(u.displayName) || u.networkTag.slice(0, 2)
              return (
                <Avatar key={u.clientKey} size="sm">
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
      <TooltipContent side="bottom" className="max-w-[260px]">
        <p className="font-medium">
          {displayCount > 0 ? displayCount : "—"} người đang xem
          {configured === false ? " (chỉ máy này)" : ""}
        </p>
        {users.length > 0 ? (
          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {users.slice(0, 8).map((u) => (
              <li key={u.clientKey} className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] tabular-nums text-foreground/70">
                  #{u.networkTag}
                </span>
                <span>
                  {u.anonymous ? "Ẩn danh" : u.displayName}
                  {u.isSelf ? " · bạn" : ""}
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
          Phân biệt theo địa chỉ mạng (không đổi được)
          {myTag ? ` · bạn #${myTag}` : ""}. Bấm để đổi tên hiển thị.
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

/** @deprecated */
export function PresenceWidget() {
  return null
}
