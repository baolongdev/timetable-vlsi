"use client"

import * as React from "react"
import { LockKeyhole } from "lucide-react"

import { verifyPolicyPasswordRemote } from "@/lib/dept-policy-client"
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

export type DeptPolicyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Tiêu đề dialog */
  title?: string
  /** Mô tả ngắn */
  description?: string
  /** Nhãn nút xác nhận */
  confirmLabel?: string
  /** true = nút đỏ (xóa) */
  destructive?: boolean
  /** Gọi khi pass đúng */
  onVerified: () => void
}

/**
 * Dialog nhập mật khẩu policy khi thêm / xóa khoa.
 */
export function DeptPolicyDialog({
  open,
  onOpenChange,
  title = "Xác nhận thao tác",
  description = "Nhập mật khẩu quản trị để tiếp tục thêm hoặc xóa khoa.",
  confirmLabel = "Xác nhận",
  destructive = false,
  onVerified,
}: DeptPolicyDialogProps) {
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!open) {
      setPassword("")
      setError(null)
      setBusy(false)
      return
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [open])

  const submit = async () => {
    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu.")
      return
    }
    setBusy(true)
    setError(null)
    const ok = await verifyPolicyPasswordRemote(password)
    setBusy(false)
    if (!ok) {
      setError("Mật khẩu không đúng.")
      inputRef.current?.select()
      return
    }
    onOpenChange(false)
    onVerified()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <div className="flex flex-col gap-4 p-6">
            <DialogHeader className="gap-1.5">
              <div className="mb-1 flex size-10 items-center justify-center rounded-xl border border-border/70 bg-muted/40">
                <LockKeyhole className="size-4 text-muted-foreground" />
              </div>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {title}
              </DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <Label htmlFor="dept-policy-password">Mật khẩu</Label>
              <Input
                ref={inputRef}
                id="dept-policy-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="Nhập mật khẩu…"
                className="h-10 rounded-xl"
                disabled={busy}
              />
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Thao tác thêm / xóa khoa cần mật khẩu quản trị.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 border-t border-border/60 bg-muted/30 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="rounded-xl"
              variant={destructive ? "destructive" : "default"}
              disabled={busy}
            >
              {busy ? "Đang kiểm tra…" : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
