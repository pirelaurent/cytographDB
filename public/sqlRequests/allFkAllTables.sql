SELECT
  con.conname                      AS constraint_name,
  src_ns.nspname                   AS source_schema,
  src_table.relname                AS source_table,
  tgt_ns.nspname                   AS target_schema,
  tgt_table.relname                AS target_table,

  -- 🔍 Commentaire sur la contrainte FK
  obj_description(con.oid, 'pg_constraint') AS comment,

  -- Mapping des colonnes
  (
    SELECT json_agg(json_build_object(
      'source_column', src_col.attname,
      'source_not_null', src_col.attnotnull,
      'target_column', tgt_col.attname
    ) ORDER BY src_key.ordinality)
    FROM unnest(con.conkey) WITH ORDINALITY AS src_key(attnum, ordinality)
    JOIN unnest(con.confkey) WITH ORDINALITY AS tgt_key(attnum, ordinality)
      ON src_key.ordinality = tgt_key.ordinality
    JOIN pg_attribute src_col
      ON src_col.attrelid = con.conrelid AND src_col.attnum = src_key.attnum
    JOIN pg_attribute tgt_col
      ON tgt_col.attrelid = con.confrelid AND tgt_col.attnum = tgt_key.attnum
  ) AS column_mappings,

  -- Toutes les colonnes source sont-elles NOT NULL ?
  (
    SELECT bool_and(src_col.attnotnull)
    FROM unnest(con.conkey) AS conkey(attnum)
    JOIN pg_attribute src_col
      ON src_col.attrelid = con.conrelid AND src_col.attnum = conkey.attnum
  ) AS all_source_not_null,

  -- Les colonnes cibles correspondent-elles à une UNIQUE/PK ?
  EXISTS (
    SELECT 1
    FROM pg_constraint uniq_con
    WHERE uniq_con.conrelid = con.confrelid
      AND uniq_con.contype IN ('u', 'p')
      AND uniq_con.conkey   = con.confkey
  ) AS is_target_unique,

  -- Types d’action ON DELETE / ON UPDATE
  con.confdeltype AS on_delete,
  con.confupdtype AS on_update
FROM pg_constraint con
JOIN pg_class src_table ON src_table.oid = con.conrelid
JOIN pg_namespace src_ns ON src_ns.oid = src_table.relnamespace
JOIN pg_class tgt_table ON tgt_table.oid = con.confrelid
JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt_table.relnamespace
WHERE con.contype = 'f'
  AND src_ns.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY src_ns.nspname, src_table.relname, con.conname;
