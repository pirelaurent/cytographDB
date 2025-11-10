-- listOfTables.sql

    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON c.table_name = t.table_name
      AND c.table_schema = t.table_schema
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
