import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${SITE_URL}/timetable`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/departments`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/courses`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/lecturers`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ]
}
