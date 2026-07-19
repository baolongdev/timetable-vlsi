"use client"

import * as React from "react"
import { FileSpreadsheet, Loader2, Table2 } from "lucide-react"

import { DeptPolicyDialog } from "@/components/dept-policy-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { departmentStore } from "@/lib/department-store"
import {
  parseWorkbookSheet,
  readAssignmentWorkbook,
  type ParsedWorkbook,
} from "@/lib/parse-assignment-xlsx"
import { cn } from "@/lib/utils"

type UploadAssignmentButtonProps = {
  /** Gọi sau khi import xong (id các khoa vừa thêm) */
  onImported?: (departmentIds: string[]) => void
  className?: string
}

/**
 * Upload file Excel phân công (.xlsx). Mỗi sheet hợp lệ = một khoa/tổ —
 * dialog cho tick chọn những sheet cần đưa vào hệ thống.
 * Thêm khoa yêu cầu mật khẩu policy (ACLAB2023 / DEPT_POLICY_PASSWORD).
 */
export function UploadAssignmentButton({
  onImported,
  className,
}: UploadAssignmentButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [fileName, setFileName] = React.useState("")
  const [parsed, setParsed] = React.useState<ParsedWorkbook | null>(null)
  const [chosen, setChosen] = React.useState<Set<string>>(new Set())

  const [policyOpen, setPolicyOpen] = React.useState(false)

  const handleFile = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const data = await file.arrayBuffer()
      const wb = readAssignmentWorkbook(data)
      if (wb.sheets.length === 0) {
        setError("Không tìm thấy sheet phân công hợp lệ trong file.")
        return
      }
      setFileName(file.name)
      setParsed(wb)
      // Mặc định: 1 sheet thì chọn luôn; nhiều sheet thì chưa chọn gì
      setChosen(
        wb.sheets.length === 1 ? new Set([wb.sheets[0].name]) : new Set()
      )
      setPickerOpen(true)
    } catch {
      setError("Không đọc được file — cần đúng định dạng .xlsx.")
    } finally {
      setBusy(false)
    }
  }

  const toggleSheet = (name: string) => {
    setChosen((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const runImport = () => {
    if (!parsed || chosen.size === 0) return
    const ids: string[] = []
    for (const sheet of parsed.sheets) {
      if (!chosen.has(sheet.name)) continue
      const sections = parseWorkbookSheet(parsed, sheet.name)
      ids.push(departmentStore.addDepartment(sheet.name, fileName, sections))
    }
    setPickerOpen(false)
    setParsed(null)
    onImported?.(ids)
  }

  /** Sau khi chọn sheet → yêu cầu mật khẩu rồi mới import */
  const requestImport = () => {
    if (!parsed || chosen.size === 0) return
    setPolicyOpen(true)
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ""
        }}
      />
      <Button
        variant="ghost"
        size="sm"
        className={className}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <Loader2 data-icon="inline-start" className="animate-spin" />
        ) : (
          <FileSpreadsheet data-icon="inline-start" />
        )}
        {busy ? "Đang đọc file…" : "Upload Excel"}
      </Button>
      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : null}

      {/* Sheet picker — mỗi sheet là một khoa/tổ */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <div className="flex flex-col gap-4 p-6">
            <DialogHeader className="gap-1.5">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Chọn khoa / tổ cần import
              </DialogTitle>
              <DialogDescription>
                <span className="font-medium text-foreground/80">
                  {fileName}
                </span>{" "}
                có {parsed?.sheets.length} sheet phân công. Mỗi sheet được
                lưu thành một khoa riêng. Bước tiếp theo cần mật khẩu quản trị.
              </DialogDescription>
            </DialogHeader>

            <div className="scrollbar-minimal flex max-h-72 flex-col gap-1 overflow-y-auto">
              {parsed?.sheets.map((sheet) => {
                const checked = chosen.has(sheet.name)
                return (
                  <button
                    key={sheet.name}
                    type="button"
                    onClick={() => toggleSheet(sheet.name)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left",
                      "transition-colors duration-150",
                      checked
                        ? "border-foreground/40 bg-muted/60"
                        : "border-border/70 hover:border-foreground/20 hover:bg-muted/30"
                    )}
                  >
                    <span className="flex items-center gap-2.5 text-sm font-medium">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleSheet(sheet.name)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Chọn ${sheet.name}`}
                      />
                      <Table2 className="size-4 text-muted-foreground" />
                      {sheet.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className="font-mono text-[11px] tabular-nums"
                    >
                      {sheet.rowCount} nhóm
                    </Badge>
                  </button>
                )
              })}
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 border-t border-border/60 bg-muted/30 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setPickerOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={chosen.size === 0}
              onClick={requestImport}
            >
              Import {chosen.size > 0 ? `${chosen.size} khoa` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeptPolicyDialog
        open={policyOpen}
        onOpenChange={setPolicyOpen}
        title="Xác nhận thêm khoa"
        description={`Nhập mật khẩu quản trị để import ${chosen.size} khoa/tổ vào hệ thống.`}
        confirmLabel="Import"
        onVerified={runImport}
      />
    </>
  )
}
