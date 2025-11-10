


/*
 get triggers info globally
*/

export const triggerQuery = `
SELECT
  t.event_object_schema AS table_schema,
  t.event_object_table  AS table_name,
  t.trigger_name,
  string_agg(t.event_manipulation, ', ') AS triggered_on,
  t.action_timing AS timing,
  t.action_statement AS definition
FROM information_schema.triggers t
WHERE t.event_object_schema NOT IN ('information_schema')
  AND t.event_object_schema NOT LIKE 'pg_%'
GROUP BY
  t.event_object_schema,
  t.event_object_table,
  t.trigger_name,
  t.action_timing,
  t.action_statement
ORDER BY
  t.event_object_schema,
  t.event_object_table,
  t.trigger_name;
`;


export const triggerQueryOneTable = `
SELECT
  t.event_object_schema AS table_schema,
  t.event_object_table  AS table_name,
  t.trigger_name,
  string_agg(t.event_manipulation, ', ') AS triggered_on,
  t.action_timing AS timing,
  t.action_statement AS definition
FROM information_schema.triggers t
WHERE t.event_object_schema = $1
  AND t.event_object_table  = $2
GROUP BY
  t.event_object_schema,
  t.event_object_table,
  t.trigger_name,
  t.action_timing,
  t.action_statement
ORDER BY
  t.trigger_name;
`;



/*
 check if identifier are less than 63 for Postgresql
 Not connected to app. Copy and paste directly in your tools
*/

export let reqSanity63 = `
-- Check all user-defined identifiers longer than 63 chars
SELECT 'table' AS object_type, schemaname AS schema, tablename AS name
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND length(tablename) > 63

UNION ALL

SELECT 'column', table_schema, table_name || '.' || column_name
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  AND length(column_name) > 63

UNION ALL

SELECT 'index', schemaname, indexname
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND length(indexname) > 63

UNION ALL

SELECT 'constraint', table_schema, constraint_name
FROM information_schema.table_constraints
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  AND length(constraint_name) > 22

UNION ALL

SELECT 'sequence', sequence_schema, sequence_name
FROM information_schema.sequences
WHERE sequence_schema NOT IN ('pg_catalog', 'information_schema')
  AND length(sequence_name) > 63

UNION ALL

SELECT 'view', table_schema, table_name
FROM information_schema.views
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  AND length(table_name) > 63

ORDER BY object_type, schema, name;

`


/*
  recursive belongs :
  child tables that cannot exists without parent 
  sample with belongs to Employee

  const res = await client.query(
  'SELECT * FROM clients WHERE id = $1',
  [42]
);
*/

export let belongsToParent = `
WITH RECURSIVE owned_tree AS (
  -- Base: direct children of the root table
  SELECT
    p_rel.relname AS parent_table,
    c_rel.relname AS child_table,
    f.conname     AS fk_name,
    1             AS level,
    p_rel.relname || ' → ' || c_rel.relname AS path
  FROM pg_constraint f
  JOIN pg_class c_rel ON c_rel.oid = f.conrelid
  JOIN pg_class p_rel ON p_rel.oid = f.confrelid
  JOIN pg_attribute a ON a.attrelid = c_rel.oid AND a.attnum = ANY(f.conkey)
  WHERE f.contype = 'f'
    AND p_rel.relname =  $1   -- <<== replace 'employee' with your root table
    AND a.attnotnull                 -- only mandatory relationships
  GROUP BY p_rel.relname, c_rel.relname, f.conname

  UNION ALL

  -- Recursive step: find children of the current child
  SELECT
    p_rel.relname AS parent_table,
    c_rel.relname AS child_table,
    f.conname     AS fk_name,
    ot.level + 1  AS level,
    ot.path || ' → ' || c_rel.relname AS path
  FROM owned_tree ot
  JOIN pg_class p_parent ON p_parent.relname = ot.child_table
  JOIN pg_constraint f ON f.confrelid = p_parent.oid AND f.contype = 'f'
  JOIN pg_class c_rel ON c_rel.oid = f.conrelid
  JOIN pg_class p_rel ON p_rel.oid = f.confrelid
  JOIN pg_attribute a ON a.attrelid = c_rel.oid AND a.attnum = ANY(f.conkey)
  WHERE a.attnotnull
)
SELECT
  repeat('  ', level - 1) || child_table AS "belongs_to_",
  fk_name,
  parent_table
FROM owned_tree
ORDER BY path;
`
/*
 list of all schela except internals pg & info
*/
export let reqSchemaResult =`
  SELECT schema_name 
  FROM information_schema.schemata 
  WHERE schema_name NOT LIKE 'pg_%'
    AND schema_name != 'information_schema'
`
