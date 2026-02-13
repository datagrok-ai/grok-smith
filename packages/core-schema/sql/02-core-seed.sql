-- Core seed data for standalone grok-smith deployments.
-- Extracted from core/server/db/create_system.sql and create_admin.sql.
-- Idempotent: every INSERT uses WHERE NOT EXISTS.

-- ── Entity types ────────────────────────────────────────────────────────────────

INSERT INTO entity_types (id, name)
SELECT '34d97910-e870-11e6-d91b-eb5db4485432', 'User'
WHERE NOT EXISTS (SELECT 1 FROM entity_types WHERE id = '34d97910-e870-11e6-d91b-eb5db4485432');

INSERT INTO entity_types (id, name)
SELECT '34d97910-e870-11e6-d91b-eb5db4488225', 'UserGroup'
WHERE NOT EXISTS (SELECT 1 FROM entity_types WHERE id = '34d97910-e870-11e6-d91b-eb5db4488225');

INSERT INTO entity_types (id, name)
SELECT '34d97910-e870-11e6-d91b-eb5db4743824', 'Project'
WHERE NOT EXISTS (SELECT 1 FROM entity_types WHERE id = '34d97910-e870-11e6-d91b-eb5db4743824');

-- ── Projects (created before users due to FK) ──────────────────────────────────

-- All Users root project
INSERT INTO projects (id, friendly_name, is_root, is_dashboard)
SELECT '34d97910-e870-11e6-d91b-fe969a979c7a', 'allUsers', true, false
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE id = '34d97910-e870-11e6-d91b-fe969a979c7a');

-- System project
INSERT INTO projects (id, friendly_name, name, is_root, is_entity, is_package, is_dashboard)
SELECT 'ca3e6a91-5a12-481a-bbe5-fe969a979c7a', 'system', 'System', true, false, false, false
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE id = 'ca3e6a91-5a12-481a-bbe5-fe969a979c7a');

-- Admin project
INSERT INTO projects (id, friendly_name, name, is_root, is_entity, is_package, is_dashboard)
SELECT '878c42b0-9a50-11e6-c537-6bf8e9ab0299', 'admin', 'Admin', true, false, false, false
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE id = '878c42b0-9a50-11e6-c537-6bf8e9ab0299');

-- ── Groups ──────────────────────────────────────────────────────────────────────

-- All Users group
INSERT INTO groups (id, friendly_name, name, description, hidden, personal, author_id, created_on, updated_on)
SELECT 'a4b45840-9a50-11e6-9cc9-8546b8bf62e6', 'All users', '', '', false, false,
       '3e32c5fa-ac9c-4d39-8b4b-4db3e576b3c3', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE id = 'a4b45840-9a50-11e6-9cc9-8546b8bf62e6');

-- System personal wrapper group
INSERT INTO groups (id, friendly_name, name, description, hidden, personal, author_id, created_on, updated_on)
SELECT 'a4b45840-ac9c-4d39-8b4b-4db3e576b3c3', 'System', '', '', false, true,
       '3e32c5fa-ac9c-4d39-8b4b-4db3e576b3c3', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE id = 'a4b45840-ac9c-4d39-8b4b-4db3e576b3c3');

-- Admin personal wrapper group
INSERT INTO groups (id, friendly_name, name, description, hidden, personal, author_id, created_on, updated_on)
SELECT 'a4b45840-9a50-11e6-c537-6bf8e9ab02ee', 'Admin', '', '', false, true,
       '3e32c5fa-ac9c-4d39-8b4b-4db3e576b3c3', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE id = 'a4b45840-9a50-11e6-c537-6bf8e9ab02ee');

-- ── Users ───────────────────────────────────────────────────────────────────────

-- System user
INSERT INTO users (id, email, first_name, friendly_name, last_name, login, picture, group_id, project_id, has_password, status, email_confirmed)
SELECT '3e32c5fa-ac9c-4d39-8b4b-4db3e576b3c3', 'system-datagrok', 'System', 'System', '',
       'system', '/images/entities/system_user.png',
       'a4b45840-ac9c-4d39-8b4b-4db3e576b3c3', 'ca3e6a91-5a12-481a-bbe5-fe969a979c7a',
       true, 'active', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '3e32c5fa-ac9c-4d39-8b4b-4db3e576b3c3');

