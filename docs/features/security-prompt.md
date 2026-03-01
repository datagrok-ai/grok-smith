Help me design the entity permission system, based on the current database structure and the specification in DB-ENTITY-PERMISSIONS.md. 

The idea is that this server would work flawlessly when attached to the existing Datagrok schema (of which our core schema is a subset of). In the datagrok schema, we have pre-defined entities (such as projects or connections), and the server manages their permissions. In grok-smith, each application ships its own database schema - and only a subset of these tables should become "entities". Currently, the idea is that if a table contains the 
`entity_id UUID REFERENCES public.entities(id)` field, it is considered an entity, and should
get special treatment:
- from all routes involving this entity:
  - when listing these objects, objects you don't have a 'view' privilege for should not be returned (even with joins originating from other tables) 
- from UI
  - illegal actions (such as "delete" when you are a viewer) should not be offered as options in the menu. Additional checks are desirable.

See Datagrok permissions:
`C:\datagrok\core\server\db\PERMISSIONS.md`
`C:\datagrok\core\server\db\ENTITY_PERMISSIONS.md`
`C:\datagrok\core\server\db\DB-ENTITY-SCHEMAS.md`

Check out Datagrok server, we might want to keep our implementation/endpoints as close to the Datagrok one as possible for integration purposes
`C:\datagrok\core\server\datlas\CLAUDE.md`

Later on, we will also be adding privileges to db entity schemas - let's not implement now, but keep it in mind.

 I think this should include the following (feel free to change/add, jsut a start)

-server-kit (/privileges/... route)
  - get all global privileges
  - get all entity types along with possible privileges for each
  - a method for checking if current user can do "action" (a privilege) against "entity" (an entity) of type "entityType", taking into account current groups/roles/privileges. This will include writing a CTE recursive query to account for groups and projects. Parameters: (entity_id, privilege_id)
  - a method to get all entities of a specific entity_type (that would include the check for entity visibility) with a domain-specific (and flexible) filter
  - a method to grant privileges to entities. 
    Parameters: (entity_id, privilege_id, group id)
  
-app-core
  - client-side methods that would call the corresponding server-side methods.  

-------

  Here's the CTE that Datagrok is using now:

```
  EXISTS(
    WITH RECURSIVE parents(id) AS (
    SELECT @p_check_user_group_id ::uuid
    UNION ALL
    SELECT r.parent_id
    FROM parents p INNER JOIN groups_relations r on r.child_id = p.id)
select 1 from project_relations_all rel inner join permissions pep on (rel.project_id = pep.entity_id or rel.entity_id = pep.entity_id)
   where rel.entity_id = :ENTITY_ID
   and ((not rel.is_link) or @p_check_view)
   and pep.permission_id = @p_check_permission_id 
   and pep.user_group_id in(select id from parents)
   )
```