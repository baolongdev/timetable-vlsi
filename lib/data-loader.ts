/**
 * Server-side data access:
 * 1. MongoDB (MONGODB_URI) — nguồn đồng bộ runtime
 * 2. Neon Postgres (DATABASE_URL) — legacy seed
 * 3. Static files in /data — zero-config fallback
 */
import { getDb, hasDatabase } from "@/db"
import { initialCourses } from "@/data/courses"
import { initialLecturers } from "@/data/lecturers"
import { sections as staticSections } from "@/data/sections"
import { hasMongo, loadAllLecturers as loadMongoLecturers } from "@/lib/mongo"
import type { Course } from "@/types/course"
import type { Lecturer, LecturerRole } from "@/types/lecturer"
import type { CourseSection, SectionLanguage } from "@/types/section"

export async function loadLecturers(): Promise<Lecturer[]> {
  if (hasMongo()) {
    try {
      const list = await loadMongoLecturers()
      if (list.length > 0) return list
    } catch (e) {
      console.error("[loadLecturers] mongo", e)
    }
  }
  if (!hasDatabase()) return initialLecturers
  const rows = await getDb().query.lecturers.findMany()
  return rows.map((r) => ({
    id: String(r.id),
    staffId: r.staffId ?? "",
    name: r.name,
    role: r.role as LecturerRole,
    departmentId: (r as Record<string, unknown>).departmentId as string ?? "",
    guestDepartmentIds: ((r as Record<string, unknown>).guestDepartmentIds as string[]) ?? [],
    email: r.email ?? undefined,
    phone: r.phone ?? undefined,
    note: r.note ?? undefined,
  }))
}

export async function loadCourses(): Promise<Course[]> {
  if (!hasDatabase()) return initialCourses
  const rows = await getDb().query.courses.findMany()
  return rows.map((r) => ({
    id: String(r.id),
    code: r.code,
    name: r.name,
    leadLecturer: r.leadLecturer ?? undefined,
    theoryLecturers: r.theoryLecturers ? r.theoryLecturers.split("|") : [],
    practiceLecturers: r.practiceLecturers
      ? r.practiceLecturers.split("|")
      : [],
  }))
}

export async function loadSections(): Promise<CourseSection[]> {
  if (!hasDatabase()) return staticSections
  const rows = await getDb().query.sections.findMany()
  return rows.map((r) => ({
    code: r.code,
    courseName: r.courseName,
    group: r.group,
    day: r.day,
    startPeriod: r.startPeriod,
    endPeriod: r.endPeriod,
    capacity: r.capacity,
    room: r.room,
    weeksLabel: r.weeksLabel,
    language: r.language as SectionLanguage,
  }))
}
