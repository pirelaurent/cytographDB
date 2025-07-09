// Copyright (C) 2025 Laurent P.
// This file is part of CytographDB (https://github.com/pirelaurent/cytographdb)
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.




"use strict";
import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import { readFile } from 'fs/promises';
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import pkg from "pg";
const { Pool } = pkg;

import { getPoolFor, getCurrentPool, getCurrentDBName } from "./db.js";
import {
  collectFunctionBodies,
  extractImpactedTables,
  extractCalledFunctions,
  stripSqlComments,

} from "./sqlParser.js";

import {
  reqListOfTables,
  tableColumnsQuery,
  reqFkWithColsOnTable,
  edgesQuery,
  pkQuery,
  triggerQuery,
  indexQuery,
  reqTableComments,
  tableCommentQuery,
} from "./sql/req.js";



console.log('init env');
// Chargement des variables d'environnement
dotenv.config();

const app = express();

// Middleware to parse JSON bodies
// Increase payload size limit to 50MB
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const PORT = 3000;
// directory to store json saved graph
const GRAPH_DIR = path.join(__dirname, "saved-graphs");
// Ensure the directory exists
if (!fs.existsSync(GRAPH_DIR)) {
  fs.mkdirSync(GRAPH_DIR);
}

const pkgPath = path.join(__dirname, 'package.json');

//console.log(pkgPath)
const pkgRaw = await readFile(pkgPath, 'utf-8');
const appPkg = JSON.parse(pkgRaw);



app.use(express.static("public"));

/*
 create a network with tables as nodes and FK as edges
*/
app.post("/load-from-db", async (req, res) => {
  const { dbName } = req.body;

  let client;
  try {
    const pool = getPoolFor(dbName);
    client = await pool.connect();

    /*
    const tablesResult = await client.query(tablesQuery);
    const tableNames = tablesResult.rows.map((r) => r.table_name);
  */


    // Get column info per table (simplified version)
    const columnMap = {}; // tableName -> array of columns
    const columnResult = await client.query(reqListOfTables);

    // separate names in a collection
    const tableNames = [...new Set(columnResult.rows.map((r) => r.table_name))];

    // get comments about tables 
    const commentResult = await client.query(reqTableComments);

    // Crée une map table => commentaire
    const tableComments = new Map(
      commentResult.rows.map(({ table_name, comment }) => [table_name, comment])
    );


    // dispatch columns in a new dict array
    columnResult.rows.forEach(({ table_name, column_name }) => {
      if (!columnMap[table_name]) columnMap[table_name] = [];
      columnMap[table_name].push(column_name);
    });

    // Get FK columns per table in another array

    const fkResult = await client.query(edgesQuery);
    const fkColumnMap = {}; // tableName -> Set of FK column names

    fkResult.rows.forEach(({ source, source_column }) => {
      if (!fkColumnMap[source]) fkColumnMap[source] = new Set();
      fkColumnMap[source].add(source_column);
    });

    // get triggers for all tables

    const triggerRows = await client.query(triggerQuery); // ou client.query...

    //organize per table

    const triggersByTable = new Map();

    for (const row of triggerRows.rows) {
      const trigger = {
        name: row.trigger_name,
        on: row.triggered_on,
        timing: row.timing,
        definition: row.definition,
      };

      if (!triggersByTable.has(row.table_name)) {
        triggersByTable.set(row.table_name, []);
      }
      triggersByTable.get(row.table_name).push(trigger);
    }

    /*
     Build nodes 
    */
    const nodes = tableNames.map((name) => {
      const allCols = columnMap[name] || [];
      const fkCols = fkColumnMap[name] ? [...fkColumnMap[name]] : [];

      const trigs = triggersByTable.get(name) || [];
      const hasTrig = trigs.length === 0 ? "" : "*".repeat(trigs.length);
      const comment = tableComments.get(name) || null;

      const data = {
        id: name,
        label: name + "\n" + hasTrig,
        columns: allCols,
        foreignKeys: fkCols,
        comment: comment,
      };

      if (trigs.length > 0) {

        data.triggers = trigs;
        // done in receipt data.classes = 'hasTriggers';
      }

      return { data };
    });

    /* 
     build edges
     */
    const filteredEdges = fkResult.rows
      .filter(
        (e) => tableNames.includes(e.source) && tableNames.includes(e.target)
      )
      .map((e) => ({
        data: {
          source: e.source,
          target: e.target,
          label: e.constraint_name,
          onDelete: e.on_delete, // raw code: 'a', 'c', etc.
          onUpdate: e.on_update  // raw code
        },
        // a no action c: cascade. 
        classes: e.on_delete === 'c' ? 'delete_cascade' : ''
      }));


    res.json({ nodes, edges: filteredEdges });
  } catch (error) {
    console.error("error loading graph :", error);
    // Renvoie un statut HTTP 500 (erreur serveur) avec un message lisible
    res.status(500).json({ error: "Error accessing database" });
  } finally {
    if (client) client.release(); // ✅ ici c’est nécessaire
  }
});

