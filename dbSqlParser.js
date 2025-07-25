/*
    parse a PSQL code to find function and tables 
    allos to get function code 
*/

export async function getFunctionBody(client, functionName) {

  //console.time(`fetch-${functionName}`);
  const query = `
    SELECT pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = $1
    LIMIT 1
  `;
  const { rows } = await client.query(query, [functionName]);
  return rows[0]?.definition || "";
}

/*
 tables name found in source plSQL 
*/
export function extractImpactedTables(text) {
  const raw = [
    ...text.matchAll(/\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+(\w+)/gi),
  ].map((m) => m[2]);
  // avoid select 1 or non alphanum function
  return raw.filter(
    (fn) =>
      /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fn) && // vrai nom de fonction
      !["true", "false", "null","set"].includes(fn.toLowerCase())
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
  const raw = [...text.matchAll(/\b(PERFORM|SELECT|CALL)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g)].map(m => m[2]);

  return raw.filter(fn =>
    /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fn) &&  // identifiant SQL valid
    isNaN(Number(fn)) &&                   // exclude numbers
    !["true", "false", "null","concat","length"].includes(fn.toLowerCase())  // avoid 
  );
}

/*
 recursive call to analyse triggers and recurse limit
*/
export async function collectFunctionBodies(client, functionName, seen = new Set(), depth = 0) {
  if (seen.has(functionName) || depth > 10) return "";
  seen.add(functionName);

  const body = await getFunctionBody(client, functionName);
  let allCode = body + "\n";

  const subCalls = extractCalledFunctions(body);
  for (const subFn of subCalls) {
    allCode += await collectFunctionBodies(client, subFn, seen, depth + 1);
  }

  return allCode;
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


