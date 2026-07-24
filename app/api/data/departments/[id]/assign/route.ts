import { NextRequest, NextResponse } from "next/server"

import { departmentsCol, hasMongo, invalidateQueryCache, touchMeta } from "@/lib/mongo"
import type { Assignment } from "@/types/import"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

/** PATCH — gán lead/teacher cho một nhóm (section key) */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  if (!hasMongo()) {
    return NextResponse.json({ error: "mongo_not_configured" }, { status: 503 })
  }

  try {
    const { id } = await ctx.params
    const body = (await request.json()) as {
      key?: string
      patch?: Assignment
    }
    if (!id || !body.key || typeof body.key !== "string" || !body.patch) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 })
    }

    const now = Date.now()
    const col = await departmentsCol()
    const setFields: Record<string, unknown> = { updatedAt: now }
    if (body.patch.lead !== undefined) {
      setFields[`assignments.${body.key}.lead`] = body.patch.lead
    }
    if (body.patch.teacher !== undefined) {
      setFields[`assignments.${body.key}.teacher`] = body.patch.teacher
    }

    const result = await col.updateOne({ _id: id }, { $set: setFields })
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 })
    }
    await touchMeta({ departmentsAt: now })
    invalidateQueryCache()
    return NextResponse.json({ ok: true, updatedAt: now })
  } catch (e) {
    console.error("[api/data/departments/id/assign PATCH]", e)
    return NextResponse.json({ error: "mongo_error" }, { status: 502 })
  }
}
