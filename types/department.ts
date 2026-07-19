import type { Assignment, ImportedSection } from "@/types/import"

/** Khoa / tổ đã import từ Excel + phân công trên UI */
export type Department = {
  /** id ổn định: slug từ tên sheet */
  id: string
  /** Tên khoa / tổ (tên sheet trong file Excel) */
  name: string
  fileName: string
  uploadedAt: number
  sections: ImportedSection[]
  assignments: Record<string, Assignment>
}
