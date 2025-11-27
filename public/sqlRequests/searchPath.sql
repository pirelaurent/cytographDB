-- get the list of schemas in the search_path ***of the session***
-- can see it also by SSHOW search_path;
SELECT
  array_to_json(
    ARRAY(
      SELECT s
      FROM unnest(current_schemas(false)) AS s
      WHERE s NOT IN ('pg_catalog', 'information_schema')
    )
  ) AS sp;

