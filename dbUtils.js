/*
 shared function for creating nodes for all tables and page details 
*/

import { loadSQL } from "./public/sqlRequests/sql-loader.js";

export async function OLDgetTableDetails(client, fullName) {

const [schema, table] = fullName.split(".");
  const oneTableCoumns = await loadSQL('oneTableColumns');
  const columnResult = await client.query(oneTableCoumns, [schema, table]);
  const columns = columnResult.rows.map((col) => {
    const type = col.character_maximum_length
      ? `${col.data_type}(${col.character_maximum_length})`
      : col.data_type;
    return {
      column: col.column_name,
      type,
      nullable: col.is_nullable, //Postgres returns YES or NO in uppercase
      comment: col.comment || null,
    };
  });

  let fkRes ;
  const foreignKeys = fkRes.rows[0]?.foreign_keys || [];

  const pkResult = await client.query(pkQuery, [schema,table]);
  const primaryKey = {
    name: pkResult.rows[0]?.constraint_name || null,
    columns: pkResult.rows.map((row) => row.column_name),
    comment: pkResult.rows[0]?.comment || null,
  };
  const oneTableIdx = await loadSQL('oneTableIdx');;
  const indexResult = await client.query(oneTableIdx, [schema, table]);
  const indexes = indexResult.rows.map(row => ({
    name: row.indexname,
    definition: row.indexdef,
    comment: row.comment,
    constraint_type: row.constraint_type
  }));

  const oneTableComments = await loadSQL('oneTableComments');
  const commentRes = await client.query(oneTableComments, [schema, table]);
  const comment = commentRes.rows[0]?.comment || null;

  return { columns, primaryKey, foreignKeys, indexes, comment };
}

