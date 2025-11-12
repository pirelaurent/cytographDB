// sql-loader.js
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

/*
 usage : await loadSQL('my-query-name-without-sql-extension')
 This function loads the content of a .sql file located in the same directory as this module.
 It appends the .sql extension if not provided.
*/
export async function loadSQL(name) {
  let partName = name.endsWith('.sql') ? name : `${name}.sql`;

  //console.log(`Loading SQL file: ${partName}`);
  return readFile(join(__dirname, partName), 'utf8');
}
