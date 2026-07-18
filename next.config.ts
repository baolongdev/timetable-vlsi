import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Allow HMR / dev assets when opening the app via LAN / Tailscale IP
  allowedDevOrigins: ["100.124.250.50", "localhost", "127.0.0.1"],
}

export default nextConfig
