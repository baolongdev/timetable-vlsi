"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Lecturer } from "@/types/lecturer"

type LecturerDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lecturer: Lecturer | null
  onConfirm: () => void
}

export function LecturerDeleteDialog({
  open,
  onOpenChange,
  lecturer,
  onConfirm,
}: LecturerDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-xl sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa giảng viên?</AlertDialogTitle>
          <AlertDialogDescription>
            {lecturer ? (
              <>
                Bạn sắp xóa{" "}
                <span className="font-medium text-foreground">
                  {lecturer.name}
                </span>{" "}
                ({lecturer.role}). Hành động này không thể hoàn tác trên phiên
                làm việc hiện tại.
              </>
            ) : (
              "Hành động này không thể hoàn tác."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xl"
            variant="destructive"
            onClick={onConfirm}
          >
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
