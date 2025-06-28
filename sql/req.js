/*
get foreign key list with properties 
called at init to create edges 
*/

/*
export let reqFkWithColsOnTable = `
SELECT json_agg(fk_info) AS foreign_keys
FROM (
  SELECT
    con.conname AS constraint_name,
    src_table.relname AS source_table,
    tgt_table.relname AS target_table,

    (
      SELECT json_agg(json_build_object(
        'source_column', src_col.attname,
        'source_not_null', src_col.attnotnull,
        'target_column', tgt_col.attname
      ))
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
        AND uniq_con.conkey = con.confkey
    ) AS is_target_unique

  FROM pg_constraint con
  JOIN pg_class src_table ON src_table.oid = con.conrelid
  JOIN pg_namespace src_ns ON src_table.relnamespace = src_ns.oid
  JOIN pg_class tgt_table ON tgt_table.oid = con.confrelid
  JOIN pg_namespace tgt_ns ON tgt_table.relnamespace = tgt_ns.oid
  WHERE con.contype = 'f'
    AND src_table.relname = $1
) fk_info;
`;
*/
export let reqFkWithColsOnTable = `
SELECT json_agg(fk_info) AS foreign_keys
FROM (
  SELECT
    con.conname AS constraint_name,
    src_table.relname AS source_table,
    tgt_table.relname AS target_table,

    -- Mapping des colonnes
    (
      SELECT json_agg(json_build_object(
        'source_column', src_col.attname,
        'source_not_null', src_col.attnotnull,
        'target_column', tgt_col.attname
      ))
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
        AND uniq_con.conkey = con.confkey
    ) AS is_target_unique,
    con.confdeltype AS on_delete,
    con.confupdtype AS on_update

    -- Ajout des types d'action ON DELETE / ON UPDATE a faire en JS
  -- 'a' THEN 'NO ACTION'
  -- 'r' THEN 'RESTRICT'
  -- 'c' THEN 'CASCADE'
  -- 'n' THEN 'SET NULL'
  -- 'd' THEN 'SET DEFAULT'

  FROM pg_constraint con
  JOIN pg_class src_table ON src_table.oid = con.conrelid
  JOIN pg_namespace src_ns ON src_table.relnamespace = src_ns.oid
  JOIN pg_class tgt_table ON tgt_table.oid = con.confrelid
  JOIN pg_namespace tgt_ns ON tgt_table.relnamespace = tgt_ns.oid
  WHERE con.contype = 'f'
    AND src_table.relname = $1
) fk_info;
`;

/*
 list all columns of all tables in public schema Excluding views 
 called at ini to create nodes
*/
export let reqListOfTables = `
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON c.table_name = t.table_name
      AND c.table_schema = t.table_schema
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
  `;
/*
 list of tables of an already connected DB
 with this list,  nodes will be created by caller.

 kept for memory . Now code uses only reqListOfTables

let tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `;
*/

/*
    get details on a specific table 
  */

export let tableColumnsQuery = `
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position
    `;
/*
 get All foreign key in a connected DB 
 with this list edges will be created by caller
*/
/*
export let edgesQuery = `
    SELECT DISTINCT
      tc.constraint_name,
      tc.table_name AS source,
      ccu.table_name AS target
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
  `;
*/
export let edgesQuery = `
  SELECT DISTINCT
    con.conname AS constraint_name,
    src_table.relname AS source,
    tgt_table.relname AS target,
    con.confdeltype AS on_delete,
    con.confupdtype AS on_update
  FROM pg_constraint con
  JOIN pg_class src_table ON src_table.oid = con.conrelid
  JOIN pg_class tgt_table ON tgt_table.oid = con.confrelid
  JOIN pg_namespace src_ns ON src_ns.oid = src_table.relnamespace
  JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt_table.relnamespace
  WHERE con.contype = 'f'
    AND src_ns.nspname = 'public'
    AND tgt_ns.nspname = 'public'
`;




/*
 get foreign keys list 
*/

export let fkQuery = `
      SELECT kcu.column_name, tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON kcu.constraint_name = tc.constraint_name
      WHERE tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY';
    `;

export let triggerQuery = `
SELECT
    event_object_table AS table_name,
    trigger_name,
    string_agg(event_manipulation, ', ') AS triggered_on,
    action_timing AS timing,
    action_statement AS definition
FROM
    information_schema.triggers
GROUP BY
    event_object_table, trigger_name, action_timing, action_statement
ORDER BY
    trigger_name;

`;

export let indexQuery = `
SELECT
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND tablename = $1
ORDER BY indexname;

`;
