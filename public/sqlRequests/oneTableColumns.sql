SELECT 
  cols.table_schema,
  cols.table_name,
  cols.column_name,
  cols.data_type,
  cols.character_maximum_length,
  cols.is_nullable,
  pgd.description AS comment
FROM information_schema.columns cols
LEFT JOIN pg_class c
  ON c.relname = cols.table_name
LEFT JOIN pg_namespace n
  ON n.oid = c.relnamespace
  AND n.nspname = cols.table_schema
LEFT JOIN pg_description pgd
  ON pgd.objoid = c.oid
 AND pgd.objsubid = cols.ordinal_position
WHERE cols.table_schema = $1
  AND cols.table_name   = $2
ORDER BY cols.ordinal_position;
