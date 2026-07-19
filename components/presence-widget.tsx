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

const SESSION_KEY = "vlsi-presence-session-v1"
const PROFILE_KEY = "vlsi-presence-profile-v1"
const HEARTBEAT_MS = 15_000
const MAX_AVATARS = 5

type Profile = {
  displayName: string
  anonymous: boolean
  /** Đã chọn tên/ẩn danh ít nhất 1 lần */
  ready: boolean
}

function loadSessionId(): string {
  if (typeof window === "undefined") return ""
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return `s-${Date.now()}`
  }
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
  sessionId: string
  displayName: string
  anonymous: boolean
  path: string
}): Promise<{ users: PresenceUser[]; count: number; configured: boolean } | null> {
  try {
    const res = await fetch("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    if (res.status === 503) {
      return { users: [], count: 0, configured: false }
    }
    if (!res.ok) return null
    const data = (await res.json()) as {
      users?: PresenceUser[]
      count?: number
    }
    return {
      users: data.users ?? [],
      count: data.count ?? 0,
      configured: true,
    }
  } catch {
    return null
  }
}

/**
 * Widget góc màn hình: số người online + avatar.
 * Tên hoặc ẩn danh; heartbeat Mongo (miễn phí trong Atlas free).
 */
export function PresenceWidget() {
  const pathname = usePathname()
  const [sessionId] = React.useState(() => loadSessionId())
  const [profile, setProfile] = React.useState<Profile>(() => loadProfile())
  const [users, setUsers] = React.useState<PresenceUser[]>([])
  const [configured, setConfigured] = React.useState<boolean | null>(null)
  const [nameOpen, setNameOpen] = React.useState(false)
  const [nameDraft, setNameDraft] = React.useState("")

  // Lần đầu: mở dialog chọn tên
  React.useEffect(() => {
    if (!profile.ready) {
      setNameDraft(profile.displayName)
      setNameOpen(true)
    }
  }, [profile.ready, profile.displayName])

  const applyProfile = React.useCallback(
    (next: Profile) => {
      setProfile(next)
      saveProfile(next)
    },
    []
  )

  const tick = React.useCallback(async () => {
    if (!sessionId || !profile.ready) return
    const result = await heartbeat({
      sessionId,
      displayName: profile.anonymous ? "Ẩn danh" : profile.displayName,
      anonymous: profile.anonymous,
      path: pathname || "/",
    })
    if (!result) return
    setConfigured(result.configured)
    if (result.configured) {
      setUsers(
        result.users.map((u) => ({
          ...u,
          isSelf: u.sessionId === sessionId,
        }))
      )
    } else {
      // Không Mongo: chỉ hiện bản thân
      setUsers([
        {
          sessionId,
          displayName: profile.anonymous
            ? "Ẩn danh"
            : profile.displayName || "Ẩn danh",
          anonymous: profile.anonymous,
          lastSeen: Date.now(),
          isSelf: true,
        },
      ])
    }
  }, [sessionId, profile, pathname])

  React.useEffect(() => {
    if (!profile.ready) return
    void tick()
    const id = window.setInterval(() => void tick(), HEARTBEAT_MS)
    const onFocus = () => void tick()
    window.addEventListener("focus", onFocus)

    const leave = () => {
      try {
        void fetch(
          `/api/presence?sessionId=${encodeURIComponent(sessionId)}`,
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
  }, [profile.ready, tick, sessionId])

  const count = users.length
  const shown = users.slice(0, MAX_AVATARS)
  const extra = Math.max(0, count - MAX_AVATARS)

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

  if (!profile.ready && !nameOpen) return null

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed right-3 bottom-3 z-40 sm:right-5 sm:bottom-5",
          "flex flex-col items-end gap-2"
        )}
      >
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/80 bg-background/95 px-2.5 py-1.5 shadow-md backdrop-blur-sm">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl px-1 py-0.5 text-left transition-opacity hover:opacity-80"
                  onClick={() => {
                    setNameDraft(profile.displayName)
                    setNameOpen(true)
                  }}
                  aria-label="Đổi tên hiển thị"
                />
              }
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Users className="size-3.5" />
                <span className="tabular-nums text-foreground">{count || 1}</span>
                <span className="hidden sm:inline">đang xem</span>
              </span>
              {count > 0 ? (
                <AvatarGroup className="pl-0.5">
                  {shown.map((u) => {
                    const label = u.anonymous ? "Ẩn danh" : u.displayName
                    const color = getPersonColor(u.sessionId + label)
                    const initials = u.anonymous
                      ? "?"
                      : getInitials(u.displayName) || "?"
                    return (
                      <Avatar
                        key={u.sessionId}
                        size="sm"
                        title={label + (u.isSelf ? " (bạn)" : "")}
                      >
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
              <Pencil className="size-3 text-muted-foreground opacity-60" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[220px]">
              <p className="font-medium">
                {count} người đang xem
                {configured === false ? " (chỉ máy này)" : ""}
              </p>
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {users.slice(0, 8).map((u) => (
                  <li key={u.sessionId}>
                    {u.anonymous ? "Ẩn danh" : u.displayName}
                    {u.isSelf ? " · bạn" : ""}
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Bấm để đổi tên / ẩn danh
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-sm">
          <div className="flex flex-col gap-4 p-6">
            <DialogHeader className="gap-1.5">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Tên hiển thị
              </DialogTitle>
              <DialogDescription>
                Người khác sẽ thấy tên hoặc «Ẩn danh» trong danh sách đang
                xem. Không cần đăng nhập.
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
    </>
  )
}
