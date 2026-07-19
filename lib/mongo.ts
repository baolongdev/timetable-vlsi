/**
 * MongoDB client — serverless-safe (cache trên globalThis).
 * Chỉ dùng phía server (Route Handlers / RSC).
 */
import { MongoClient, type Db, type Collection } from "mongodb"

import type { Department } from "@/types/department"
import type { Assignment, ImportedSection } from "@/types/import"
import type { Lecturer } from "@/types/lecturer"

export type DepartmentDoc = {
  _id: string
  id: string
  name: string
  fileName: string
  uploadedAt: number
  sections: ImportedSection[]
  assignments: Record<string, Assignment>
  updatedAt: number
}

export type LecturerDoc = Lecturer & {
  _id: string
  updatedAt: number
}

export type SyncMetaDoc = {
  _id: "global"
  departmentsAt: number
  lecturersAt: number
}

const DEFAULT_DB = "timetable-vlsi"

type MongoGlobal = {
  __vlsiMongoClient?: MongoClient
  __vlsiMongoPromise?: Promise<MongoClient>
}

function getMongoGlobal(): MongoGlobal {
  return globalThis as unknown as MongoGlobal
}

export function hasMongo(): boolean {
  return Boolean(process.env.MONGODB_URI?.trim())
}

export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) throw new Error("MONGODB_URI is not set")

  const g = getMongoGlobal()
  if (g.__vlsiMongoClient) return g.__vlsiMongoClient

  if (!g.__vlsiMongoPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8_000,
    })
    g.__vlsiMongoPromise = client.connect().then((c) => {
      g.__vlsiMongoClient = c
      return c
    })
  }
  return g.__vlsiMongoPromise
}

export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClient()
  const name = process.env.MONGODB_DB?.trim() || DEFAULT_DB
  return client.db(name)
}

export async function departmentsCol(): Promise<Collection<DepartmentDoc>> {
  const db = await getMongoDb()
  return db.collection<DepartmentDoc>("departments")
}

export async function lecturersCol(): Promise<Collection<LecturerDoc>> {
  const db = await getMongoDb()
  return db.collection<LecturerDoc>("lecturers")
}

export async function syncMetaCol(): Promise<Collection<SyncMetaDoc>> {
  const db = await getMongoDb()
  return db.collection<SyncMetaDoc>("sync_meta")
}

export function departmentToDoc(dept: Department, updatedAt = Date.now()): DepartmentDoc {
  return {
    _id: dept.id,
    id: dept.id,
    name: dept.name,
    fileName: dept.fileName,
    uploadedAt: dept.uploadedAt,
    sections: dept.sections,
    assignments: dept.assignments,
    updatedAt,
  }
}

export function docToDepartment(doc: DepartmentDoc): Department {
  return {
    id: doc.id,
    name: doc.name,
    fileName: doc.fileName,
    uploadedAt: doc.uploadedAt,
    sections: doc.sections ?? [],
    assignments: doc.assignments ?? {},
  }
}

export function lecturerToDoc(l: Lecturer, updatedAt = Date.now()): LecturerDoc {
  return {
    _id: l.id,
    id: l.id,
    staffId: l.staffId,
    name: l.name,
    role: l.role,
    email: l.email,
    phone: l.phone,
    note: l.note,
    updatedAt,
  }
}

export function docToLecturer(doc: LecturerDoc): Lecturer {
  return {
    id: doc.id,
    staffId: doc.staffId,
    name: doc.name,
    role: doc.role,
    email: doc.email,
    phone: doc.phone,
    note: doc.note,
  }
}

export async function touchMeta(
  patch: Partial<Pick<SyncMetaDoc, "departmentsAt" | "lecturersAt">>
): Promise<void> {
  const col = await syncMetaCol()
  const now = Date.now()
  const existing = await col.findOne({ _id: "global" })
  const doc: SyncMetaDoc = {
    _id: "global",
    departmentsAt: patch.departmentsAt ?? existing?.departmentsAt ?? now,
    lecturersAt: patch.lecturersAt ?? existing?.lecturersAt ?? now,
  }
  // Cast: driver WithoutId<> conflict with custom string _id
  await col.replaceOne({ _id: "global" }, doc as never, { upsert: true })
}

export async function getMeta(): Promise<SyncMetaDoc | null> {
  const col = await syncMetaCol()
  return col.findOne({ _id: "global" })
}

export async function loadAllDepartments(): Promise<Department[]> {
  const col = await departmentsCol()
  const docs = await col.find({}).sort({ name: 1 }).toArray()
  return docs.map(docToDepartment)
}

export async function loadAllLecturers(): Promise<Lecturer[]> {
  const col = await lecturersCol()
  const docs = await col.find({}).toArray()
  // Sort by numeric id when possible, else name
  return docs
    .map(docToLecturer)
    .sort((a, b) => {
      const na = Number(a.id)
      const nb = Number(b.id)
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
      return a.name.localeCompare(b.name, "vi")
    })
}

export async function getServerUpdatedAt(): Promise<number> {
  const meta = await getMeta()
  if (meta) {
    return Math.max(meta.departmentsAt || 0, meta.lecturersAt || 0)
  }
  const [depts, lecs] = await Promise.all([
    departmentsCol().then((c) =>
      c
        .find({}, { projection: { updatedAt: 1 } })
        .sort({ updatedAt: -1 })
        .limit(1)
        .toArray()
    ),
    lecturersCol().then((c) =>
      c
        .find({}, { projection: { updatedAt: 1 } })
        .sort({ updatedAt: -1 })
        .limit(1)
        .toArray()
    ),
  ])
  return Math.max(depts[0]?.updatedAt ?? 0, lecs[0]?.updatedAt ?? 0)
}
