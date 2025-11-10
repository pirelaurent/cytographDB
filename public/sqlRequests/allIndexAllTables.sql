SELECT DISTINCT ON (i.oid)
  i.oid                             AS index_oid,
  i.relname                         AS index_name,       -- nom de l'index
  pg_get_indexdef(i.oid)            AS index_def,        -- définition SQL
  obj_description(i.oid,'pg_class') AS comment,          -- commentaire de l'index
  CASE c.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'x' THEN 'EXCLUDE'
    ELSE NULL
  END                               AS constraint_type,  -- type de contrainte
  ix.indisprimary                   AS is_primary,
  ix.indisunique                    AS is_unique,
  nt.nspname                        AS table_schema,
  t.relname                         AS table_name
FROM pg_class t
JOIN pg_namespace nt ON nt.oid = t.relnamespace
JOIN pg_index ix      ON ix.indrelid = t.oid
JOIN pg_class i       ON i.oid = ix.indexrelid
LEFT JOIN pg_constraint c 
  ON c.conindid = i.oid 
  AND c.conrelid = t.oid
WHERE t.relkind IN ('r', 'p')  -- tables normales et partitionnées
  AND nt.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY i.oid;
