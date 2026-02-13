// Drizzle ORM schema for the 15 core Datagrok tables.
// Column types and constraints match core/server/db/init_db.sql exactly.

import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

// ── entity_types ───────────────────────────────────────────────────────────────

export const entityTypes = pgTable('entity_types', {
  id: uuid('id').primaryKey().notNull(),
  name: varchar('name', { length: 512 }).notNull(),
  isPackageEntity: boolean('is_package_entity'),
  friendlyName: varchar('friendly_name', { length: 1024 }),
})

// ── entities ───────────────────────────────────────────────────────────────────

export const entities = pgTable(
  'entities',
  {
    id: uuid('id').primaryKey().notNull(),
    entityTypeId: uuid('entity_type_id').references(() => entityTypes.id),
    handle: varchar('handle', { length: 512 }),
    // tokens is varchar(64)[] in SQL — stored as text since Drizzle has limited array support
    tokens: text('tokens'),
    friendlyName: varchar('friendly_name', { length: 1024 }),
    name: varchar('name', { length: 1024 }),
    namespace: varchar('namespace', { length: 1024 }).default(''),
    isDeleted: boolean('is_deleted').default(false),
    bindId: uuid('bind_id'),
  },
  (t) => [
    index('entities_handle_idx').on(t.handle),
    index('i1').on(t.namespace, t.entityTypeId),
    index('entities_type_id_idx').on(t.entityTypeId, t.id),
    index('entities_name_ns_deleted_idx').on(
      t.name,
      t.namespace,
      t.isDeleted,
      t.id,
    ),
    index('entities_type_lower_handle_idx').on(t.entityTypeId, t.handle),
    index('entities_type_handle_idx').on(t.entityTypeId, t.handle),
    index('entities_lower_handle_idx').on(t.handle),
    index('entities_bind_id_idx').on(t.bindId),
  ],
)

// ── groups ──────────────────────────────────────────────────────────────────────

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().notNull(),
  friendlyName: varchar('friendly_name', { length: 255 }),
  name: varchar('name', { length: 1024 }),
  description: varchar('description', { length: 16384 }),
  isRole: boolean('is_role'),
  hidden: boolean('hidden'),
  personal: boolean('personal'),
  pwdHash: varchar('pwd_hash', { length: 64 }),
  pwdSalt: varchar('pwd_salt', { length: 64 }),
  authorId: uuid('author_id'),
  createdOn: timestamp('created_on', { withTimezone: false }),
  updatedOn: timestamp('updated_on', { withTimezone: false }),
})

// ── users ───────────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().notNull(),
    email: varchar('email', { length: 64 }),
    firstName: varchar('first_name', { length: 64 }),
    lastName: varchar('last_name', { length: 64 }),
    friendlyName: varchar('friendly_name', { length: 4096 }),
    name: varchar('name', { length: 4096 }),
    pwdHash: varchar('pwd_hash', { length: 64 }),
    pwdSalt: varchar('pwd_salt', { length: 64 }),
    login: varchar('login', { length: 64 }),
    picture: varchar('picture', { length: 4096 }),
    groupId: uuid('group_id').references(() => groups.id),
    defaultTag: varchar('default_tag', { length: 255 }),
    status: varchar('status', { length: 255 }),
    joined: timestamp('joined', { withTimezone: false }),
    hasPassword: boolean('has_password'),
    emailConfirmed: boolean('email_confirmed'),
    pictureId: uuid('picture_id'),
    // Circular FK to projects — added via ALTER TABLE in SQL
    projectId: uuid('project_id'),
    isService: boolean('is_service').default(false),
    agreementAcceptDate: timestamp('agreement_accept_date', { withTimezone: false }),
    analyzeAcceptDate: timestamp('analyze_accept_date', { withTimezone: false }),
    updatesAcceptDate: timestamp('updates_accept_date', { withTimezone: false }),
    marketingAcceptDate: timestamp('marketing_accept_date', { withTimezone: false }),
  },
  (t) => [
    uniqueIndex('users_login_id_idx').on(t.login, t.id),
    index('users_group_id_idx').on(t.groupId, t.id),
    index('users_project_id_idx').on(t.projectId, t.id),
  ],
)

