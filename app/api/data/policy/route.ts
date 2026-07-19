import { NextRequest, NextResponse } from "next/server"

import { verifyDeptPolicyPassword } from "@/lib/dept-policy"

export const dynamic = "force-dynamic"

/** POST { password } — xác thực mật khẩu thêm/xóa khoa */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { password?: unknown }
    const ok = verifyDeptPolicyPassword(body.password)
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "invalid_password" },
        { status: 401 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 })
  }
}
