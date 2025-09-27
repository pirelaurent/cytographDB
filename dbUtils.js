/*
 shared function for creating nodes for all tables and page details 
*/
import  { tableColumnsQuery,reqFkWithColsOnTable,indexQuery,tableCommentQuery,pkQuery } from "./dbreq.js"


export async function getTableDetails(client, tableName) {

  const columnResult = await client.query(tableColumnsQuery, [tableName]);
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

  const fkRes = await client.query(reqFkWithColsOnTable, [tableName]);
  const foreignKeys = fkRes.rows[0]?.foreign_keys || [];

  const pkResult = await client.query(pkQuery, [tableName]);
  const primaryKey = {
    name: pkResult.rows[0]?.constraint_name || null,
    columns: pkResult.rows.map((row) => row.column_name),
    comment: pkResult.rows[0]?.comment || null,
  };

  const indexResult = await client.query(indexQuery, [tableName]);
  const indexes = indexResult.rows.map(row => ({
    name: row.indexname,
    definition: row.indexdef,
    comment: row.comment,
    constraint_type: row.constraint_type
  }));

  const commentRes = await client.query(tableCommentQuery, [tableName]);
  const comment = commentRes.rows[0]?.comment || null;

  return { columns, primaryKey, foreignKeys, indexes, comment };
}

