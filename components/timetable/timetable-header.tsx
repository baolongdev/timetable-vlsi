"use client"

import { PageBreadcrumb } from "@/components/layout/page-breadcrumb"
import { PageMenubar } from "@/components/layout/page-menubar"
import { cn } from "@/lib/utils"

type TimetableHeaderProps = {
  onExport: () => void
  onExportImage?: () => void
  onExportPdf?: () => void
  exporting?: boolean
  departmentName?: string
  departments?: { id: string; name: string }[]
  currentDeptId?: string
  conflictSlot?: React.ReactNode
  className?: string
}

export function TimetableHeader({
  onExport,
  onExportImage,
  onExportPdf,
  exporting = false,
  departmentName,
  departments = [],
  currentDeptId,
  conflictSlot,
  className,
}: TimetableHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <PageBreadcrumb
          items={[
            { label: "Thời khóa biểu", href: "/timetable" },
            ...(departmentName ? [{ label: departmentName }] : []),
          ]}
        />
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {departmentName ?? "Timetable"}
        </h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground/70">Semester 1</span>
          <span className="mx-1.5 text-border">•</span>
          <span>2026</span>
          {departmentName ? (
            <>
              <span className="mx-1.5 text-border">•</span>
              <span>Thời khóa biểu</span>
            </>
          ) : null}
        </p>
      </div>

      <PageMenubar
        activePage="timetable"
        departments={departments}
        currentDeptId={currentDeptId}
        exportMenu={{
          onExport,
          onExportImage,
          onExportPdf,
          exporting,
        }}
        conflictSlot={conflictSlot}
      />
    </header>
  )
}
