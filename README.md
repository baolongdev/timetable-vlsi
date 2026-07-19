# VLSI Timetable

Thời khóa biểu học kỳ Tổ VLSI — Kỹ thuật Máy tính. Minimal black & white, built with **Next.js**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**.

## Stack

- Next.js (App Router) + React 19
- TypeScript (strict)
- Tailwind CSS v4
- shadcn/ui (base-nova) + Base UI
- MongoDB (optional — **đồng bộ** khoa / phân công / giảng viên giữa các máy)
- Drizzle ORM + Neon Postgres (optional — static data fallback)
- Lucide React, GSAP

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No DB required — the app
works offline with `localStorage` + static files. Set `MONGODB_URI` to sync.

## MongoDB sync (recommended)

Đồng bộ **departments** (Excel import + phân công) và **lecturers** qua API `/api/data/*`.

```bash
cp .env.example .env
# Điền MONGODB_URI (MongoDB Atlas free tier)
# MONGODB_DB=timetable-vlsi   # optional
```

- Client: cache `localStorage` → pull khi mở trang / focus / mỗi 30s → push khi sửa.
- Không có `MONGODB_URI`: app vẫn chạy local (ghi chú «lưu cục bộ»).
- Có Mongo: UI hiện «đồng bộ MongoDB».

**Vercel:** Project Settings → Environment Variables → `MONGODB_URI`, `MONGODB_DB`.

## Database (optional, Neon Postgres)

```bash
cp .env.example .env       # fill DATABASE_URL from neon.tech
npm run db:push            # create tables
npm run db:seed            # seed from data/*.ts
```

Pages revalidate every 5 minutes (`revalidate = 300`), so DB edits show up
without a redeploy.

## Structure

```
app/                       # Pages: /timetable, /courses, /lecturers
components/timetable/      # Grid, lane layout, cards, dialogs, toolbar
components/courses/        # Courses table + sections/form dialogs
components/lecturers/      # Lecturers table + form dialogs
data/                      # Static data: sections, courses, lecturers
db/                        # Drizzle schema, client, seed script
lib/                       # data-loader (DB↔static), person colors, site meta
types/                     # Models
```

## Features

- Week grid (Thứ 2–CN × tiết 1–12), sticky day header & period column
- Real section data: 144 nhóm lớp with rooms, weeks, language (V/TA)
- Overlapping sections laid out side-by-side (equal-width lanes)
- Per-lecturer unique colors shared across all pages
- Course management: teaching teams, per-course section listing
- Realtime search + filters (course / lecturer / room), CSV export (BOM)
- Dark/light theme (button or `D`), help dialog (`H`), search focus (`Ctrl+K`)
- SEO: Open Graph image, sitemap, robots, manifest, per-page metadata

## Scripts

| Command             | Description             |
| ------------------- | ----------------------- |
| `npm run dev`       | Dev server              |
| `npm run build`     | Production build        |
| `npm run start`     | Start production server |
| `npm run typecheck` | TypeScript check        |
| `npm run lint`      | ESLint                  |
| `npm run db:push`   | Create/update DB tables |
| `npm run db:seed`   | Seed DB from static data|
| `npm run db:studio` | Drizzle Studio          |

## Deploy (Vercel)

1. Push to GitHub, import repo on Vercel
2. Add `MONGODB_URI` (và tùy chọn `MONGODB_DB`) — **đồng bộ production**
3. (Optional) Neon → `DATABASE_URL` env var
4. Set `NEXT_PUBLIC_SITE_URL` to the production URL
