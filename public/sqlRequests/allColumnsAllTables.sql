SELECT 
        c.table_schema,
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        pgd.description AS comment
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON c.table_name = t.table_name
       AND c.table_schema = t.table_schema
      LEFT JOIN pg_catalog.pg_statio_all_tables st
        ON st.relname = c.table_name
       AND st.schemaname = c.table_schema
      LEFT JOIN pg_catalog.pg_description pgd
        ON pgd.objoid = st.relid
       AND pgd.objsubid = c.ordinal_position
      WHERE c.table_schema NOT IN ('information_schema')
        AND c.table_schema NOT LIKE 'pg_%'
        AND t.table_type = 'BASE TABLE'
      ORDER BY c.table_schema, c.table_name, c.ordinal_position;
    