/*

Table details  

*/

app.get("/table/:name", async (req, res) => {
  const pool = getCurrentPool();
  if (!pool) return res.status(400).send("No DB in place.");

  let client;
  try {
    client = await pool.connect();
    const table = req.params.name;

    // verifyn correct name to avoid injection
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      return res.status(400).json({ error: "Invalid table name format." });
    }

    // check if table exist to avoid error

    try {
      await client.query(`SELECT 1 FROM "${table}" LIMIT 1`);
    } catch {
      return res
        .status(404)
        .json({ error: `Table '${table}' does not exist.` });
    }

    // 🔍 get columns with properties
    const columnResult = await client.query(tableColumnsQuery, [table]);

    const columns = columnResult.rows.map((col) => {
      const type = col.character_maximum_length
        ? `${col.data_type}(${col.character_maximum_length})`
        : col.data_type;

      return {
        column: col.column_name,
        type,
        nullable: col.is_nullable === "YES" ? "Yes" : "No",
        comment: col.comment || null, // Nouveau champ
      };
    });


    /*
     foreign keys
    */
    const result = await client.query(reqFkWithColsOnTable, [table]);
    const foreignKeys = result.rows[0].foreign_keys;

    // 🔍 Clé primaire
    const pkResult = await client.query(pkQuery, [table]);

    const primaryKey = {
      name: pkResult.rows[0]?.constraint_name || null,
      columns: pkResult.rows.map((row) => row.column_name),
      comment: pkResult.rows[0]?.comment || null,  // ✅ ici
    };


    // index
    const indexResult = await client.query(indexQuery, [table]);

    const indexes = indexResult.rows.map(row => ({
      name: row.indexname,
      definition: row.indexdef,
      comment: row.comment
    }));

    // commentaires
    const resComment = await client.query(tableCommentQuery, [table]);
    const comment = resComment.rows[0]?.comment || null;

    res.json({ columns, primaryKey, foreignKeys, indexes, comment });
  } catch (error) {
    console.error("Erreur dans /table/:name :", error);
    res.status(500).json({ error: "Error accessing database." });
  } finally {
    if (client) client.release();
  }
});

/*
 comment of one table 
*/
app.get("/table_comment/:name", async (req, res) => {
  const pool = getCurrentPool();
  if (!pool) return res.status(400).send("No DB in place.");

  let client;
  try {
    client = await pool.connect();
    const table = req.params.name;
    const result = await client.query(tableCommentQuery, [table]);

    const comment = result.rows[0]?.comment || null;

    res.json({ comment });  // Renvoie toujours { comment: string | null }

  } catch (error) {
    console.error("Erreur dans /table_comment/:name :", error);
    res.status(500).json({ error: "Error accessing database." });
  } finally {
    if (client) client.release();
  }
});



