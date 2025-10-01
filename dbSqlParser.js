/*
    parse a PSQL code to find function and tables 
    allos to get function code 
*/

import { functionBodyQuery } from "./dbreq.js";

export async function getFunctionBody(client, routineName) {
  
  const { rows } = await client.query(functionBodyQuery, [routineName]);
  const r = rows[0];
  if (!r) {
    return {
      name: routineName,
      kind: "not_found",
      body: "",
      info: "No routine found",
    };
  }

  // Aggregate or window → no source body
  if (r.prokind === "a" || r.prokind === "w") {
    const kind = r.prokind === "a" ? "aggregate" : "window";
    let fullResult = {
      name: r.name,
      schema: r.schema,
      signature: `${r.name}(${r.args})`,
      kind,
      return_type: r.return_type,
      body: "",
      info: `Skipping ${kind}`,
    };
    return fullResult; //empty text to skip analyse
  }

  // Function or procedure → get definition
  const def = await client.query(`SELECT pg_get_functiondef($1::oid) AS body`, [
    r.oid,
  ]);

  let fullResult = {
    name: r.name,
    schema: r.schema,
    signature: `${r.name}(${r.args})`,
    kind: r.prokind === "f" ? "function" : "procedure",
    return_type: r.return_type,
    body: def.rows[0]?.body || "",
    info: "",
  };
  // return only the code text
  return fullResult;
}

/*
actions on  tables name found in source plSQL 
*/
export function extractImpactedTables(text) {
  const raw = [
    ...text.matchAll(/\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+(\w+)/gi),
  ].map((m) => m[2]);
  
  // avoid select 1 or non alphanum function
  return raw.filter(
    (fn) =>
      /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fn) && // vrai nom de fonction
      !["true", "false", "null", "set"].includes(fn.toLowerCase())
  );
}

/*
 retrieve function call. Avoid select 1 and non alphanum names
 ([a-zA-Z_][a-zA-Z0-9_]*) → identifiant SQL
 \s*\( → doit être suivi d'une parenthèse (fonction appelée)
 ça exclut SELECT DISTINCT, SELECT *, etc.
 PERFORM my_func(...) sera bien détecté
*/
export function extractCalledFunctions(text) {
  const raw = [
    ...text.matchAll(
      /\b(PERFORM|SELECT|CALL)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g
    ),
  ].map((m) => m[2]);

  return raw.filter(
    (fn) =>
      /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fn) && // identifiant SQL valid
      isNaN(Number(fn)) && // exclude numbers
      !["true", "false", "null", "concat", "length","min","max","array","coalesce"].includes(fn.toLowerCase()) // avoid PLA
  );
}

/*
 recursive call to analyse triggers and recurse limit
*/
export async function collectFunctionBodies(
  client,
  table,
  functionName,
  seen = new Set(),
  depth = 0,
) {
  if (seen.has(functionName) || depth > 15) return "";
  seen.add(functionName);
  const fullResult = await getFunctionBody(client, functionName);
  // missing function definition 
 if (fullResult.kind === 'not_found')
 {
  console.log(`*** WARNING from ${table} : found  ${fullResult.name} as  '${fullResult.kind}'`); 
  return;
 } 

  if (fullResult.kind === "function" || fullResult.kind === "procedure") {
    let body = fullResult.body;
    let allCode = body + "\n";
    const subCalls = extractCalledFunctions(body);
    for (const subFn of subCalls) {
      // recurse with collected calls
      allCode += await collectFunctionBodies(client, table, subFn, seen, depth + 1);
    }
    return allCode;
  } else {
    // on server console 
    console.log(`*** WARNING from ${table} : found ${fullResult.name} as  '${fullResult.kind}'`); 
  }
  // test with bidt_stock_mvt
}

/*
 remove comment in sql to find tables 
*/
export function stripSqlComments(text) {
  // Supprime les commentaires multi-lignes
  let cleaned = text.replace(/\/\*[\s\S]*?\*\//g, "");
  // Supprime les commentaires mono-ligne
  cleaned = cleaned.replace(/--.*$/gm, "");
  // Supprime les chaînes de texte entre apostrophes
  cleaned = cleaned.replace(/'(?:''|[^'])*'/g, "''");
  return cleaned;
}