// ── users_sessions ──────────────────────────────────────────────────────────────

export const usersSessions = pgTable(
  'users_sessions',
  {
    id: uuid('id').primaryKey().notNull(),
    userId: uuid('user_id').references(() => users.id),
    started: timestamp('started', { withTimezone: false }),
    ended: timestamp('ended', { withTimezone: false }),
    ip: varchar('ip', { length: 50 }),
    token: varchar('token', { length: 128 }),
    externalToken: varchar('external_token', { length: 4096 }),
    isAdmin: boolean('is_admin'),
    tokenHash: varchar('token_hash', { length: 64 }),
    type: varchar('type', { length: 64 }),
    isShort: boolean('is_short'),
  },
  (t) => [
    uniqueIndex('users_sessions_token_ended_user_idx').on(
      t.token,
      t.ended,
      t.userId,
    ),
    index('users_sessions_user_id_idx').on(t.userId, t.id),
  ],
)

// ── groups_relations ────────────────────────────────────────────────────────────

export const groupsRelations = pgTable(
  'groups_relations',
  {
    id: uuid('id').primaryKey().notNull(),
    parentId: uuid('parent_id').references(() => groups.id),
    childId: uuid('child_id').references(() => groups.id),
    isAdmin: boolean('is_admin'),
  },
  (t) => [
    index('groups_relations_child_parent_idx').on(t.childId, t.parentId),
    index('groups_relations_parent_id_idx').on(t.parentId, t.id),
  ],
)

// ── entity_types_permissions ────────────────────────────────────────────────────

export const entityTypesPermissions = pgTable('entity_types_permissions', {
  id: uuid('id').primaryKey().notNull(),
  entityTypeId: uuid('entity_type_id').references(() => entityTypes.id),
  name: varchar('name', { length: 1024 }),
  description: varchar('description', { length: 65536 }),
  defaultPermission: integer('default_permission'),
  isEdit: boolean('is_edit'),
  shouldCheckAtGet: boolean('should_check_at_get'),
  shouldCheckAtSave: boolean('should_check_at_save'),
  shouldCheckAtDelete: boolean('should_check_at_delete'),
  shouldCheckAtShare: boolean('should_check_at_share'),
  // Self-reference — kept as plain UUID to avoid circular type inference
  projectPermissionId: uuid('project_permission_id'),
})

// ── permissions ─────────────────────────────────────────────────────────────────

export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').primaryKey().notNull(),
    entityId: uuid('entity_id'),
    userGroupId: uuid('user_group_id').references(() => groups.id),
    permissionId: uuid('permission_id').references(() => entityTypesPermissions.id),
  },
  (t) => [
    index('permissions_i1').on(t.permissionId, t.userGroupId, t.entityId),
    index('permissions_perm_entity_group_idx').on(
      t.permissionId,
      t.entityId,
      t.userGroupId,
    ),
    index('permissions_user_group_id_idx').on(t.userGroupId, t.id),
    index('permissions_permission_id_idx').on(t.permissionId, t.id),
  ],
)

// ── projects ────────────────────────────────────────────────────────────────────

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().notNull(),
    friendlyName: varchar('friendly_name', { length: 1024 }),
    name: varchar('name', { length: 1024 }),
    description: varchar('description', { length: 16384 }),
    sid: varchar('sid', { length: 1024 }),
    isRoot: boolean('is_root'),
    projectValues: json('project_values'),
    authorId: uuid('author_id').references(() => users.id),
    createdOn: timestamp('created_on', { withTimezone: false }),
    updatedOn: timestamp('updated_on', { withTimezone: false }),
    pictureId: uuid('picture_id'),
    isEntity: boolean('is_entity').default(false),
    isPackage: boolean('is_package'),
    options: json('options'),
    layout: json('layout').default({}),
    isDashboard: boolean('is_dashboard'),
    // FK to connections — not in this schema set, kept as plain UUID
    storageConnectionId: uuid('storage_connection_id'),
  },
  (t) => [
    index('projects_is_package_idx').on(t.isPackage),
    index('projects_author_id_idx').on(t.authorId, t.id),
    index('projects_storage_connection_id_idx').on(
      t.storageConnectionId,
      t.id,
    ),
  ],
)

