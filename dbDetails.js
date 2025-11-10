// dbDetails.js
import { loadSQL } from "./public/sqlRequests/sql-loader.js";
/*
 used to load initially and in table.html
*/
export async function getTableDetails(client, fullName) {
  const [schema, table] = fullName.split(".");

  // commentaire de la table
  const commentResult = await client.query(
    `SELECT obj_description(to_regclass($1 || '.' || $2)::oid) AS comment`,
    [schema, table]
  );
  const tableComment =
    commentResult.rows[0]?.comment || null;

  // clé primaire
  const oneTablePK = await loadSQL("oneTablePK");
  const pkResult = await client.query(oneTablePK, [schema, table]);

  let primaryKey = null;

  if (pkResult.rows.length > 0) {
    const { constraint_name, comment } = pkResult.rows[0];
    const columns = pkResult.rows.map(r => r.column_name);

    primaryKey = {
      name: constraint_name,
      comment: comment || null,
      columns
    };
  }

  // index
  const oneTableIdx = await loadSQL("oneTableIdx");
  const indexResult = await client.query(oneTableIdx, [schema, table]);
  const indexes = indexResult.rows.map((row) => ({
    name: row.indexname,
    definition: row.indexdef,
    comment: row.comment,
    constraint_type: row.constraint_type,
  }));

 

  const oneTableColumns = await loadSQL('oneTableColumns');
  const columnsResult = await client.query(oneTableColumns, [schema, table]);
  const columns = columnsResult.rows
    .filter(
      (r) => r.table_schema === schema && r.table_name === table
    )
    .map((r) => ({
      column: r.column_name,
      type: r.data_type,
      nullable: r.is_nullable === "YES",
      comment: r.comment || null,
    }));


  // Foreignkeys  pour cette table
  const oneTableFK = await loadSQL("oneTableFK");
  const fkResult = await client.query(oneTableFK, [schema, table]);

  let foreignKeys = fkResult.rows[0]?.foreign_keys || '[]';

  return {
    columns,
    foreignKeys,
    primaryKey,
    comment: tableComment,
    indexes,
  };
}
