
export let reqFkWithColsOnTable = `
SELECT json_agg(fk_info) AS foreign_keys
FROM (
  SELECT
    con.conname AS constraint_name,
    src_table.relname AS source_table,
    tgt_table.relname AS target_table,
    -- 🔍 New : comment on FK
    obj_description(con.oid, 'pg_constraint') AS comment,

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
    get details on a specific table 
*/

export let tableColumnsQuery = `
  SELECT 
  cols.column_name,
  cols.data_type,
  cols.character_maximum_length,
  cols.is_nullable,
  col_description(c.oid, cols.ordinal_position) AS comment
FROM information_schema.columns cols
JOIN pg_class c ON c.relname = $1 AND c.relkind = 'r'
WHERE cols.table_name = $1
  AND cols.table_schema = 'public'  -- adapte si besoin
  AND cols.table_name = c.relname
ORDER BY cols.ordinal_position;

    `;
/*
 get All foreign key in a connected DB 
 with this list edges will be created by caller
*/


export let edgesQuery = `
SELECT
  con.conname AS constraint_name,
  src_table.relname AS source,
  tgt_table.relname AS target,
  con.confdeltype AS on_delete,
  con.confupdtype AS on_update,
  des.description AS comment,
  src_col.attname AS source_column,
  tgt_col.attname AS target_column,
  src_col.attnotnull AS source_not_null
FROM pg_constraint con
JOIN pg_class src_table ON src_table.oid = con.conrelid
JOIN pg_class tgt_table ON tgt_table.oid = con.confrelid
JOIN pg_namespace src_ns ON src_ns.oid = src_table.relnamespace
JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt_table.relnamespace
JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS src_cols(attnum, ord) ON true
JOIN LATERAL unnest(con.confkey) WITH ORDINALITY AS tgt_cols(attnum, ord) ON tgt_cols.ord = src_cols.ord
JOIN pg_attribute src_col ON src_col.attrelid = src_table.oid AND src_col.attnum = src_cols.attnum
JOIN pg_attribute tgt_col ON tgt_col.attrelid = tgt_table.oid AND tgt_col.attnum = tgt_cols.attnum
LEFT JOIN pg_description des ON des.objoid = con.oid AND des.classoid = 'pg_constraint'::regclass
WHERE con.contype = 'f'
  AND src_ns.nspname = 'public'
  AND tgt_ns.nspname = 'public';
`
;


/*
 get primary keys list 
*/

export let pkQuery = `
      SELECT 
  kcu.column_name, 
  tc.constraint_name,
  obj_description(pc.oid, 'pg_constraint') AS comment
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_name = tc.constraint_name
  AND kcu.table_name = tc.table_name
JOIN pg_constraint pc
  ON pc.conname = tc.constraint_name
  AND pc.contype = 'p'
  AND pc.conrelid = (quote_ident($1))::regclass
WHERE tc.table_name = $1
  AND tc.constraint_type = 'PRIMARY KEY';

    `;

/*
 get triggers info globally
*/

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

export let triggerQueryOneTable = `
SELECT
    event_object_table AS table_name,
    trigger_name,
    string_agg(event_manipulation, ', ') AS triggered_on,
    action_timing AS timing,
    action_statement AS definition
FROM
    information_schema.triggers
WHERE
    event_object_table = $1
GROUP BY
    event_object_table, trigger_name, action_timing, action_statement
ORDER BY
    trigger_name;
`;



/*
 get functionBody
*/

export let functionBodyQuery =`
SELECT
      p.oid,
      p.proname AS name,
      n.nspname AS schema,
      p.prokind,                              -- 'f' function, 'p' procedure, 'a' aggregate, 'w' window
      pg_get_function_identity_arguments(p.oid) AS args,
      p.prorettype::regtype::text AS return_type
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = $1
    ORDER BY n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)
    LIMIT 1
`


export let indexQuery =`
-- indexQuery
SELECT DISTINCT ON (i.oid)
  i.oid                             AS index_oid,
  i.relname                         AS indexname,     -- << attendu par ton JS
  pg_get_indexdef(i.oid)            AS indexdef,      -- << attendu par ton JS
  obj_description(i.oid,'pg_class') AS comment,       -- << attendu par ton JS
  CASE c.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'x' THEN 'EXCLUDE'
    ELSE NULL
  END                               AS constraint_type -- << attendu par ton JS
, ix.indisprimary                   AS is_primary
, ix.indisunique                    AS is_unique
FROM pg_class t
JOIN pg_namespace nt ON nt.oid = t.relnamespace
JOIN pg_index ix      ON ix.indrelid = t.oid
JOIN pg_class i       ON i.oid = ix.indexrelid
LEFT JOIN pg_constraint c ON c.conindid = i.oid
WHERE nt.nspname = 'public'
  AND t.relname  = $1
