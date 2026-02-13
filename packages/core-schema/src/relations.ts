// Drizzle v2 relational definitions — enables db.query.users.findMany({ with: { sessions: true } })

import { defineRelations } from 'drizzle-orm'
import * as schema from './schema.js'

export const relations = defineRelations(schema, (r) => ({
  // ── entity_types ──────────────────────────────────────────────────────────
  entityTypes: {
    entities: r.many.entities(),
    permissions: r.many.entityTypesPermissions(),
  },

  // ── entities ──────────────────────────────────────────────────────────────
  entities: {
    entityType: r.one.entityTypes({
      from: r.entities.entityTypeId,
      to: r.entityTypes.id,
    }),
    projectRelations: r.many.projectRelations(),
  },

  // ── groups ────────────────────────────────────────────────────────────────
  groups: {
    users: r.many.users(),
    parentRelations: r.many.groupsRelations({
      alias: 'parentGroup',
    }),
    childRelations: r.many.groupsRelations({
      alias: 'childGroup',
    }),
    permissions: r.many.permissions(),
  },

  // ── users ─────────────────────────────────────────────────────────────────
  users: {
    group: r.one.groups({
      from: r.users.groupId,
      to: r.groups.id,
    }),
    project: r.one.projects({
      from: r.users.projectId,
      to: r.projects.id,
    }),
    sessions: r.many.usersSessions(),
  },

  // ── users_sessions ────────────────────────────────────────────────────────
  usersSessions: {
    user: r.one.users({
      from: r.usersSessions.userId,
      to: r.users.id,
    }),
  },

  // ── groups_relations ──────────────────────────────────────────────────────
  groupsRelations: {
    parent: r.one.groups({
      from: r.groupsRelations.parentId,
      to: r.groups.id,
      alias: 'parentGroup',
    }),
    child: r.one.groups({
      from: r.groupsRelations.childId,
      to: r.groups.id,
      alias: 'childGroup',
    }),
  },

  // ── entity_types_permissions ──────────────────────────────────────────────
  entityTypesPermissions: {
    entityType: r.one.entityTypes({
      from: r.entityTypesPermissions.entityTypeId,
      to: r.entityTypes.id,
    }),
    projectPermission: r.one.entityTypesPermissions({
      from: r.entityTypesPermissions.projectPermissionId,
      to: r.entityTypesPermissions.id,
      alias: 'projectPermission',
    }),
    childPermissions: r.many.entityTypesPermissions({
      alias: 'projectPermission',
    }),
    grants: r.many.permissions(),
  },

  // ── permissions ───────────────────────────────────────────────────────────
  permissions: {
    userGroup: r.one.groups({
      from: r.permissions.userGroupId,
      to: r.groups.id,
    }),
    permissionType: r.one.entityTypesPermissions({
      from: r.permissions.permissionId,
      to: r.entityTypesPermissions.id,
    }),
  },

  // ── projects ──────────────────────────────────────────────────────────────
  projects: {
    author: r.one.users({
      from: r.projects.authorId,
      to: r.users.id,
    }),
    relations: r.many.projectRelations(),
  },

  // ── project_relations ─────────────────────────────────────────────────────
  projectRelations: {
    project: r.one.projects({
      from: r.projectRelations.projectId,
      to: r.projects.id,
    }),
    entity: r.one.entities({
      from: r.projectRelations.entityId,
      to: r.entities.id,
    }),
  },

  // ── entity_property_schemas ───────────────────────────────────────────────
  entityPropertySchemas: {
    author: r.one.users({
      from: r.entityPropertySchemas.authorId,
      to: r.users.id,
    }),
    properties: r.many.propertiesSchemas(),
  },

  // ── properties_schemas ────────────────────────────────────────────────────
  propertiesSchemas: {
    schema: r.one.entityPropertySchemas({
      from: r.propertiesSchemas.schemaId,
      to: r.entityPropertySchemas.id,
    }),
    property: r.one.entityProperties({
      from: r.propertiesSchemas.propertyId,
      to: r.entityProperties.id,
    }),
  },

  // ── entity_types_schemas ──────────────────────────────────────────────────
  entityTypesSchemas: {
    entityType: r.one.entityTypes({
      from: r.entityTypesSchemas.entityTypeId,
      to: r.entityTypes.id,
    }),
    schema: r.one.entityPropertySchemas({
      from: r.entityTypesSchemas.schemaId,
      to: r.entityPropertySchemas.id,
    }),
  },
}))
