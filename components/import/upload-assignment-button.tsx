"use client"

import * as React from "react"
import { FileSpreadsheet, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { parseAssignmentWorkbook } from "@/lib/parse-assignment-xlsx"
import type { ImportedSection } from "@/types/import"

type UploadAssignmentButtonProps = {
  onImported: (fileName: string, sections: ImportedSection[]) => void
  className?: string
}

/** Nút upload file Excel phân công giảng dạy (.xlsx) */
export function UploadAssignmentButton({
  onImported,
  className,
}: UploadAssignmentButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleFile = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const data = await file.arrayBuffer()
      const sections = parseAssignmentWorkbook(data)
      if (sections.length === 0) {
        setError("Không tìm thấy dữ liệu phân công trong file.")
        return
      }
      onImported(file.name, sections)
    } catch {
      setError("Không đọc được file — cần đúng định dạng .xlsx.")
    } finally {
      setBusy(false)
    }
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
        Upload Excel
      </Button>
      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : null}
    </>
  )
}