// ── project_relations ───────────────────────────────────────────────────────────

export const projectRelations = pgTable(
  'project_relations',
  {
    id: uuid('id').primaryKey().notNull(),
    projectId: uuid('project_id').references(() => projects.id),
    entityId: uuid('entity_id').references(() => entities.id),
    isLink: boolean('is_link'),
  },
  (t) => [
    uniqueIndex('project_relations_entity_project_idx').on(
      t.entityId,
      t.projectId,
    ),
    uniqueIndex('project_relations_project_entity_idx').on(
      t.projectId,
      t.entityId,
    ),
  ],
)

// ── project_relations_all (materialised lookup — no PK) ─────────────────────────

export const projectRelationsAll = pgTable(
  'project_relations_all',
  {
    projectId: uuid('project_id'),
    entityId: uuid('entity_id'),
    isLink: boolean('is_link'),
    level: integer('level'),
  },
  (t) => [
    uniqueIndex('project_relations_all_project_entity_idx').on(
      t.projectId,
      t.entityId,
    ),
    index('project_relations_all_entity_idx').on(t.entityId),
  ],
)

// ── entity_properties ───────────────────────────────────────────────────────────

export const entityProperties = pgTable('entity_properties', {
  id: uuid('id').primaryKey().notNull(),
  name: varchar('name', { length: 1024 }),
  type: varchar('type', { length: 256 }).default('string'),
  subType: varchar('sub_type', { length: 256 }),
  semType: varchar('sem_type', { length: 256 }),
  description: varchar('description', { length: 1024 }),
  nullableRaw: boolean('nullable_raw'),
  category: varchar('category', { length: 255 }),
  // choices is varchar(1024)[] in SQL — stored as text fallback
  choices: text('choices'),
})

// ── entity_property_schemas ─────────────────────────────────────────────────────

export const entityPropertySchemas = pgTable(
  'entity_property_schemas',
  {
    id: uuid('id').primaryKey().notNull(),
    name: varchar('name', { length: 1024 }),
    friendlyName: varchar('friendly_name', { length: 1024 }),
    createdOn: timestamp('created_on', { withTimezone: false }),
    updatedOn: timestamp('updated_on', { withTimezone: false }),
    authorId: uuid('author_id').references(() => users.id),
  },
  (t) => [
    index('entity_property_schemas_author_id_idx').on(t.authorId, t.id),
  ],
)

// ── properties_schemas ──────────────────────────────────────────────────────────

export const propertiesSchemas = pgTable(
  'properties_schemas',
  {
    schemaId: uuid('schema_id')
      .notNull()
      .references(() => entityPropertySchemas.id),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => entityProperties.id),
    semType: varchar('sem_type', { length: 1024 }),
  },
  (t) => [
    index('properties_schemas_property_id_idx').on(t.propertyId),
    index('properties_schemas_schema_id_idx').on(t.schemaId),
  ],
)

// ── entity_types_schemas ────────────────────────────────────────────────────────

export const entityTypesSchemas = pgTable(
  'entity_types_schemas',
  {
    entityTypeId: uuid('entity_type_id').notNull(),
    schemaId: uuid('schema_id').notNull(),
  },
  (t) => [
    uniqueIndex('entity_types_schemas_unique').on(t.entityTypeId, t.schemaId),
  ],
)

// ── Zod schemas ─────────────────────────────────────────────────────────────────

export const insertEntityTypeSchema = createInsertSchema(entityTypes)
export const selectEntityTypeSchema = createSelectSchema(entityTypes)

export const insertEntitySchema = createInsertSchema(entities)
export const selectEntitySchema = createSelectSchema(entities)

