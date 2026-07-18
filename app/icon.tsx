import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 64, height: 64 }
export const contentType = "image/png"

/** Minimal "T" grid mark matching the app's black & white style */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: 14,
          color: "#fafafa",
          fontSize: 40,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        T
      </div>
    ),
    size
  )
}
