SELECT 
        t.event_object_schema AS table_schema,
        t.event_object_table  AS table_name,
        t.trigger_name,
        t.action_timing       AS timing,
        string_agg(t.event_manipulation, ', ') AS triggered_on,
        t.action_statement    AS definition
      FROM information_schema.triggers t
      WHERE t.event_object_schema NOT IN ('information_schema')
        AND t.event_object_schema NOT LIKE 'pg_%'
      GROUP BY 
        t.event_object_schema,
        t.event_object_table,
        t.trigger_name,
        t.action_timing,
        t.action_statement
      ORDER BY 
        t.event_object_schema,
        t.event_object_table,
        t.trigger_name;