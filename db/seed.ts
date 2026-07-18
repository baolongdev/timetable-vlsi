/**
 * Seed Neon DB from the static data files.
 * Usage: npm run db:seed  (requires DATABASE_URL in .env)
 */
import "dotenv/config"

import { getDb } from "./index"
import { courses, lecturers, sections } from "./schema"
import { initialCourses } from "../data/courses"
import { initialLecturers } from "../data/lecturers"
import { sections as sectionData } from "../data/sections"

async function main() {
  const db = getDb()

  console.log("Seeding lecturers…")
  await db.delete(lecturers)
  await db.insert(lecturers).values(
    initialLecturers.map((l) => ({
      staffId: l.staffId ?? null,
      name: l.name,
      role: l.role,
      email: l.email ?? null,
      phone: l.phone ?? null,
      note: l.note ?? null,
    }))
  )

  console.log("Seeding courses…")
  await db.delete(courses)
  await db.insert(courses).values(
    initialCourses.map((c) => ({
      code: c.code,
      name: c.name,
      leadLecturer: c.leadLecturer ?? null,
      theoryLecturers: c.theoryLecturers.join("|"),
      practiceLecturers: c.practiceLecturers.join("|"),
    }))
  )

  console.log("Seeding sections…")
  await db.delete(sections)
  await db.insert(sections).values(
    sectionData.map((s) => ({
      code: s.code,
      courseName: s.courseName,
      group: s.group,
      day: s.day,
      startPeriod: s.startPeriod,
      endPeriod: s.endPeriod,
      capacity: s.capacity,
      room: s.room,
      weeksLabel: s.weeksLabel,
      language: s.language,
    }))
  )

  console.log("Done. Seeded:", {
    lecturers: initialLecturers.length,
    courses: initialCourses.length,
    sections: sectionData.length,
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
