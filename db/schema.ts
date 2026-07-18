import {
  integer,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core"

export const lecturers = pgTable("lecturers", {
  id: serial("id").primaryKey(),
  staffId: varchar("staff_id", { length: 16 }),
  name: text("name").notNull(),
  role: varchar("role", { length: 32 }).notNull(),
  email: text("email"),
  phone: varchar("phone", { length: 32 }),
  note: text("note"),
})

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 16 }).notNull().unique(),
  name: text("name").notNull(),
  leadLecturer: text("lead_lecturer"),
  /** Danh sách tên, phân cách "|" — đơn giản hoá quan hệ n-n */
  theoryLecturers: text("theory_lecturers").notNull().default(""),
  practiceLecturers: text("practice_lecturers").notNull().default(""),
})

export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 16 }).notNull(),
  courseName: text("course_name").notNull(),
  group: varchar("group", { length: 16 }).notNull(),
  day: integer("day").notNull(),
  startPeriod: integer("start_period").notNull(),
  endPeriod: integer("end_period").notNull(),
  capacity: integer("capacity").notNull(),
  room: varchar("room", { length: 32 }).notNull(),
  weeksLabel: text("weeks_label").notNull(),
  language: varchar("language", { length: 4 }).notNull(),
})
