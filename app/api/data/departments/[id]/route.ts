import { NextRequest, NextResponse } from "next/server"

import { departmentsCol, hasMongo, touchMeta } from "@/lib/mongo"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

/** DELETE /api/data/departments/[id] */
export async function DELETE(_request: NextRequest, ctx: Ctx) {
  if (!hasMongo()) {
    return NextResponse.json({ error: "mongo_not_configured" }, { status: 503 })
  }

  try {
    const { id } = await ctx.params
    if (!id) {
      return NextResponse.json({ error: "missing_id" }, { status: 400 })
    }
    const col = await departmentsCol()
    const result = await col.deleteOne({ _id: id })
    const now = Date.now()
    await touchMeta({ departmentsAt: now })
    return NextResponse.json({
      ok: true,
      deleted: result.deletedCount > 0,
      updatedAt: now,
    })
  } catch (e) {
    console.error("[api/data/departments/id DELETE]", e)
    return NextResponse.json({ error: "mongo_error" }, { status: 502 })
  }
}
