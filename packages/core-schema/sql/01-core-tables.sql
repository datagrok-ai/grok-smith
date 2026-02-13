-- Core Datagrok tables required by grok-smith apps.
-- Extracted from core/server/db/init_db.sql — 15 tables in dependency order.
-- Idempotent: uses IF NOT EXISTS where supported; safe to re-run.

-- ── entity_types ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS entity_types (
    id UUID NOT NULL PRIMARY KEY,
    name VARCHAR(512) NOT NULL,
    is_package_entity BOOLEAN,
    friendly_name VARCHAR(1024)
);

-- ── entities ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS entities (
  id UUID NOT NULL PRIMARY KEY,
  entity_type_id UUID REFERENCES entity_types(id),
  handle VARCHAR(512),
  tokens VARCHAR(64)[],
  friendly_name VARCHAR(1024),
  name VARCHAR(1024),
  namespace VARCHAR(1024) DEFAULT '',
  is_deleted BOOL DEFAULT FALSE,
  bind_id UUID
);

CREATE INDEX IF NOT EXISTS entities_handle_idx ON entities(handle);
CREATE INDEX IF NOT EXISTS i1 ON entities(namespace, entity_type_id);
CREATE INDEX IF NOT EXISTS entities_type_id_idx ON entities(entity_type_id, id);
CREATE INDEX IF NOT EXISTS entities_name_ns_deleted_idx ON entities(lower(name), lower(namespace), is_deleted, id);
CREATE INDEX IF NOT EXISTS entities_type_lower_handle_idx ON entities(entity_type_id, lower(handle));
CREATE INDEX IF NOT EXISTS entities_type_handle_idx ON entities(entity_type_id, handle);
CREATE INDEX IF NOT EXISTS entities_lower_handle_idx ON entities(lower(handle));
CREATE INDEX IF NOT EXISTS entities_bind_id_idx ON entities(bind_id);

-- ── groups ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS groups (
  id UUID NOT NULL PRIMARY KEY,
  friendly_name VARCHAR(255),
  name VARCHAR(1024),
  description VARCHAR(16384),
  is_role BOOLEAN,
  hidden BOOLEAN,
  personal BOOLEAN,
  pwd_hash VARCHAR(64),
  pwd_salt VARCHAR(64),
  author_id UUID,
  created_on TIMESTAMP WITHOUT TIME ZONE,
  updated_on TIMESTAMP WITHOUT TIME ZONE
);

-- ── users ───────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
   id UUID NOT NULL PRIMARY KEY,
   email VARCHAR(64),
   first_name VARCHAR(64),
   last_name VARCHAR(64),
   friendly_name VARCHAR(4096),
   name VARCHAR(4096),
   pwd_hash VARCHAR(64),
   pwd_salt VARCHAR(64),
   login VARCHAR(64),
   picture VARCHAR(4096),
   group_id UUID REFERENCES groups(id),
   default_tag VARCHAR(255),
   status VARCHAR(255),
   joined TIMESTAMP WITHOUT TIME ZONE,
   has_password BOOLEAN,
   email_confirmed BOOLEAN,
   picture_id UUID,
   project_id UUID,  -- FK added after projects table exists
   is_service BOOLEAN DEFAULT FALSE,
   agreement_accept_date TIMESTAMP WITHOUT TIME ZONE,
   analyze_accept_date TIMESTAMP WITHOUT TIME ZONE,
   updates_accept_date TIMESTAMP WITHOUT TIME ZONE,
   marketing_accept_date TIMESTAMP WITHOUT TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS users_login_id_idx ON users(login, id);
CREATE INDEX IF NOT EXISTS users_group_id_idx ON users(group_id, id);
CREATE INDEX IF NOT EXISTS users_project_id_idx ON users(project_id, id);

-- ── users_sessions ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    started TIMESTAMP WITHOUT TIME ZONE,
    ended TIMESTAMP WITHOUT TIME ZONE,
    ip VARCHAR(50),
    token VARCHAR(128),
    external_token VARCHAR(4096),
    is_admin BOOLEAN,
    token_hash VARCHAR(64),
    type VARCHAR(64),
    is_short BOOLEAN
);

CREATE UNIQUE INDEX IF NOT EXISTS users_sessions_token_ended_user_idx ON users_sessions(token, ended, user_id);
CREATE INDEX IF NOT EXISTS users_sessions_user_id_idx ON users_sessions(user_id, id);

-- ── groups_relations ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS groups_relations (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES groups(id),
  child_id UUID REFERENCES groups(id),
  is_admin BOOLEAN
);

CREATE INDEX IF NOT EXISTS groups_relations_child_parent_idx ON groups_relations(child_id, parent_id);
CREATE INDEX IF NOT EXISTS groups_relations_parent_id_idx ON groups_relations(parent_id, id);