ORDER BY i.oid;
`


/*
 get comments on tables 
*/

export let reqTableComments = `
  SELECT
    c.relname AS table_name,
    obj_description(c.oid) AS comment
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
    AND n.nspname = 'public'
`;
/*
 calls to enrich a single table with comments 
*/

export const tableCommentQuery = `
  SELECT obj_description(('public.' || $1)::regclass, 'pg_class') AS comment

`;
//
export const columnCommentsQuery = `
  SELECT
    a.attname AS column_name,
    col_description(a.attrelid, a.attnum) AS comment
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = $1
    AND n.nspname = 'public'
    AND a.attnum > 0
    AND NOT a.attisdropped
`;

/*
 check if identifier are less than 63 for Postgresql
 Not connected to app. Copy and paste directly in your tools




*/


export let reqSanity63 = `
-- Check all user-defined identifiers longer than 63 chars
SELECT 'table' AS object_type, schemaname AS schema, tablename AS name
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND length(tablename) > 63

UNION ALL

SELECT 'column', table_schema, table_name || '.' || column_name
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  AND length(column_name) > 63

UNION ALL

SELECT 'index', schemaname, indexname
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND length(indexname) > 63

UNION ALL

SELECT 'constraint', table_schema, constraint_name
FROM information_schema.table_constraints
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  AND length(constraint_name) > 22

UNION ALL

SELECT 'sequence', sequence_schema, sequence_name
FROM information_schema.sequences
WHERE sequence_schema NOT IN ('pg_catalog', 'information_schema')
  AND length(sequence_name) > 63

UNION ALL

SELECT 'view', table_schema, table_name
FROM information_schema.views
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  AND length(table_name) > 63

ORDER BY object_type, schema, name;

`


export let reqCheckColumn = /* `

SELECT t.tablename AS table
FROM pg_tables AS t
WHERE t.schemaname = 'public'              -- ← ex: 'public'
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = t.schemaname
      AND c.table_name   = t.tablename
      AND c.column_name  = $1        -- ← ex: 'my_column'
  )
ORDER BY 1;
` */

`
  SELECT t.tablename
  FROM pg_tables t
  WHERE t.schemaname =  'public'
    AND (EXISTS (
          SELECT 1
          FROM information_schema.columns c
          WHERE c.table_schema = t.schemaname
            AND c.table_name   = t.tablename
            AND c.column_name  = $1
        )) = $2
  ORDER BY 1;
`;


/*
  recursice belongs :
  child tables that cannot exists without parent 
  sample with belongs to Employee

  const res = await client.query(
  'SELECT * FROM clients WHERE id = $1',
  [42]
);
*/

export let belongsToParent = `
WITH RECURSIVE owned_tree AS (
  -- Base: direct children of the root table
  SELECT
    p_rel.relname AS parent_table,
    c_rel.relname AS child_table,
    f.conname     AS fk_name,
    1             AS level,
    p_rel.relname || ' → ' || c_rel.relname AS path
  FROM pg_constraint f
  JOIN pg_class c_rel ON c_rel.oid = f.conrelid
  JOIN pg_class p_rel ON p_rel.oid = f.confrelid
  JOIN pg_attribute a ON a.attrelid = c_rel.oid AND a.attnum = ANY(f.conkey)
  WHERE f.contype = 'f'
    AND p_rel.relname =  $1   -- <<== replace 'employee' with your root table
    AND a.attnotnull                 -- only mandatory relationships
  GROUP BY p_rel.relname, c_rel.relname, f.conname

  UNION ALL

  -- Recursive step: find children of the current child
  SELECT
    p_rel.relname AS parent_table,
    c_rel.relname AS child_table,
    f.conname     AS fk_name,
    ot.level + 1  AS level,
    ot.path || ' → ' || c_rel.relname AS path
  FROM owned_tree ot
  JOIN pg_class p_parent ON p_parent.relname = ot.child_table
  JOIN pg_constraint f ON f.confrelid = p_parent.oid AND f.contype = 'f'
  JOIN pg_class c_rel ON c_rel.oid = f.conrelid
  JOIN pg_class p_rel ON p_rel.oid = f.confrelid
  JOIN pg_attribute a ON a.attrelid = c_rel.oid AND a.attnum = ANY(f.conkey)
  WHERE a.attnotnull
)
SELECT
  repeat('  ', level - 1) || child_table AS "belongs_to_",
  fk_name,
  parent_table
FROM owned_tree
ORDER BY path;



`

