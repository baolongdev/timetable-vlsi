/**
 * Server-side data access: reads from Neon Postgres when DATABASE_URL is
 * set, otherwise falls back to the static files in /data — so the app runs
 * with zero config in dev and switches to the DB on Vercel automatically.
 */
import { getDb, hasDatabase } from "@/db"
import { initialCourses } from "@/data/courses"
import { initialLecturers } from "@/data/lecturers"
import { sections as staticSections } from "@/data/sections"
import type { Course } from "@/types/course"
import type { Lecturer, LecturerRole } from "@/types/lecturer"
import type { CourseSection, SectionLanguage } from "@/types/section"

export async function loadLecturers(): Promise<Lecturer[]> {
  if (!hasDatabase()) return initialLecturers
  const rows = await getDb().query.lecturers.findMany()
  return rows.map((r) => ({
    id: String(r.id),
    staffId: r.staffId ?? undefined,
    name: r.name,
    role: r.role as LecturerRole,
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