-- Admin user (default password: admin)
INSERT INTO users (id, email, first_name, friendly_name, last_name, login, pwd_hash, pwd_salt, group_id, has_password, status, email_confirmed, project_id)
SELECT '878c42b0-9a50-11e6-c537-6bf8e9ab02ee', 'admin-datagrok', 'Admin', 'Admin', '',
       'admin',
       'd0507ed67a1fb9482c22f76aebc20538bb81815755cd2610f07c9b87400be1a7',
       'Jf7n:p(p(PSYbW:YhuL?az:jrD6(Nz~fqXBKsBhoH0!5/uB4%f6YAv9P^4C!tt5',
       'a4b45840-9a50-11e6-c537-6bf8e9ab02ee',
       true, 'active', true,
       '878c42b0-9a50-11e6-c537-6bf8e9ab0299'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '878c42b0-9a50-11e6-c537-6bf8e9ab02ee');

-- ── Groups relations ────────────────────────────────────────────────────────────

-- System → All Users (admin of All Users)
INSERT INTO groups_relations (id, parent_id, child_id, is_admin)
SELECT '50613b71-84ef-4e85-8510-46ef14d36403',
       'a4b45840-9a50-11e6-9cc9-8546b8bf62e6',
       'a4b45840-ac9c-4d39-8b4b-4db3e576b3c3', true
WHERE NOT EXISTS (SELECT 1 FROM groups_relations WHERE id = '50613b71-84ef-4e85-8510-46ef14d36403');

-- Admin → All Users
INSERT INTO groups_relations (id, parent_id, child_id)
SELECT 'cb23d280-9a50-11e6-d771-0764b5e56c3b',
       'a4b45840-9a50-11e6-9cc9-8546b8bf62e6',
       'a4b45840-9a50-11e6-c537-6bf8e9ab02ee'
WHERE NOT EXISTS (SELECT 1 FROM groups_relations WHERE id = 'cb23d280-9a50-11e6-d771-0764b5e56c3b');

-- ── Entities (registry entries) ─────────────────────────────────────────────────

-- All Users group entity
INSERT INTO entities (id, entity_type_id, handle)
SELECT 'a4b45840-9a50-11e6-9cc9-8546b8bf62e6', '34d97910-e870-11e6-d91b-eb5db4488225', 'all'
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE id = 'a4b45840-9a50-11e6-9cc9-8546b8bf62e6');

-- System group entity
INSERT INTO entities (id, entity_type_id, handle)
SELECT 'a4b45840-ac9c-4d39-8b4b-4db3e576b3c3', '34d97910-e870-11e6-d91b-eb5db4488225', 'system'
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE id = 'a4b45840-ac9c-4d39-8b4b-4db3e576b3c3');

-- Admin group entity
INSERT INTO entities (id, entity_type_id, handle)
SELECT 'a4b45840-9a50-11e6-c537-6bf8e9ab02ee', '34d97910-e870-11e6-d91b-eb5db4488225', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE id = 'a4b45840-9a50-11e6-c537-6bf8e9ab02ee');

-- System user entity
INSERT INTO entities (id, entity_type_id, handle)
SELECT '3e32c5fa-ac9c-4d39-8b4b-4db3e576b3c3', '34d97910-e870-11e6-d91b-eb5db4485432', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE id = '3e32c5fa-ac9c-4d39-8b4b-4db3e576b3c3');

-- Admin user entity
INSERT INTO entities (id, entity_type_id, handle)
SELECT '878c42b0-9a50-11e6-c537-6bf8e9ab02ee', '34d97910-e870-11e6-d91b-eb5db4485432', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE id = '878c42b0-9a50-11e6-c537-6bf8e9ab02ee');

-- System project entity
INSERT INTO entities (id, entity_type_id, handle, friendly_name, name, namespace)
SELECT 'ca3e6a91-5a12-481a-bbe5-fe969a979c7a', '34d97910-e870-11e6-d91b-eb5db4743824',
       'System', 'System', 'System', ''
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE id = 'ca3e6a91-5a12-481a-bbe5-fe969a979c7a');

-- Admin project entity
INSERT INTO entities (id, entity_type_id, handle, friendly_name, name, namespace)
SELECT '878c42b0-9a50-11e6-c537-6bf8e9ab0299', '34d97910-e870-11e6-d91b-eb5db4743824',
       'Admin', 'Admin', 'Admin', ''
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE id = '878c42b0-9a50-11e6-c537-6bf8e9ab0299');