export const insertGroupSchema = createInsertSchema(groups)
export const selectGroupSchema = createSelectSchema(groups)

export const insertUserSchema = createInsertSchema(users)
export const selectUserSchema = createSelectSchema(users)

export const insertUserSessionSchema = createInsertSchema(usersSessions)
export const selectUserSessionSchema = createSelectSchema(usersSessions)

export const insertGroupsRelationSchema = createInsertSchema(groupsRelations)
export const selectGroupsRelationSchema = createSelectSchema(groupsRelations)

export const insertEntityTypesPermissionSchema = createInsertSchema(entityTypesPermissions)
export const selectEntityTypesPermissionSchema = createSelectSchema(entityTypesPermissions)

export const insertPermissionSchema = createInsertSchema(permissions)
export const selectPermissionSchema = createSelectSchema(permissions)

export const insertProjectSchema = createInsertSchema(projects)
export const selectProjectSchema = createSelectSchema(projects)

export const insertProjectRelationSchema = createInsertSchema(projectRelations)
export const selectProjectRelationSchema = createSelectSchema(projectRelations)

export const insertProjectRelationAllSchema = createInsertSchema(projectRelationsAll)
export const selectProjectRelationAllSchema = createSelectSchema(projectRelationsAll)

export const insertEntityPropertySchema = createInsertSchema(entityProperties)
export const selectEntityPropertySchema = createSelectSchema(entityProperties)

export const insertEntityPropertySchemaSchema = createInsertSchema(entityPropertySchemas)
export const selectEntityPropertySchemaSchema = createSelectSchema(entityPropertySchemas)

export const insertPropertiesSchemaSchema = createInsertSchema(propertiesSchemas)
export const selectPropertiesSchemaSchema = createSelectSchema(propertiesSchemas)

export const insertEntityTypesSchemaSchema = createInsertSchema(entityTypesSchemas)
export const selectEntityTypesSchemaSchema = createSelectSchema(entityTypesSchemas)

// ── TypeScript types ────────────────────────────────────────────────────────────

export type EntityType = InferSelectModel<typeof entityTypes>
export type NewEntityType = InferInsertModel<typeof entityTypes>

export type Entity = InferSelectModel<typeof entities>
export type NewEntity = InferInsertModel<typeof entities>

export type Group = InferSelectModel<typeof groups>
export type NewGroup = InferInsertModel<typeof groups>

export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export type UserSession = InferSelectModel<typeof usersSessions>
export type NewUserSession = InferInsertModel<typeof usersSessions>

export type GroupsRelation = InferSelectModel<typeof groupsRelations>
export type NewGroupsRelation = InferInsertModel<typeof groupsRelations>

export type EntityTypesPermission = InferSelectModel<typeof entityTypesPermissions>
export type NewEntityTypesPermission = InferInsertModel<typeof entityTypesPermissions>

export type Permission = InferSelectModel<typeof permissions>
export type NewPermission = InferInsertModel<typeof permissions>

export type Project = InferSelectModel<typeof projects>
export type NewProject = InferInsertModel<typeof projects>

export type ProjectRelation = InferSelectModel<typeof projectRelations>
export type NewProjectRelation = InferInsertModel<typeof projectRelations>

export type ProjectRelationAll = InferSelectModel<typeof projectRelationsAll>
export type NewProjectRelationAll = InferInsertModel<typeof projectRelationsAll>

export type EntityProperty = InferSelectModel<typeof entityProperties>
export type NewEntityProperty = InferInsertModel<typeof entityProperties>

export type EntityPropertySchemaRow = InferSelectModel<typeof entityPropertySchemas>
export type NewEntityPropertySchemaRow = InferInsertModel<typeof entityPropertySchemas>

export type PropertiesSchema = InferSelectModel<typeof propertiesSchemas>
export type NewPropertiesSchema = InferInsertModel<typeof propertiesSchemas>

export type EntityTypesSchema = InferSelectModel<typeof entityTypesSchemas>
export type NewEntityTypesSchema = InferInsertModel<typeof entityTypesSchemas>
