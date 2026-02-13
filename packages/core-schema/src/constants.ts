// Well-known UUIDs from the Datagrok core database.
// Sources: core/server/db/create_system.sql, create_admin.sql, core/shared/grok_shared/lib/src/entity.dart

// ── Users ──────────────────────────────────────────────────────────────────────

export const SYSTEM_USER_ID = '3e32c5fa-ac9c-4d39-8b4b-4db3e576b3c3'
export const ADMIN_USER_ID = '878c42b0-9a50-11e6-c537-6bf8e9ab02ee'

// ── Groups ─────────────────────────────────────────────────────────────────────

export const ALL_USERS_GROUP_ID = 'a4b45840-9a50-11e6-9cc9-8546b8bf62e6'
export const SYSTEM_GROUP_ID = 'a4b45840-ac9c-4d39-8b4b-4db3e576b3c3'
export const ADMIN_GROUP_ID = 'a4b45840-9a50-11e6-c537-6bf8e9ab02ee'

// ── Projects ───────────────────────────────────────────────────────────────────

export const ALL_USERS_PROJECT_ID = '34d97910-e870-11e6-d91b-fe969a979c7a'
export const SYSTEM_PROJECT_ID = 'ca3e6a91-5a12-481a-bbe5-fe969a979c7a'
export const ADMIN_PROJECT_ID = '878c42b0-9a50-11e6-c537-6bf8e9ab0299'

// ── Entity types ───────────────────────────────────────────────────────────────
// From core/shared/grok_shared/lib/src/entity.dart → initTypes()

export const ENTITY_TYPE_IDS = {
  User: '34d97910-e870-11e6-d91b-eb5db4485432',
  UserGroup: '34d97910-e870-11e6-d91b-eb5db4488225',
  Project: '34d97910-e870-11e6-d91b-eb5db4743824',
  TableInfo: '34d75630-e870-11e6-a30b-490ee6f98d5f',
  FileInfo: '34d75630-e870-11e6-bfe1-590ff6f10d14',
  FuncCall: '34d7f270-e870-11e6-e6a5-430821302130',
  DataConnection: '34d7f270-e870-11e6-e6a5-5b3e1dfae8a9',
  DataQuery: '34d867a0-e870-11e6-af38-d74fc5b6639f',
  DataJob: '34d97910-e870-11e6-d91b-eb5db448f1e8',
  ColumnInfo: '34d97910-e870-11e6-d91b-eb5db4488876',
  GrokPackage: '34d97910-e870-1014-d91b-432094312081',
  GrokPublishedPackage: '34d97910-e870-1014-d91b-489421804281',
  Script: '84030422-5432-1014-d762-254754235752',
  Notebook: '84030422-5432-1014-d762-654654654365',
  ViewLayout: '84030422-5432-1014-d762-a54325354555',
  ViewInfo: '84030422-5432-1014-d762-097321097072',
  Func: '34d97910-e870-1014-d91b-743294384320',
  EntityPropertySchema: '34d97910-e870-1014-d91b-784312783179',
  Credentials: '34d97910-e870-1014-d91b-890450407841',
} as const

// ── Entity-level permission type IDs ───────────────────────────────────────────
// From core/shared/grok_shared/lib/src/privileges.dart → initPrivileges()

export const ENTITY_PERMISSION_IDS = {
  VIEW: '34da1550-e870-11e6-9cb3-825892686412',
  EDIT: '34dbc300-e870-11e6-aeca-8258926864ed',
  DELETE: '34dbc300-e870-11e6-aeca-82589268dede',
  SHARE: '34dc1120-e870-11e6-a8f9-825892686fda',
} as const
