"use client"

import * as React from "react"

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
import type { Course } from "@/types/course"

type CourseRenameDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: Course | null
  onRename: (code: string, newName: string) => void
}

/** Dialog đổi tên môn học — áp dụng cho mọi nhóm lớp của MSMH đó */
export function CourseRenameDialog({
  open,
  onOpenChange,
  course,
  onRename,
}: CourseRenameDialogProps) {
  const [name, setName] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    setName(course?.name ?? "")
    setError(null)
  }, [open, course])

  if (!course) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Vui lòng nhập tên môn học.")
      return
    }
    if (trimmed !== course.name) {
      onRename(course.code, trimmed)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5 p-6">
            <DialogHeader className="gap-1.5">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Đổi tên môn học
              </DialogTitle>
              <DialogDescription>
                <span className="font-mono font-medium text-foreground/80">
                  {course.code}
                </span>{" "}
                — tên mới áp dụng cho tất cả nhóm lớp của mã này, đồng bộ
                với thời khóa biểu.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="course-rename">Tên môn học</Label>
              <Input
                id="course-rename"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Kiến trúc Máy tính"
                className="h-10 rounded-xl"
                autoFocus
              />
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 border-t border-border/60 bg-muted/30 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" className="rounded-xl">
              Lưu tên mới
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
