SELECT json_agg(fk_info) AS foreign_keys
FROM (
  SELECT
    tc.constraint_name,
    tc.table_schema AS source_schema,
    tc.table_name   AS source_table,

    ccu.table_schema AS target_schema,
    ccu.table_name   AS target_table,

    -- 🔍 Commentaire FK (si présent)
    obj_description(pgcon.oid, 'pg_constraint') AS comment,

    -- 🧩 Column mappings (comme la 1ère requête)
    (
      SELECT json_agg(
        json_build_object(
          'source_column', kcu.column_name,
          'source_not_null', (col.is_nullable = 'NO'),
          'target_column', ccu2.column_name
        ) ORDER BY kcu.ordinal_position
      )
      FROM information_schema.key_column_usage kcu
      JOIN information_schema.constraint_column_usage ccu2
           ON ccu2.constraint_name = kcu.constraint_name
          AND ccu2.constraint_schema = kcu.constraint_schema
      JOIN information_schema.columns col
           ON col.table_schema = kcu.table_schema
          AND col.table_name   = kcu.table_name
          AND col.column_name  = kcu.column_name
      WHERE kcu.constraint_name = tc.constraint_name
        AND kcu.constraint_schema = tc.table_schema
    ) AS column_mappings,

    -- ✔ Toutes les colonnes source NOT NULL ?
    (
      SELECT bool_and(col.is_nullable = 'NO')
      FROM information_schema.key_column_usage kcu
      JOIN information_schema.columns col
           ON col.table_schema = kcu.table_schema
          AND col.table_name   = kcu.table_name
          AND col.column_name  = kcu.column_name
      WHERE kcu.constraint_name = tc.constraint_name
        AND kcu.constraint_schema = tc.table_schema
    ) AS all_source_not_null,

    -- ✔ Les colonnes cibles sont-elles PK/UNIQUE ?
    EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc2
      JOIN information_schema.key_column_usage kcu2
           ON tc2.constraint_name = kcu2.constraint_name
          AND tc2.constraint_schema = kcu2.constraint_schema
      WHERE tc2.table_schema = ccu.table_schema
        AND tc2.table_name   = ccu.table_name
        AND tc2.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
        AND tc2.constraint_name = (
          SELECT constraint_name
          FROM information_schema.constraint_column_usage
          WHERE table_schema = ccu.table_schema
            AND table_name   = ccu.table_name
            AND column_name  = ccu.column_name
            LIMIT 1
        )
    ) AS is_target_unique,

    rc.delete_rule AS on_delete,
    rc.update_rule AS on_update

  FROM information_schema.table_constraints tc
  JOIN information_schema.referential_constraints rc
       ON tc.constraint_name = rc.constraint_name
      AND tc.constraint_schema = rc.constraint_schema
  JOIN information_schema.constraint_column_usage ccu
       ON ccu.constraint_name = tc.constraint_name
      AND ccu.constraint_schema = tc.constraint_schema
  JOIN pg_constraint pgcon
       ON pgcon.conname = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema NOT IN ('information_schema')
    AND tc.table_schema NOT LIKE 'pg_%'
) fk_info;
