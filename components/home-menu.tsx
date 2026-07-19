"use client"

import dynamic from "next/dynamic"

import type { FlowingMenuItem } from "@/components/flowing-menu"
import { TourHelpButton } from "@/components/onboarding-tour"
import { PresenceHeaderControl } from "@/components/presence-widget"
import { Skeleton } from "@/components/ui/skeleton"

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
      <div data-tour="home-menu" className="h-full w-full">
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
      <div className="pointer-events-none absolute top-4 right-4 z-20 sm:top-6 sm:right-6">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-xl border border-border/80 bg-background/90 p-0.5 shadow-sm backdrop-blur-sm">
          <TourHelpButton />
          <PresenceHeaderControl />
        </div>
      </div>
    </div>
  )
}
