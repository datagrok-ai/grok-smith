import type { Table } from 'drizzle-orm'

// ── Prisma-shaped query interfaces ──────────────────────────────────────────

export type WhereValue =
  | string
  | number
  | boolean
  | Date
  | null

export interface WhereOperators {
  eq?: WhereValue
  gt?: WhereValue
  gte?: WhereValue
  lt?: WhereValue
  lte?: WhereValue
  not?: WhereValue | WhereOperators
  in?: WhereValue[]
  notIn?: WhereValue[]
  contains?: string
  startsWith?: string
  endsWith?: string
}

export type WhereField = WhereValue | WhereOperators

export interface WhereClause {
  [field: string]: WhereField | WhereClause | WhereClause[] | undefined
  AND?: WhereClause[]
  OR?: WhereClause[]
  NOT?: WhereClause
}

export type OrderDirection = 'asc' | 'desc'
export type OrderByClause = Record<string, OrderDirection> | Record<string, OrderDirection>[]

export type SelectClause = Record<string, true>

export interface FindManyArgs {
  where?: WhereClause
  orderBy?: OrderByClause
  take?: number
  skip?: number
  select?: SelectClause
  includePermissions?: boolean
}

export interface FindUniqueArgs {
  where: { id: string }
  select?: SelectClause
  includePermissions?: boolean
}

export interface FindFirstArgs {
  where?: WhereClause
  orderBy?: OrderByClause
  select?: SelectClause
  includePermissions?: boolean
}

export interface CountArgs {
  where?: WhereClause
}

export interface CreateArgs {
  data: Record<string, unknown>
}

export interface CreateManyArgs {
  data: Record<string, unknown>[]
}

export interface UpdateArgs {
  where: { id: string }
  data: Record<string, unknown>
}

export interface UpdateManyArgs {
  where: WhereClause
  data: Record<string, unknown>
}

export interface DeleteArgs {
  where: { id: string }
}

export interface DeleteManyArgs {
  where: WhereClause
}

// ── Permission info attached to rows ────────────────────────────────────────

export interface RowPermissions {
  canEdit: boolean
  canDelete: boolean
  canShare: boolean
}

// ── Entity accessor (the Prisma-shaped API surface per table) ───────────────

export interface EntityAccessor {
  findMany: (args?: FindManyArgs) => Promise<Record<string, unknown>[]>
  findUnique: (args: FindUniqueArgs) => Promise<Record<string, unknown> | null>
  findFirst: (args?: FindFirstArgs) => Promise<Record<string, unknown> | null>
  count: (args?: CountArgs) => Promise<number>
  create: (args: CreateArgs) => Promise<Record<string, unknown>>
  createMany: (args: CreateManyArgs) => Promise<Record<string, unknown>[]>
  update: (args: UpdateArgs) => Promise<Record<string, unknown>>
  updateMany: (args: UpdateManyArgs) => Promise<{ count: number }>
  delete: (args: DeleteArgs) => Promise<Record<string, unknown>>
  deleteMany: (args: DeleteManyArgs) => Promise<{ count: number }>
}

// ── Internal config for each entity table ───────────────────────────────────

export interface EntityTableConfig {
  table: Table
  tableName: string
  entityTypeName: string
}
