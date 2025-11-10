SELECT
        tc.constraint_name,
        tc.table_schema      AS source_schema,
        tc.table_name        AS source,
        kcu.column_name      AS source_column,

        /* nullable info for source column */
        (SELECT (c.is_nullable = 'NO') AS not_null
         FROM information_schema.columns c
         WHERE c.table_schema = tc.table_schema
           AND c.table_name   = tc.table_name
           AND c.column_name  = kcu.column_name
        ) AS source_not_null,

        ccu.table_schema     AS target_schema,
        ccu.table_name       AS target,
        ccu.column_name      AS target_column,

        rc.update_rule       AS on_update,
        rc.delete_rule       AS on_delete
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema    = kcu.table_schema
      JOIN information_schema.referential_constraints rc
           ON tc.constraint_name = rc.constraint_name
          AND tc.table_schema    = rc.constraint_schema
      JOIN information_schema.constraint_column_usage ccu
           ON ccu.constraint_name  = tc.constraint_name
          AND ccu.constraint_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema NOT IN ('information_schema')
        AND tc.table_schema NOT LIKE 'pg_%'
      ORDER BY source_schema, source, kcu.ordinal_position;