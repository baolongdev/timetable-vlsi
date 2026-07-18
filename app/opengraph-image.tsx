import { ImageResponse } from "next/og"

import { SITE_NAME } from "@/lib/site"

export const runtime = "edge"
export const alt = SITE_NAME
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** Minimal black & white OG card — mirrors the timetable grid look */
export default function OpengraphImage() {
  const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
  // Decorative "schedule blocks": [column 0-6, top %, height %]
  const blocks: Array<[number, number, number]> = [
    [0, 10, 26],
    [1, 44, 34],
    [2, 18, 22],
    [3, 56, 30],
    [4, 8, 38],
    [5, 52, 26],
    [6, 24, 20],
  ]

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left: wordmark */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 24,
            padding: "0 72px",
            width: 640,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#a1a1aa",
            }}
          >
            Tổ VLSI · Kỹ thuật Máy tính
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 1,
            }}
          >
            Timetable
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#d4d4d8",
              lineHeight: 1.4,
            }}
          >
            Thời khóa biểu học kỳ — môn học, nhóm lớp & giảng viên
          </div>
        </div>

        {/* Right: mini timetable grid */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            margin: 48,
            borderRadius: 24,
            border: "1px solid #3f3f46",
            background: "#111113",
            overflow: "hidden",
          }}
        >
          {/* Day header */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #3f3f46",
              height: 56,
            }}
          >
            {days.map((d) => (
              <div
                key={d}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  color: "#a1a1aa",
                  borderRight: "1px solid #27272a",
                }}
              >
                {d}
              </div>
            ))}
          </div>
          {/* Body with blocks */}
          <div style={{ display: "flex", flex: 1 }}>
            {days.map((d, col) => {
              const block = blocks.find(([c]) => c === col)
              return (
                <div
                  key={d}
                  style={{
                    flex: 1,
                    display: "flex",
                    position: "relative",
                    borderRight: "1px solid #27272a",
                  }}
                >
                  {block ? (
                    <div
                      style={{
                        position: "absolute",
                        left: 8,
                        right: 8,
                        top: `${block[1]}%`,
                        height: `${block[2]}%`,
                        borderRadius: 14,
                        border: "1px solid #52525b",
                        background: "#fafafa",
                      }}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    ),
    size
  )
}