/*
 Database list from postgres
*/

app.get("/api/databases", async (req, res) => {
  const tempPool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    database: "postgres", // use default postgres db temporarily
  });

  let client;
  try {
    client = await tempPool.connect();
    const result = await client.query(
      "SELECT datname FROM pg_database WHERE datistemplate = false order by datname;"
    );
    const dbs = result.rows.map((row) => row.datname);

    res.json(dbs);
  } catch (err) {
    console.error("Error listing databases:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client && client.release();
    await tempPool.end(); // fermer le pool temporaire
  }
});

/*
 test for file overwrite 
*/
app.get("/check-file", (req, res) => {
  const filename = req.query.filename;
  const filePath = path.join(
    GRAPH_DIR,
    filename.endsWith(".json") ? filename : filename + ".json"
  );

  fs.access(filePath, fs.constants.F_OK, (err) => {
    res.json({ exists: !err });
  });
});

/*
 save current graph on GRAPH_DIR directory on server 
*/

app.post("/save-graph", (req, res) => {
  let { filename, data } = req.body;
  if (!filename.endsWith(".json")) {
    filename += ".json";
  }
  const filePath = path.join(GRAPH_DIR, `${filename}`);

  fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error("Error saving graph state:", err);
      return res.status(500).send("Error saving graph state.");
    }
    res.send(`graph ${filename} saved successfully`);
  });
});

/*
 get list of files in GRAPH_DIR to be picked
*/

app.get("/list-saves", (req, res) => {
  fs.readdir(GRAPH_DIR, (err, files) => {
    if (err) return res.status(500).send("Erreur lecture répertoire");
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    res.json(jsonFiles);
  });
});

/*
 Load a named graph from GRAPH_DIR 
*/

app.get("/load-graph/:filename", (req, res) => {
  let filename = req.params.filename;
  if (!filename.endsWith(".json")) {
    filename += ".json";
  }

  const filePath = path.join(GRAPH_DIR, `${filename}`);
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error loading graph state:", err);
      return res.status(404).send("Graph state not found.");
    }
    res.json(JSON.parse(data));
  });
});

/*
 COnnect to a DB with the simplest request to be sure it's ok
*/

app.post("/connect-db", async (req, res) => {
  const { dbName } = req.body;
  if (!dbName) return res.status(400).send("give a database name");

  try {
    const pool = getPoolFor(dbName);

    // 🔍 Test réel de connexion
    await pool.query("SELECT 1");

    res.send(`connected to '${dbName}'`);
  } catch (err) {
    console.error("Erreur de connexion :", err);
    res.status(500).send("connection failed");
  }
});

/*
 get code of a unique trigger and generate totally a result page
 used also to show a function code 
 html result page is dynamically constructed here
*/

app.get("/functionOLD", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const pool = getCurrentPool();
  if (!pool) return res.status(400).send("No DB in place.");

  let client;
  try {
    client = await pool.connect();
    const name = req.query.name;
    const tableName = req.query.table;
    const triggerName = req.query.triggerName;
    const result = await client.query(
      `
      SELECT pg_get_functiondef(p.oid) as code
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = $1
      LIMIT 1
  `,
      [name]
    );

    if (result.rows.length > 0) {
      res.send(`
    <html>
    <head>
      <link href="https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism.css" rel="stylesheet" />
    </head>
      <body>
        <h1><small>table: </small>${tableName}</h1>
        <h2><small>trigger: </small>${triggerName}</h2>
        <h3><small>function: </small>${name}</h3>
        <pre> <code class="language-sql">${result.rows[0].code}</code></pre>
       <script src="https://cdn.jsdelivr.net/npm/prismjs@1/components/prism-core.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/prismjs@1/components/prism-sql.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/prismjs@1/plugins/autoloader/prism-autoloader.min.js"></script>
      </body>
      </html>
      `);
    } else {
      res.send(`<p>No function found with name: ${name}</p>`);
    }
  } catch {
    return res.status(404).json({ error: `function does not exist` });
  } finally {
    if (client) client.release();
  }
});


