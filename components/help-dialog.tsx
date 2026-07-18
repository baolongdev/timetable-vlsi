"use client"

import * as React from "react"
import { Keyboard, MousePointerClick, Search, SlidersHorizontal } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-muted px-1.5 font-mono text-[11px] font-medium text-foreground">
      {children}
    </kbd>
  )
}

function HelpRow({
  keys,
  children,
}: {
  keys: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{children}</span>
      <span className="flex shrink-0 items-center gap-1">{keys}</span>
    </div>
  )
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <h3 className="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-foreground">
      <Icon className="size-3.5 text-muted-foreground" />
      {children}
    </h3>
  )
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

/**
 * App-wide help dialog. Opens with the `h` key (ignored while typing).
 */
export function HelpDialog() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() !== "h") return
      if (isTypingTarget(event.target)) return
      setOpen((v) => !v)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[480px]">
        <div className="flex flex-col gap-5 p-6">
          <DialogHeader className="gap-1.5">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Trợ giúp
            </DialogTitle>
            <DialogDescription>
              Các chức năng và phím tắt của ứng dụng
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <SectionTitle icon={Keyboard}>Phím tắt</SectionTitle>
            <div className="flex flex-col">
              <HelpRow keys={<><Kbd>Ctrl</Kbd><Kbd>K</Kbd></>}>
                Focus ô tìm kiếm
              </HelpRow>
              <HelpRow keys={<Kbd>D</Kbd>}>Đổi giao diện sáng / tối</HelpRow>
              <HelpRow keys={<Kbd>H</Kbd>}>Mở / đóng bảng trợ giúp này</HelpRow>
              <HelpRow keys={<Kbd>Esc</Kbd>}>Đóng hộp thoại</HelpRow>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <SectionTitle icon={Search}>Tìm kiếm &amp; lọc</SectionTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Tìm theo tên môn, mã môn hoặc giảng viên. Kết hợp bộ lọc giảng
              viên, môn học và phòng để thu hẹp thời khóa biểu.
            </p>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <SectionTitle icon={MousePointerClick}>Thao tác trên lịch</SectionTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Click vào môn học để xem chi tiết. Di chuột lên môn 1–2 tiết để
              mở rộng thẻ. Di chuột vào ô trống để thêm lịch mới.
            </p>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <SectionTitle icon={SlidersHorizontal}>Khác</SectionTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Export</span> tải
              danh sách đang lọc dưới dạng CSV.{" "}
              <span className="font-medium text-foreground">Môn học</span> quản
              lý môn học và đội ngũ giảng dạy.{" "}
              <span className="font-medium text-foreground">Giảng viên</span>{" "}
              mở trang quản lý danh sách giảng viên.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
