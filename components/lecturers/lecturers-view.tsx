"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRightLeft,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react"

import { LecturerDeleteDialog } from "@/components/lecturers/lecturer-delete-dialog"
import { LecturerFormDialog } from "@/components/lecturers/lecturer-form-dialog"
import { PageMenubar } from "@/components/layout/page-menubar"
import { pagePad } from "@/components/timetable/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDepartments } from "@/lib/department-store"
import { getLecturerColor } from "@/lib/lecturer-colors"
import { lecturerStore, useLecturers } from "@/lib/lecturer-store"
import { getInitials } from "@/lib/person-color"
import { cn } from "@/lib/utils"
import {
  LECTURER_ROLES,
  type Lecturer,
  type LecturerRole,
} from "@/types/lecturer"

function roleBadgeVariant(
  role: LecturerRole
): "default" | "secondary" | "outline" {
  if (role === "Tổ trưởng" || role === "Tổ phó") return "default"
  if (role === "Phó khoa") return "secondary"
  return "outline"
}

export function LecturersView() {
  const { lecturers } = useLecturers()
  const { departments } = useDepartments()
  const params = useParams<{ dept?: string }>()
  const deptParam = params.dept ?? null
  const isUnassigned = deptParam === "unassigned"

  const dept = React.useMemo(
    () =>
      isUnassigned
        ? null
        : departments.find((d) => d.id === deptParam) ?? departments[0] ?? null,
    [departments, deptParam, isUnassigned]
  )

  const deptLecturers = React.useMemo(() => {
    if (isUnassigned) return lecturers.filter((l) => !l.departmentId)
    if (!dept) return lecturers
    return lecturers.filter((l) => l.departmentId === dept.id)
  }, [lecturers, dept, isUnassigned])

  const pageTitle = isUnassigned
    ? "Chưa phân bộ môn"
    : dept
      ? `Giảng viên — ${dept.name}`
      : "Giảng viên"

  const pageSubtitle = isUnassigned
    ? `${deptLecturers.length} giảng viên chưa chọn khoa`
    : `${deptLecturers.length} giảng viên${dept ? ` · ${dept.name}` : ""}`

  const [search, setSearch] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<string>("all")

  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Lecturer | null>(null)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState<Lecturer | null>(null)

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return deptLecturers.filter((l) => {
      const matchSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.role.toLowerCase().includes(q) ||
        (l.email?.toLowerCase().includes(q) ?? false) ||
        (l.staffId?.toLowerCase().includes(q) ?? false)
      const matchRole = roleFilter === "all" || l.role === roleFilter
      return matchSearch && matchRole
    })
  }, [deptLecturers, search, roleFilter])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (lecturer: Lecturer) => {
    setEditing(lecturer)
    setFormOpen(true)
  }

  const openDelete = (lecturer: Lecturer) => {
    setDeleting(lecturer)
    setDeleteOpen(true)
  }

  const handleSubmit = (data: Omit<Lecturer, "id"> & { id?: string }) => {
    lecturerStore.upsert(data)
  }

  const handleDelete = () => {
    if (!deleting) return
    lecturerStore.remove(deleting.id)
    setDeleting(null)
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <div className={cn(pagePad, "flex min-h-0 flex-1 flex-col gap-6")}>
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit -ml-2 text-muted-foreground"
              render={<Link href="/lecturers" />}
              nativeButton={false}
            >
              <ArrowLeft data-icon="inline-start" />
              Tổng quan
            </Button>
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="font-heading truncate text-2xl font-semibold tracking-tight">
                {pageTitle}
              </h1>
              <p className="text-sm text-muted-foreground">
                {pageSubtitle}
              </p>
            </div>
          </div>
          <PageMenubar
            activePage="lecturers"
            departments={departments}
            currentDeptId={dept?.id}
            unassignedCount={
              isUnassigned
                ? lecturers.filter((l) => !l.departmentId).length
                : undefined
            }
            actionSlot={
              <Button
                data-tour="lecturers-add"
                className="ml-1 shrink-0 rounded-xl"
                onClick={openCreate}
              >
                <Plus data-icon="inline-start" />
                Thêm giảng viên
              </Button>
            }
          />
        </header>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center">
          <div data-tour="lecturers-search" className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, vai trò…"
              className="h-10 rounded-xl pl-9 shadow-none"
            />
          </div>
          <div data-tour="lecturers-filter-role" className="w-full sm:w-auto">
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value ?? "all")}
              items={{
                all: "Tất cả vai trò",
                ...Object.fromEntries(LECTURER_ROLES.map((r) => [r, r])),
              }}
            >
              <SelectTrigger className="h-10 w-full rounded-xl sm:w-[180px]">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  {LECTURER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div
          data-tour="lecturers-table"
          className={cn(
            "scrollbar-minimal min-h-0 flex-1 overflow-auto rounded-xl border border-border/70",
            "[&_[data-slot=table-container]]:overflow-visible"
          )}
        >
          <Table
            className={cn(
              "[&_td]:py-2.5 [&_th:first-child]:pl-4 [&_td:first-child]:pl-4",
              "[&_th:last-child]:pr-4 [&_td:last-child]:pr-4"
            )}
          >
            <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0_var(--border)] [&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="hidden w-[80px] sm:table-cell">
                  MSCB
                </TableHead>
                <TableHead>Họ và tên</TableHead>
                <TableHead className="w-[140px]">Vai trò</TableHead>
                <TableHead className="hidden w-[200px] lg:table-cell">
                  Thỉnh giảng
                </TableHead>
                {!dept ? (
                  <TableHead className="hidden md:table-cell">Khoa</TableHead>
                ) : null}
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Điện thoại
                </TableHead>
                <TableHead className="w-[100px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={dept ? 8 : 9}
                    className="h-40 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <UserRound className="size-5 opacity-40" />
                      <p>Không tìm thấy giảng viên.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((lecturer, index) => {
                  const deptName = departments.find(
                    (d) => d.id === lecturer.departmentId
                  )?.name
                  return (
                    <TableRow key={lecturer.id}>
                      <TableCell className="text-center font-mono text-xs tabular-nums text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs tabular-nums text-muted-foreground sm:table-cell">
                        {lecturer.staffId ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {(() => {
                            const color = getLecturerColor(lecturer.name)
                            return (
                              <span
                                className={cn(
                                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                                  color.bg,
                                  color.text,
                                  color.border
                                )}
                                aria-hidden
                              >
                                {getInitials(lecturer.name)}
                              </span>
                            )
                          })()}
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="font-medium tracking-tight">
                              {lecturer.name}
                            </span>
                            {lecturer.note ? (
                              <span className="line-clamp-1 text-xs text-muted-foreground">
                                {lecturer.note}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={roleBadgeVariant(lecturer.role)}
                          className="font-normal"
                        >
                          {lecturer.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {lecturer.guestDepartmentIds?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {lecturer.guestDepartmentIds.map((gId) => {
                              const gDept = departments.find(
                                (d) => d.id === gId
                              )
                              return gDept ? (
                                <Badge
                                  key={gId}
                                  variant="outline"
                                  className="gap-1 text-[10px] font-normal text-amber-600"
                                >
                                  <ArrowRightLeft className="size-2.5" />
                                  {gDept.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      {!dept ? (
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {deptName ?? (
                            <span className="text-xs italic">—</span>
                          )}
                        </TableCell>
                      ) : null}
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {lecturer.email ?? "—"}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs tabular-nums text-muted-foreground lg:table-cell">
                        {lecturer.phone ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => openEdit(lecturer)}
                                  aria-label={`Sửa ${lecturer.name}`}
                                />
                              }
                            >
                              <Pencil />
                            </TooltipTrigger>
                            <TooltipContent>Sửa thông tin</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => openDelete(lecturer)}
                                  aria-label={`Xóa ${lecturer.name}`}
                                  className="text-muted-foreground hover:text-destructive"
                                />
                              }
                            >
                              <Trash2 />
                            </TooltipTrigger>
                            <TooltipContent>Xóa giảng viên</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <LecturerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        lecturer={editing}
        defaultDepartmentId={dept?.id}
        onSubmit={handleSubmit}
      />

      <LecturerDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        lecturer={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
