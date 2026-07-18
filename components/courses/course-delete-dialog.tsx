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
import type { Course } from "@/types/course"

type CourseDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: Course | null
  onConfirm: () => void
}

export function CourseDeleteDialog({
  open,
  onOpenChange,
  course,
  onConfirm,
}: CourseDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-xl sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa môn học?</AlertDialogTitle>
          <AlertDialogDescription>
            {course ? (
              <>
                Bạn sắp xóa{" "}
                <span className="font-medium text-foreground">
                  {course.code} — {course.name}
                </span>
                . Hành động này không thể hoàn tác trên phiên làm việc hiện
                tại.
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
