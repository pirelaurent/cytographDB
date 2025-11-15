SELECT json_agg(fk_info) AS foreign_keys
FROM (
  SELECT
    pgc.conname AS constraint_name,

    src_ns.nspname AS source_schema,
    src_tbl.relname AS source_table,

    tgt_ns.nspname AS target_schema,
    tgt_tbl.relname AS target_table,

    obj_description(pgc.oid, 'pg_constraint') AS comment,

    -- Column mappings in correct order
    (
      SELECT json_agg(
        json_build_object(
          'source_column',  src_col.attname,
          'source_not_null', (src_info.is_nullable = 'NO'),
          'target_column',  tgt_col.attname
        ) ORDER BY i
      )
      FROM generate_subscripts(pgc.conkey, 1) AS i
      JOIN pg_attribute src_col
         ON src_col.attrelid = pgc.conrelid
        AND src_col.attnum = pgc.conkey[i]
      JOIN pg_attribute tgt_col
         ON tgt_col.attrelid = pgc.confrelid
        AND tgt_col.attnum = pgc.confkey[i]
      JOIN information_schema.columns src_info
        ON src_info.table_schema = src_ns.nspname
       AND src_info.table_name   = src_tbl.relname
       AND src_info.column_name  = src_col.attname
    ) AS column_mappings,

    -- All source columns are NOT NULL?
    (
      SELECT bool_and(is_nullable = 'NO')
      FROM information_schema.columns c
      WHERE c.table_schema = src_ns.nspname
        AND c.table_name   = src_tbl.relname
        AND c.column_name = ANY (
              SELECT attname
              FROM pg_attribute
              JOIN unnest(pgc.conkey) WITH ORDINALITY AS k(attnum, ord)
                   ON k.attnum = pg_attribute.attnum
              WHERE attrelid = pgc.conrelid
            )
    ) AS all_source_not_null,

    -- Target columns are UNIQUE?
    (pgc.confupdtype = 'u' OR pgc.confupdtype = 'p') AS is_target_unique,

    pgc.confdeltype AS on_delete,
    pgc.confupdtype AS on_update

  FROM pg_constraint pgc
  JOIN pg_class src_tbl ON src_tbl.oid = pgc.conrelid
  JOIN pg_namespace src_ns ON src_ns.oid = src_tbl.relnamespace
  JOIN pg_class tgt_tbl ON tgt_tbl.oid = pgc.confrelid
  JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt_tbl.relnamespace
  WHERE pgc.contype = 'f'
) fk_info;
