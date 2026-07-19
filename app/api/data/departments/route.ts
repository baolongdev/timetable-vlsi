import { NextRequest, NextResponse } from "next/server"

import { requestHasValidPolicyPassword } from "@/lib/dept-policy"
import {
  departmentToDoc,
  departmentsCol,
  hasMongo,
  loadAllDepartments,
  touchMeta,
} from "@/lib/mongo"
import type { Department } from "@/types/department"

export const dynamic = "force-dynamic"

function isDepartment(v: unknown): v is Department {
  if (!v || typeof v !== "object") return false
  const d = v as Department
  return (
    typeof d.id === "string" &&
    typeof d.name === "string" &&
    Array.isArray(d.sections) &&
    typeof d.assignments === "object" &&
    d.assignments != null
  )
}

/** PUT — sync danh sách khoa.
 *  Xóa khoa khỏi server chỉ khi có mật khẩu policy (tránh wipe qua sync).
 *  Không có pass: chỉ upsert, không delete.
 */
export async function PUT(request: NextRequest) {
  if (!hasMongo()) {
    return NextResponse.json({ error: "mongo_not_configured" }, { status: 503 })
  }

  try {
    const body = (await request.json()) as { departments?: unknown }
    const list = body.departments
    if (!Array.isArray(list) || !list.every(isDepartment)) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 })
    }

    const canDelete = requestHasValidPolicyPassword(request.headers)
    const now = Date.now()
    const col = await departmentsCol()
    const ids = new Set(list.map((d) => d.id))

    if (canDelete) {
      if (ids.size === 0) {
        await col.deleteMany({})
      } else {
        await col.deleteMany({ _id: { $nin: [...ids] } })
      }
    }

    if (list.length > 0) {
      const ops = list.map((d) => ({
        replaceOne: {
          filter: { _id: d.id },
          replacement: departmentToDoc(d, now),
          upsert: true,
        },
      }))
      await col.bulkWrite(ops)
    }

    await touchMeta({ departmentsAt: now })
    return NextResponse.json({
      ok: true,
      updatedAt: now,
      count: list.length,
      deletedMissing: canDelete,
    })
  } catch (e) {
    console.error("[api/data/departments PUT]", e)
    return NextResponse.json({ error: "mongo_error" }, { status: 502 })
  }
}

/** POST — upsert một khoa (cần mật khẩu policy) */
export async function POST(request: NextRequest) {
  if (!hasMongo()) {
    return NextResponse.json({ error: "mongo_not_configured" }, { status: 503 })
  }

  if (!requestHasValidPolicyPassword(request.headers)) {
    return NextResponse.json({ error: "policy_password_required" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { department?: unknown }
    if (!isDepartment(body.department)) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 })
    }
    const dept = body.department
    const now = Date.now()
    const col = await departmentsCol()
    await col.replaceOne(
      { _id: dept.id },
      departmentToDoc(dept, now),
      { upsert: true }
    )
    await touchMeta({ departmentsAt: now })
    return NextResponse.json({ ok: true, updatedAt: now, id: dept.id })
  } catch (e) {
    console.error("[api/data/departments POST]", e)
    return NextResponse.json({ error: "mongo_error" }, { status: 502 })
  }
}

/** GET — chỉ departments */
export async function GET() {
  if (!hasMongo()) {
    return NextResponse.json({ error: "mongo_not_configured" }, { status: 503 })
  }
  try {
    const departments = await loadAllDepartments()
    return NextResponse.json({ departments })
  } catch (e) {
    console.error("[api/data/departments GET]", e)
    return NextResponse.json({ error: "mongo_error" }, { status: 502 })
  }
}
