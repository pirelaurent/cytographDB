-- 
SELECT
  n.nspname            AS table_schema,
  c.relname            AS table_name,
  t.tgname             AS trigger_name,
  pg_get_triggerdef(t.oid, true) AS definition,
  CASE
    WHEN t.tgtype & 1 <> 0 THEN 'BEFORE'
    WHEN t.tgtype & 2 <> 0 THEN 'AFTER'
    WHEN t.tgtype & 4 <> 0 THEN 'INSTEAD OF'
  END AS timing,
  array_remove(array[
    CASE WHEN t.tgtype &  4 <> 0 THEN 'INSERT' END,
    CASE WHEN t.tgtype &  8 <> 0 THEN 'DELETE' END,
    CASE WHEN t.tgtype & 16 <> 0 THEN 'UPDATE' END,
    CASE WHEN t.tgtype & 32 <> 0 THEN 'TRUNCATE' END
  ], NULL) AS triggered_on
FROM pg_trigger t
JOIN pg_class c     ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal
  AND n.nspname = $1
  AND c.relname = $2
ORDER BY n.nspname, c.relname, t.tgname;


-- Example output:
--"public"	"intervention"	"trg_check_authorization"	"INSERT"	"BEFORE"	"EXECUTE FUNCTION check_authorization_before_intervention()"
--"public"	"intervention"	"trg_increment_points"	"INSERT"	"AFTER"	"EXECUTE FUNCTION increment_activity_points()"