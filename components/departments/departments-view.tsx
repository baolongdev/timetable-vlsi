"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileSpreadsheet,
  Trash2,
  Users,
} from "lucide-react"

import { UploadAssignmentButton } from "@/components/import/upload-assignment-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { pagePad } from "@/components/timetable/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  departmentStore,
  useDepartments,
  type Department,
} from "@/lib/department-store"
import { cn } from "@/lib/utils"

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function DepartmentCard({ dept }: { dept: Department }) {
  const courseCount = new Set(dept.sections.map((s) => s.code)).size
  const assignedCount = dept.sections.filter((s) => {
    const a = dept.assignments[`${s.code}-${s.group}`]
    return a?.teacher || s.teacher
  }).length

  return (
    <div
      className={cn(
        "group flex flex-col gap-4 rounded-2xl border border-border/80 bg-background p-5",
        "transition-all duration-150 ease-out hover:-translate-y-px hover:border-foreground/20 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="truncate text-lg font-semibold tracking-tight">
            {dept.name}
          </h2>
          <p
            className="truncate text-xs text-muted-foreground"
            title={dept.fileName}
          >
            <FileSpreadsheet className="mr-1 inline size-3 opacity-60" />
            {dept.fileName} · {formatDate(dept.uploadedAt)}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => departmentStore.removeDepartment(dept.id)}
                aria-label={`Xóa ${dept.name}`}
                className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              />
            }
          >
            <Trash2 />
          </TooltipTrigger>
          <TooltipContent>Xóa khoa khỏi hệ thống</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="font-mono text-[11px] tabular-nums">
          {courseCount} môn
        </Badge>
        <Badge variant="secondary" className="font-mono text-[11px] tabular-nums">
          {dept.sections.length} nhóm lớp
        </Badge>
        <Badge
          variant={
            assignedCount === dept.sections.length ? "default" : "outline"
          }
          className="font-mono text-[11px] tabular-nums"
        >
          {assignedCount}/{dept.sections.length} đã phân công
        </Badge>
      </div>

      <div className="mt-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          render={<Link href={`/timetable/${dept.id}`} />}
          nativeButton={false}
        >
          <CalendarDays data-icon="inline-start" />
          Thời khóa biểu
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          render={<Link href={`/courses/${dept.id}`} />}
          nativeButton={false}
        >
          <BookOpen data-icon="inline-start" />
          Môn học
        </Button>
      </div>
    </div>
  )
}

export function DepartmentsView() {
  const { departments, hydrated } = useDepartments()

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <div className={cn(pagePad, "flex flex-1 flex-col gap-6")}>
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit -ml-2 text-muted-foreground"
              render={<Link href="/" />}
              nativeButton={false}
            >
              <ArrowLeft data-icon="inline-start" />
              Trang chủ
            </Button>
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                Khoa / Tổ chuyên môn
              </h1>
              <p className="text-sm text-muted-foreground">
                {departments.length > 0
                  ? `${departments.length} khoa đã import — chọn khoa để xem thời khóa biểu`
                  : "Upload file Excel phân công để bắt đầu"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UploadAssignmentButton className="rounded-xl border border-border/80" />
            <Button
              variant="ghost"
              size="sm"
              className="transition-opacity duration-150 hover:opacity-80"
              render={<Link href="/lecturers" />}
              nativeButton={false}
            >
              <Users data-icon="inline-start" />
              Giảng viên
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Grid khoa */}
        {!hydrated ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">
              Đang tải danh sách khoa&hellip;
            </p>
          </div>
        ) : departments.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/40">
              <FileSpreadsheet className="size-4 text-muted-foreground" />
            </div>
            <div className="flex max-w-sm flex-col gap-1.5">
              <p className="text-base font-semibold tracking-tight">
                Chưa có khoa nào
              </p>
              <p className="text-sm text-muted-foreground">
                Upload file Excel phân công giảng dạy (.xlsx) — mỗi sheet
                (CNPM, KTMT, KhoaQuanly…) sẽ thành một khoa riêng.
              </p>
            </div>
            <UploadAssignmentButton className="rounded-xl border border-border/80" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((dept) => (
              <DepartmentCard key={dept.id} dept={dept} />
            ))}
          </div>
        )}

        {departments.length > 0 ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowRight className="size-3" />
            Upload lại file cùng sheet sẽ cập nhật khoa tương ứng, phân công
            đã chọn được giữ nguyên.
          </p>
        ) : null}
      </div>
    </div>
  )
}
