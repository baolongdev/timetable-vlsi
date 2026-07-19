"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useDepartments } from "@/lib/department-store"

/**
 * Trang index /timetable, /courses: điều hướng tới khoa đầu tiên
 * (`/timetable/ktmt`) — chưa có khoa nào thì về trang /departments.
 */
export function DeptIndexRedirect({ base }: { base: string }) {
  const router = useRouter()
  const { departments, hydrated } = useDepartments()

  React.useEffect(() => {
    if (!hydrated) return
    if (departments.length > 0) {
      router.replace(`${base}/${departments[0].id}`)
    } else {
      router.replace("/departments")
    }
  }, [hydrated, departments, base, router])

  return null
}