-- ── entity_types_permissions ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS entity_types_permissions (
  id UUID NOT NULL PRIMARY KEY,
  entity_type_id UUID REFERENCES entity_types(id),
  name VARCHAR(1024),
  description VARCHAR(65536),
  default_permission INT,
  is_edit BOOLEAN,
  should_check_at_get BOOLEAN,
  should_check_at_save BOOLEAN,
  should_check_at_delete BOOLEAN,
  should_check_at_share BOOLEAN,
  project_permission_id UUID REFERENCES entity_types_permissions(id)
);

-- ── permissions ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS permissions (
  id UUID NOT NULL PRIMARY KEY,
  entity_id UUID,
  user_group_id UUID REFERENCES groups(id),
  permission_id UUID REFERENCES entity_types_permissions(id)
);

CREATE INDEX IF NOT EXISTS permissions_i1 ON permissions(permission_id, user_group_id, entity_id);
CREATE INDEX IF NOT EXISTS permissions_perm_entity_group_idx ON permissions(permission_id, entity_id, user_group_id);
CREATE INDEX IF NOT EXISTS permissions_user_group_id_idx ON permissions(user_group_id, id);
CREATE INDEX IF NOT EXISTS permissions_permission_id_idx ON permissions(permission_id, id);

-- ── projects ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY,
    friendly_name VARCHAR(1024),
    name VARCHAR(1024),
    description VARCHAR(16384),
    sid VARCHAR(1024),
    is_root BOOLEAN,
    project_values JSON,
    author_id UUID REFERENCES users(id),
    created_on TIMESTAMP WITHOUT TIME ZONE,
    updated_on TIMESTAMP WITHOUT TIME ZONE,
    picture_id UUID,
    is_entity BOOLEAN DEFAULT FALSE,
    is_package BOOLEAN,
    options JSON,
    layout JSON DEFAULT '{}',
    is_dashboard BOOLEAN,
    storage_connection_id UUID
);

CREATE INDEX IF NOT EXISTS projects_is_package_idx ON projects(is_package);
CREATE INDEX IF NOT EXISTS projects_author_id_idx ON projects(author_id, id);
CREATE INDEX IF NOT EXISTS projects_storage_connection_id_idx ON projects(storage_connection_id, id);

-- Deferred FK: users.project_id → projects.id (circular reference)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_project_id_fkey'
      AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES projects(id);
  END IF;
END
$$;

-- ── project_relations ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_relations (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  entity_id UUID REFERENCES entities(id),
  is_link BOOL
);

CREATE UNIQUE INDEX IF NOT EXISTS project_relations_entity_project_idx ON project_relations(entity_id, project_id);
CREATE UNIQUE INDEX IF NOT EXISTS project_relations_project_entity_idx ON project_relations(project_id, entity_id);

-- ── project_relations_all (materialized lookup, no PK) ──────────────────────────

CREATE TABLE IF NOT EXISTS project_relations_all (
  project_id UUID,
  entity_id UUID,
  is_link BOOL,
  level INT
);

CREATE UNIQUE INDEX IF NOT EXISTS project_relations_all_project_entity_idx ON project_relations_all(project_id, entity_id);
CREATE INDEX IF NOT EXISTS project_relations_all_entity_idx ON project_relations_all(entity_id);

-- ── entity_properties ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS entity_properties (
  id UUID NOT NULL PRIMARY KEY,
  name VARCHAR(1024),
  type VARCHAR(256) DEFAULT 'string',
  sub_type VARCHAR(256),
  sem_type VARCHAR(256),
  description VARCHAR(1024),
  nullable_raw BOOL,
  category VARCHAR(255),
  choices VARCHAR(1024)[]
);

-- ── entity_property_schemas ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS entity_property_schemas (
  id UUID NOT NULL PRIMARY KEY,
  name VARCHAR(1024),
  friendly_name VARCHAR(1024),
  created_on TIMESTAMP WITHOUT TIME ZONE,
  updated_on TIMESTAMP WITHOUT TIME ZONE,
  author_id UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS entity_property_schemas_author_id_idx ON entity_property_schemas(author_id, id);

-- ── properties_schemas ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS properties_schemas (
  schema_id UUID NOT NULL REFERENCES entity_property_schemas(id),
  property_id UUID NOT NULL REFERENCES entity_properties(id),
  sem_type VARCHAR(1024)
);

CREATE INDEX IF NOT EXISTS properties_schemas_property_id_idx ON properties_schemas(property_id);
CREATE INDEX IF NOT EXISTS properties_schemas_schema_id_idx ON properties_schemas(schema_id);

-- ── entity_types_schemas ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS entity_types_schemas (
    entity_type_id UUID NOT NULL,
    schema_id UUID NOT NULL,
    UNIQUE(entity_type_id, schema_id)
);
