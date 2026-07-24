"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Users,
  FileSpreadsheet,
} from "lucide-react"

import { PageBreadcrumb } from "@/components/layout/page-breadcrumb"
import { PageMenubar } from "@/components/layout/page-menubar"
import { UploadAssignmentButton } from "@/components/import/upload-assignment-button"
import { pagePad } from "@/components/timetable/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  useDepartments,
  type Department,
} from "@/lib/department-store"
import { useLecturers } from "@/lib/lecturer-store"
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

function DeptCard({ dept }: { dept: Department }) {
  const courseCount = new Set(dept.sections.map((s) => s.code)).size
  const assignedCount = dept.sections.filter((s) => {
    const a = dept.assignments[`${s.code}-${s.group}`]
    return a?.teacher || s.teacher
  }).length
  const pct = dept.sections.length
    ? Math.round((assignedCount / dept.sections.length) * 100)
    : 0

  return (
    <Link
      href={`/timetable/${dept.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border/70 p-5 transition-colors hover:bg-accent/50"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarDays className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-medium tracking-tight group-hover:text-primary">
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
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="font-mono text-[11px] tabular-nums">
          {courseCount} môn
        </Badge>
        <Badge variant="secondary" className="font-mono text-[11px] tabular-nums">
          {dept.sections.length} nhóm lớp
        </Badge>
        <Badge
          variant={assignedCount === dept.sections.length ? "default" : "outline"}
          className="font-mono text-[11px] tabular-nums"
        >
          {assignedCount}/{dept.sections.length} phân công · {pct}%
        </Badge>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="size-3.5" />
        Xem lịch giảng viên
        <ArrowLeft className="ml-auto size-3 rotate-180 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  )
}

export function TimetablesOverview() {
  const { departments, hydrated } = useDepartments()

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <div className={cn(pagePad, "flex min-h-0 flex-1 flex-col gap-6")}>
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <PageBreadcrumb items={[{ label: "Thời khóa biểu" }]} />
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                Thời khóa biểu
              </h1>
              <p className="text-sm text-muted-foreground">
                {hydrated ? (
                  <>
                    {departments.length} bộ môn — chọn khoa để xem lịch
                  </>
                ) : (
                  <span>Đang tải&hellip;</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span data-tour="dept-upload" className="inline-flex">
              <UploadAssignmentButton className="rounded-xl border border-border/80" />
            </span>
            <PageMenubar
              activePage="timetable"
              departments={departments}
            />
          </div>
        </header>

        {/* Department cards */}
        {hydrated && departments.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <CalendarDays className="size-8 opacity-40" />
            <p className="text-sm">Chưa có khoa nào.</p>
            <p className="max-w-sm text-center text-xs text-muted-foreground">
              Upload file Excel phân công giảng dạy (.xlsx) — mỗi sheet sẽ
              thành một khoa riêng. Cần mật khẩu quản trị khi import.
            </p>
            <UploadAssignmentButton className="rounded-xl border border-border/80" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((dept) => (
              <DeptCard key={dept.id} dept={dept} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
