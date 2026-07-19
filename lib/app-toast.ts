/**
 * Toast helpers (sonner) — gọi được từ store / client components.
 */
import { toast } from "sonner"

export const appToast = {
  success(message: string, description?: string) {
    toast.success(message, description ? { description } : undefined)
  },
  info(message: string, description?: string) {
    toast.info(message, description ? { description } : undefined)
  },
  warning(message: string, description?: string) {
    toast.warning(message, description ? { description } : undefined)
  },
  error(message: string, description?: string) {
    toast.error(message, description ? { description } : undefined)
  },
  /** Cập nhật từ máy chủ (poll / focus) */
  remoteUpdate(kind: "departments" | "lecturers" | "all") {
    const label =
      kind === "departments"
        ? "khoa / thời khóa biểu"
        : kind === "lecturers"
          ? "giảng viên"
          : "dữ liệu"
    toast.info("Có cập nhật mới", {
      description: `Dữ liệu ${label} vừa được đồng bộ từ máy chủ.`,
      duration: 4500,
    })
  },
  /** Lần đầu tải sync thành công */
  remoteLoaded(kind: "departments" | "lecturers") {
    const label = kind === "departments" ? "khoa / lịch" : "giảng viên"
    toast.success("Đã đồng bộ", {
      description: `Tải dữ liệu ${label} từ máy chủ.`,
      duration: 3000,
    })
  },
}
