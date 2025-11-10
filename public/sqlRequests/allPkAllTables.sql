WITH pk AS (
  SELECT
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    obj_description(pc.oid, 'pg_constraint') AS comment,
    kcu.ordinal_position,
    kcu.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON kcu.constraint_name = tc.constraint_name
   AND kcu.table_schema   = tc.table_schema
   AND kcu.table_name     = tc.table_name
  JOIN pg_namespace pn
    ON pn.nspname = tc.table_schema
  JOIN pg_class pc_table
    ON pc_table.relname = tc.table_name
   AND pc_table.relnamespace = pn.oid
  JOIN pg_constraint pc
    ON pc.conrelid = pc_table.oid
   AND pc.contype  = 'p'
   AND pc.conname  = tc.constraint_name
  WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
)
SELECT
  table_schema,
  table_name,
  constraint_name,
  comment,
  array_agg(column_name ORDER BY ordinal_position) AS columns
FROM pk
GROUP BY table_schema, table_name, constraint_name, comment
ORDER BY table_schema, table_name;
