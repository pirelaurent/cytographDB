SELECT
  p.oid,
  p.proname AS name,
  n.nspname AS schema,
  pg_get_function_identity_arguments(p.oid) AS args,
  p.prorettype::regtype::text AS return_type,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = $1
  AND p.proname = $2
ORDER BY args
LIMIT 1;
