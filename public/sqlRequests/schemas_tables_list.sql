/* all rlkind : r:table, v:views, m: materialized, f: foreign 
SELECT schema_name, table_name
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog','information_schema')
ORDER BY table_name, schema_name;
*/

-- only real tables 
SELECT n.nspname AS schema_name,
       c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'   -- 'r' = real table
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schema_name, table_name;