app.get("/api/function", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const pool = getCurrentPool();
  if (!pool) return res.status(400).send("No DB in place.");

  const { name } = req.query;

  if (!name) return res.status(400).send("Function name is required.");

  let client;
  try {
    client = await pool.connect();

    const result = await client.query(
      `
      SELECT pg_get_functiondef(p.oid) as code
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = $1
      LIMIT 1
    `,
      [name]
    );

    if (result.rows.length > 0) {
      return res.json({ code: result.rows[0].code });
    } else {
      return res.status(404).json({ error: "Function not found" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Internal error" });
  } finally {
    if (client) client.release();
  }
});





/*
 fetch trigger for triggers.html page that called it directly
*/

app.get("/triggers", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const pool = getCurrentPool();
  if (!pool) {
    return res
      .status(500)
      .json({ error: "Database connection not initialized." });
  }

  let client = await pool.connect();
  // get table name in url
  const table = req.query.table;
  if (!table) {
    console.error("Missing table parameter");
    return res.status(400).json({ error: "Missing table parameter" });
  }

  // search keywords in source code 

  try {
    const { rows } = await client.query(triggerQuery);

    const filteredTriggers = rows.filter((row) => row.table_name === table);
    const enriched = await Promise.all(
      filteredTriggers.map(async (row) => {
        try {
          const matches = [
            ...row.definition.matchAll(
              /\b(EXECUTE|PERFORM)\s+(FUNCTION|PROCEDURE)?\s*([a-zA-Z_][\w]*)/gi
            ),
          ];
          const functionNames = matches.map((m) => m[3]);

          let fullText = row.definition + "\n";

          for (const functionName of functionNames) {
            const body = await collectFunctionBodies(client, functionName);
            fullText += body + "\n";
          }

          const cleanedText = stripSqlComments(fullText);

          const impactedTables = [
            ...new Set(
              extractImpactedTables(cleanedText).filter((t) => t !== table)
            ),
          ];


          const calledFunctions = [
            ...new Set(extractCalledFunctions(fullText)),
          ];

          return {
            name: row.trigger_name,
            on: row.triggered_on,
            timing: row.timing,
            definition: row.definition,
            functionNames,
            impactedTables,
            calledFunctions,
          };
        } catch (err) {
          console.error(`Error processing trigger ${row.trigger_name}:`, err);
          return {
            name: row.trigger_name,
            on: row.triggered_on,
            timing: row.timing,
            definition: row.definition,
            functionName: null,
            impactedTables: [],
            calledFunctions: [],
            error: err.message,
          };
        }
      })
    );

    res.json({ triggers: enriched });
  } catch (err) {
    console.error("Error querying triggers:", err);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  } finally {
    if (client) client.release();
  }
});

/*
 check DB connected
*/

app.get("/current-db", (req, res) => {
  const dbName = getCurrentDBName();
  if (dbName) {
    res.json({ dbName });
  } else {
    res.status(404).send("No connection to DB");
  }
});

/*
 app version 
*/

app.get("/api/version", (req, res) => {
  res.json({ version: appPkg.version });
});

/*
 directory custom is out of git 
 the following code search for complementary documentation in custom/docs/index.md

*/


app.get('/api/custom-docs-check', (req, res) => {
  const docsDir = path.join(__dirname, 'public', 'custom','docs');

  fs.readdir(docsDir, (err, files) => {
    if (err) {
      return res.json({ available: false });
    }

    const matchingFiles = files.filter(name => /^index.*\.md$/i.test(name));

    if (matchingFiles.length > 0) {
      res.json({ available: true, files: matchingFiles });
    } else {
      res.json({ available: false });
    }
  });
});






// Start the server

app.listen(PORT, () => {
  console.log(`Server started.App now available on http://localhost:${PORT}`);
});


