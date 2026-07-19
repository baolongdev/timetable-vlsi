"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"
import type { FlowingMenuItem } from "@/components/flowing-menu"

// GSAP menu nặng — tải lười với skeleton thay thế
const FlowingMenu = dynamic(
  () => import("@/components/flowing-menu").then((m) => m.FlowingMenu),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full flex-col">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-1 items-center justify-center border-t border-border first:border-t-0"
          >
            <Skeleton className="h-8 w-48" />
          </div>
        ))}
      </div>
    ),
  }
)

/**
 * Landing menu using React Bits FlowingMenu.
 * Minimal black & white palette to match the timetable app.
 */
const menuItems: FlowingMenuItem[] = [
  {
    link: "/departments",
    text: "Departments",
    image: "https://picsum.photos/seed/departments/600/400",
  },
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
