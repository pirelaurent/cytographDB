

-- call to enrich a single table with comments 


SELECT 
  obj_description(c.oid, 'pg_class') AS comment
FROM pg_class c
JOIN pg_namespace n 
  ON n.oid = c.relnamespace
WHERE n.nspname = $1
  AND c.relname = $2
  AND c.relkind IN ('r','p')  -- 'r' = table ordinaire, 'p' = partition
LIMIT 1;