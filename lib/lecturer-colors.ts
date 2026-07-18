import { initialLecturers } from "@/data/lecturers"
import { schedules } from "@/data/timetable"
import {
  createPersonColorMap,
  getPersonColor,
  type PersonColor,
} from "@/lib/person-color"

/**
 * One shared color assignment for the whole app so a lecturer has the SAME
 * color on the Timetable and on the Lecturers page. Built from the union of
 * the lecturer roster and every lecturer appearing in the schedule data.
 */
const lecturerColorMap = createPersonColorMap([
  ...initialLecturers.map((l) => l.name),
  ...schedules.map((s) => s.lecturer),
])

export function getLecturerColor(name: string): PersonColor {
  // Names added at runtime fall back to the hash-based color
  return lecturerColorMap.get(name) ?? getPersonColor(name)
}
