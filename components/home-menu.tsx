"use client"

import { FlowingMenu, type FlowingMenuItem } from "@/components/flowing-menu"

/**
 * Landing menu using React Bits FlowingMenu.
 * Minimal black & white palette to match the timetable app.
 */
const menuItems: FlowingMenuItem[] = [
  {
    link: "/timetable",
    text: "Timetable",
    image: "https://picsum.photos/seed/timetable/600/400",
  },
  {
    link: "/courses",
    text: "Courses",
    image: "https://picsum.photos/seed/courses/600/400",
  },
  {
    link: "/lecturers",
    text: "Lecturers",
    image: "https://picsum.photos/seed/lecturers/600/400",
  },
]

export function HomeMenu() {
  return (
    <div className="relative h-dvh w-full">
      <FlowingMenu
        items={menuItems}
        speed={12}
        textColor="#0a0a0a"
        bgColor="#ffffff"
        marqueeBgColor="#0a0a0a"
        marqueeTextColor="#ffffff"
        borderColor="#e5e5e5"
      />
    </div>
  )
}
