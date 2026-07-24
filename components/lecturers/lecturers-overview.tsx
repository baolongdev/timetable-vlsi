"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRightLeft,
  Building2,
  Plus,
  Users,
} from "lucide-react"

import { LecturerFormDialog } from "@/components/lecturers/lecturer-form-dialog"
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb"
import { PageMenubar } from "@/components/layout/page-menubar"
import { pagePad } from "@/components/timetable/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDepartments } from "@/lib/department-store"
import { lecturerStore, useLecturers } from "@/lib/lecturer-store"
import { cn } from "@/lib/utils"

export function LecturersOverview() {
  const { departments, hydrated } = useDepartments()
  const { lecturers } = useLecturers()

  const stats = React.useMemo(() => {
    return departments.map((d) => {
      const deptLecturers = lecturers.filter((l) => l.departmentId === d.id)
      const guestLecturers = lecturers.filter(
        (l) => l.departmentId !== d.id && l.guestDepartmentIds?.includes(d.id)
      )
      const assignedCount = deptLecturers.filter((l) => l.staffId).length
      return {
        id: d.id,
        name: d.name,
        total: deptLecturers.length,
        assigned: assignedCount,
        sections: d.sections.length,
        guestCount: guestLecturers.length,
      }
    })
  }, [departments, lecturers])

  const unassignedCount = lecturers.filter(
    (l) => !l.departmentId && (!l.guestDepartmentIds || l.guestDepartmentIds.length === 0)
  ).length

  const guestOnlyCount = lecturers.filter(
    (l) => !l.departmentId && l.guestDepartmentIds && l.guestDepartmentIds.length > 0
  ).length

  const [formOpen, setFormOpen] = React.useState(false)

  const handleSubmit = (data: Omit<import("@/types/lecturer").Lecturer, "id"> & { id?: string }) => {
    lecturerStore.upsert(data)
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <div className={cn(pagePad, "flex min-h-0 flex-1 flex-col gap-6")}>
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <PageBreadcrumb items={[{ label: "Giảng viên" }]} />
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                Giảng viên
              </h1>
              <p className="text-sm text-muted-foreground">
                {hydrated ? (
                  <>
                    {lecturers.length} giảng viên · {departments.length} bộ
                    môn · {guestOnlyCount} thỉnh giảng
                  </>
                ) : (
                  <span>Đang tải&hellip;</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="rounded-xl"
              onClick={() => setFormOpen(true)}
            >
              <Plus data-icon="inline-start" />
              Thêm giảng viên
            </Button>
            <PageMenubar
              activePage="lecturers"
              departments={departments}
            />
          </div>
        </header>

        {/* Department cards */}
        {hydrated && departments.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Building2 className="size-8 opacity-40" />
            <p className="text-sm">Chưa có bộ môn nào.</p>
            <Button variant="outline" size="sm" render={<Link href="/departments" />} nativeButton={false}>
              <Building2 data-icon="inline-start" />
              Quản lý khoa
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((s) => (
              <Link
                key={s.id}
                href={`/lecturers/${s.id}`}
                className="group flex flex-col gap-3 rounded-xl border border-border/70 p-5 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-medium tracking-tight group-hover:text-primary">
                      {s.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {s.sections} nhóm lớp
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="size-3.5" />
                    <span className="font-medium text-foreground">{s.total}</span> thành viên
                  </span>
                  {s.assigned > 0 ? (
                    <Badge variant="secondary" className="font-mono text-[11px] tabular-nums">
                      {s.assigned} MSCB
                    </Badge>
                  ) : null}
                  {s.guestCount > 0 ? (
                    <Badge variant="outline" className="gap-1 font-mono text-[11px] tabular-nums text-amber-600">
                      <ArrowRightLeft className="size-2.5" />
                      {s.guestCount} thỉnh giảng
                    </Badge>
                  ) : null}
                </div>
              </Link>
            ))}

            {/* Guest-only lecturers card */}
            {guestOnlyCount > 0 ? (
              <Link
                href="/lecturers/guest-only"
                className="group flex flex-col gap-3 rounded-xl border border-dashed border-amber-300/60 p-5 transition-colors hover:border-amber-400 hover:bg-amber-50/50 dark:border-amber-700/40 dark:hover:border-amber-600 dark:hover:bg-amber-950/30"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                    <ArrowRightLeft className="size-4.5 text-amber-600 dark:text-amber-400" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-medium tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      Chỉ thỉnh giảng
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Giảng viên thỉnh giảng, không thuộc bộ môn nào
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="size-3.5" />
                  <span className="font-medium text-foreground">
                    {guestOnlyCount}
                  </span>{" "}
                  giảng viên
                </span>
              </Link>
            ) : null}

            {/* Unassigned lecturers card */}
            {unassignedCount > 0 ? (
              <Link
                href="/lecturers/unassigned"
                className="group flex flex-col gap-3 rounded-xl border border-dashed border-border/50 p-5 transition-colors hover:border-orange-300 hover:bg-orange-50/50 dark:hover:border-orange-700 dark:hover:bg-orange-950/30"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/40">
                    <Users className="size-4.5 text-orange-600 dark:text-orange-400" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-medium tracking-tight group-hover:text-orange-600 dark:group-hover:text-orange-400">
                      Chưa phân bộ môn
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Giảng viên chưa chọn khoa
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="size-3.5" />
                  <span className="font-medium text-foreground">
                    {unassignedCount}
                  </span>{" "}
                  giảng viên
                </span>
              </Link>
            ) : null}
          </div>
        )}

        <LecturerFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          lecturer={null}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
