// Copyright (C) 2025 pep-inno.com
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

import { readFile, readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import pkg from "pg";
const { Pool } = pkg;

import format from 'pg-format';

import {
  getPoolFor,
  getCurrentPool,
  getCurrentDBName,
  setCurrentDBName,
  resetPool,

} from "./db.js";
import {
  collectFunctionBodies,
  extractImpactedTables,
  extractCalledFunctions,
  stripSqlComments,
} from "./dbSqlParser.js";

// dynamic load of sql request 
import {
  loadSQL
}
  from "./public/sqlRequests/sql-loader.js";

import { encodeCol2Col } from "./public/js/util/common.js";
import { getTableDetails } from "./dbDetails.js";
import { exportAll } from "./exportTables.js";



console.log("init environment using .env");
// Chargement des variables d'environnement
dotenv.config();

const app = express();

// Configuration du moteur de template EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Fichiers statiques (css, js, images)
app.use(express.static(path.join(__dirname, "public")));

// Route principale
app.get("/", (req, res) => {
  res.render("layout", { title: "cytoGraphDB" });
});





// Middleware to parse JSON bodies
// Increase payload size limit to 50MB
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

const PORT = process.env.CYTOGRAPHPORT ? process.env.CYTOGRAPHPORT : 3000;



// directory to store json saved graph
const GRAPH_DIR = path.join(__dirname, "saved-graphs");
// Ensure the directory exists
if (!fs.existsSync(GRAPH_DIR)) {
  fs.mkdirSync(GRAPH_DIR);
}

const pkgPath = path.join(__dirname, "package.json");
const pkgRaw = await readFile(pkgPath, "utf-8");
const appPkg = JSON.parse(pkgRaw);

app.use(express.static("public"));

/* multi schemas : search_path for current connection */

app.get("/search_path", async (req, res) => {
  const pool = getCurrentPool();
  if (!pool) return res.status(400).send("No DB in place.");
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT array_to_json(current_schemas(true)) AS sp');
    const searchPath = result.rows[0].sp; // Array of schema names  
    res.json({ searchPath });
  } catch (error) {
    console.error("Error fetching search path:", error);
    res.status(500).json({ error: "Error accessing database." });
  } finally {
    if (client) client.release();
  }
});



/*
 create a network with tables as nodes and FK as edges
*/

app.post("/load-from-db", async (req, res) => {
  const { dbName } = req.body;

  let client;
  try {
    const pool = getPoolFor(dbName);
    client = await pool.connect();

    // get list of schemas to be set in cytoscape data for future use

    const allSchemasSQL = await loadSQL('schemas_list');
    const resultSchemas = await client.query(allSchemasSQL);
    const schemas = resultSchemas.rows.map((row) => row.schema_name);

    // get list of tables in schemas to solve later not qualified names in triggers

    const schemas_tables_list = await loadSQL('schemas_tables_list');
    const res_schemas_tables_list = await client.query(schemas_tables_list);


    const tableNameSolver = new Map(); // table → [schemas]

    for (const row of res_schemas_tables_list.rows) {
      const tbl = row.table_name;
      const sch = row.table_schema;
      if (!tableNameSolver.has(tbl)) tableNameSolver.set(tbl, []);
      tableNameSolver.get(tbl).push(sch);
    }



    /*
     'a' => [ 'pe' ],
     'address' => [ 'humanresources', 'person' ],
     'addresstype' => [ 'person' ],
     ...
    */


    /******************************************************************
     * 1. RÉCUPÉRER TOUTES LES COLONNES DE TOUTES LES TABLES
     ******************************************************************/
    const allColumnsAllTables = await loadSQL('allColumnsAllTables');
    const columnResult = await client.query(allColumnsAllTables);

    // tableNames like ["production.product", "sales.salesorderheader", ...]
    const tableNames = [
      ...new Set(
        columnResult.rows.map(
          (r) => `${r.table_schema}.${r.table_name}`
        )
      ),
    ];

    // columnMap["schema.table"] = [ { column, type, nullable, comment }, ... ]
    const columnMap = {};
    for (const row of columnResult.rows) {
      const fullName = `${row.table_schema}.${row.table_name}`;
      if (!columnMap[fullName]) columnMap[fullName] = [];
      columnMap[fullName].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === "YES",
        comment: row.comment || null,
      });
    }

    /******************************************************************
     * 2. RÉCUPÉRER LES FOREIGN KEYS ENTRE TOUS LES SCHÉMAS
     ******************************************************************/
    const allEdgesAllTables = await loadSQL('allEdgesAllTables');
    const fkResult = await client.query(allEdgesAllTables);

    // fkColumnMap["schema.table"] = [ { column, nullable }, ... ]
    const fkColumnMap = {};

    fkResult.rows.forEach(
      ({ source_schema, source, source_column, source_not_null }) => {
        const fullSource = `${source_schema}.${source}`;
        if (!fkColumnMap[fullSource]) fkColumnMap[fullSource] = [];
        fkColumnMap[fullSource].push({
          column: source_column,
          nullable: !source_not_null, // true si FK nullable
        });
      }
    );

    /*
     all triggers in one shot and fill in a dictionary
 
      Note: string_agg(event_manipulation) pour avoir INSERT/UPDATE/DELETE
 */


    const allTriggersAllTables = await loadSQL('allTriggersAllTables');
    const triggerRows = await client.query(allTriggersAllTables);

    // Map "schema.table" -> [ { name, on, timing, definition }, ... ]
    const triggersByTable = new Map();

    for (const row of triggerRows.rows) {

      const fullName = `${row.table_schema}.${row.table_name}`;
      const trigger = {
        name: row.trigger_name,
        on: row.triggered_on, // "INSERT, UPDATE", etc.
        timing: row.timing, // BEFORE / AFTER
        triggered_on: row.triggered_on,
        definition: row.definition,
      };

      if (!triggersByTable.has(fullName)) {
        triggersByTable.set(fullName, []);
      }
      triggersByTable.get(fullName).push(trigger);
    }
    /*
     all pk in one shot and fill in a dictionary
    */
    const allPkAllTables = await loadSQL('allPKAllTables');
    const pkResult = await client.query(allPkAllTables);

    const pkByTable = new Map();
    for (const row of pkResult.rows) {
      const fullName = `${row.table_schema}.${row.table_name}`;
      pkByTable.set(fullName, {
        name: row.constraint_name,
        comment: row.comment || null,
        columns: row.columns, // sorted array columns of PK
      });
    }

    /*
      all foreign key in one shot and fill in a dictionary
    */
    const allFkSQL = await loadSQL("allFkAllTables");
    const resultFk = await client.query(allFkSQL);

    console.log(JSON.stringify(resultFk, 0, 2));//PLA


    const fkByTable = new Map();
    // get the array of FK
    const fkRows = resultFk.rows[0]?.foreign_keys ?? [];

    for (const row of fkRows) {
      const fullName = `${row.source_schema}.${row.source_table}`;

      const fkInfo = {
        name: row.constraint_name,
        comment: row.comment || null,
        target: `${row.target_schema}.${row.target_table}`,
        columnMappings: row.column_mappings || [],
        allSourceNotNull: row.all_source_not_null,
        isTargetUnique: row.is_target_unique,
        onDelete: row.on_delete,
        onUpdate: row.on_update
      };

      if (!fkByTable.has(fullName)) {
        fkByTable.set(fullName, []);
      }
      fkByTable.get(fullName).push(fkInfo);
    }
    // const fks = fkByTable.get('public.orders');

    /*
      all comments in one shot   in a dictionary
    */
    const allCommentsSQL = await loadSQL("allCommentsAllTables");
    const commentResult = await client.query(allCommentsSQL);
    const commentsByTable = new Map(); // ou un objet si tu préfères {}
    for (const row of commentResult.rows) {
      const fullName = `${row.table_schema}.${row.table_name}`;
      commentsByTable.set(fullName, row.comment || null);
    }

    /*
      all Index in one shot  in a dictionary
    */

    const allIndexesAllTables = await loadSQL("allIndexAllTables");
    const indexResult = await client.query(allIndexesAllTables /*, [schema] si filtré */);

    const indexesByTable = new Map();

    for (const row of indexResult.rows) {
      const fullName = `${row.table_schema}.${row.table_name}`;
      const indexInfo = {
        name: row.index_name,
        definition: row.index_def,
        comment: row.comment || null,
        constraintType: row.constraint_type || null,
        isPrimary: row.is_primary,
        isUnique: row.is_unique,
      };

      if (!indexesByTable.has(fullName)) {
        indexesByTable.set(fullName, []);
      }
      indexesByTable.get(fullName).push(indexInfo);
    }

    // Exemple d’accès :
    // const idx = indexesByTable.get('public.orders');
    // -> tableau d’index de la table orders





    /*
    tableNames like ["production.product", "sales.salesorderheader", ...]
    columnMap[fullName] = [ { column, type, nullable, comment }, ... ]
    fkColumnMap["schema.table"] = [ { column, nullable }, ... ]
    triggersByTable: Map "schema.table" -> [ { name, on, timing, definition }, ... ]
    pkByTable: Map "schema.table" -> { name, comment, columns }
    indexesByTable: Map "schema.table" -> [ { name, definition, comment, constraintType }, ... ]
    commentsByTable: Map "schema.table" -> comment string
    schemas : schema_tables_list result used to build
    tableNameSolver: Map table → [schemas]
    */





    /******************************************************************
     * 5. Construct  NODES FOR CYTOSCAPE
     ******************************************************************/
    const nodes = [];

    /*
     identify name collisions here if any
     if two tables with same name in different schema exist a flag duplicateName is set to true
    */
    const counts = new Map();

    for (const fullName of tableNames) {
      const [, table] = fullName.split('.');
      counts.set(table, (counts.get(table) || 0) + 1);
    }

    const duplicates = [...counts.entries()]
      .filter(([_, count]) => count > 1)
      .map(([table]) => table);

    for (const fullName of tableNames) {
      const data = {
        id: fullName, // "schema.table"
        duplicateName: duplicates.includes(fullName.split('.')[1]),// warn if duplicate table name exists
        // label default with or without schema @todo : user option
        label: fullName, // idem pour l'affichage
        columns: columnMap[fullName], // tableau d'objets { column, type, nullable, comment }
        foreignKeys: fkColumnMap[fullName] || [],
        comment: commentsByTable[fullName] || [],
        primaryKey: pkByTable[fullName] || [],
        indexes: indexesByTable[fullName] || [],
        triggers: triggersByTable.get(fullName) ?? [],
      };
      nodes.push({ data });
    }

    /******************************************************************
     * 6. CONSTRUIRE LES EDGES FK POUR CYTOSCAPE
     ******************************************************************/
    const filteredEdges = fkResult.rows
      .map((e) => {
        const fullSource = `${e.source_schema}.${e.source}`;
        const fullTarget = `${e.target_schema}.${e.target}`;
        return { e, fullSource, fullTarget };
      })
      .filter(
        ({ fullSource, fullTarget }) =>
          tableNames.includes(fullSource) &&
          tableNames.includes(fullTarget)
      )
      .map(({ e, fullSource, fullTarget }) => ({
        data: {
          source: fullSource,
          target: fullTarget,
          label: e.constraint_name,
          columnsLabel: encodeCol2Col(e.source_column, e.target_column),
          onDelete: e.on_delete, // CASCADE, NO ACTION, etc.
          onUpdate: e.on_update,
          nullable: !e.source_not_null,
        },
        classes: [
          "fk_detailed",
          e.on_delete === "CASCADE" ? "delete_cascade" : "",
          e.on_delete === "RESTRICT" ? "delete_restrict" : "",
          !e.source_not_null ? "nullable" : "",
        ]
          .filter(Boolean)
          .join(" "),
      }));

    /******************************************************************
     * 7. response JSON  nodes, edges, list of schemas, list of tables in schemas
     ******************************************************************/


    res.json({ nodes, edges: filteredEdges, schemas: schemas, tableNameSolver: [...tableNameSolver] });
  } catch (error) {
    console.error("error loading graph :", error);
    res.status(500).json({ error: "Error accessing database" });
  } finally {
    if (client) client.release();
  }
});

/*

Table details  

*/
app.get("/table/:name", async (req, res) => {
  const pool = getCurrentPool();
  if (!pool) return res.status(400).send("No DB in place.");

  let fullName = req.params.name;
  const [schema, table] = fullName.split(".");

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
    return res.status(400).json({ error: "Invalid table name format." });
  }
  let client;
  try {
    client = await pool.connect();
    const sql = format('SELECT 1 FROM %I.%I LIMIT 1', schema, table);
    try {
      await client.query(sql);
    } catch {
      return res
        .status(404)
        .json({ error: `Table '${table}' does not exist.` });
    }

    const details = await getTableDetails(client, fullName);

    res.json(details);
  } catch (error) {
    console.error("Erreur dans /table/:name :", error);
    res.status(500).json({ error: "Error accessing database." });
  } finally {
    if (client) client.release();
  }
});


/*
Table details  
*/

app.get("/table10rows/:name", async (req, res) => {
  const pool = getCurrentPool();
  if (!pool) return res.status(400).send("No DB in place.");

  let fullName = req.params.name;
  const [schema, table] = fullName.split(".");
  // Vérifie que le nom de la table est valide (pas d’injection SQL possible)
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
    return res.status(400).json({ error: "Invalid table name format." });
  }

  let client;
  try {
    client = await pool.connect();
    const sql = format('SELECT * FROM %I.%I LIMIT 10', schema, table);
    const result = await client.query(sql);

    // Important : result.rows contient les données
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res
      .status(404)
      .json({ error: `Table '${table}' does not exist or cannot be queried.` });
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
    const fullName = req.params.name;
    const [schema, table] = fullName.split(".");

    const oneTableComments = await loadSQL('oneTableComments');
    const result = await client.query(oneTableComments, [schema, table]);

    const comment = result.rows[0]?.comment || null;

    res.json({ comment }); // Renvoie toujours { comment: string | null }
  } catch (error) {
    console.error("Error on  /table_comment/:name :", error);
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
    res.send(`connected to <b>${dbName}</b>`);
    setCurrentDBName(dbName);
  } catch (err) {
    console.error("connection error :", err);
    res.status(500).send("connection failed");
  }
});

/*
 get code of a unique trigger and generate totally a result page
 used also to show a function code 
 html result page is dynamically constructed here
*/
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
    return res.status(500).json({ error: "Internal error" + err });
  } finally {
    if (client) client.release();
  }
});

/*
 fetch one triggers by table name. 
 called from triggers.html page that called it directly
 this also parse content through collectFunctionBodies

 return a composite structure 
 {
            name: row.trigger_name,
            on: row.triggered_on,
            timing: row.timing,
            definition: row.definition,
            functionNames,
            impactedTables,
            calledFunctions,
            warnings,
          }
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
  const fullName = req.query.fullName;
  if (!fullName) {
    console.error("Missing table parameter");
    return res.status(400).json({ error: "Missing table parameter" });
  }
  // search keywords in source code
  const [schema, table] = fullName.split(".");

  try {

    //const filteredTriggers = rows.filter((row) => row.table_name === table);
    const oneTableTriggers = await loadSQL('oneTableTriggers');


    const { rows } = await client.query(oneTableTriggers, [schema, table]);
    const filteredTriggers = rows;


    const enriched = await Promise.all(
      filteredTriggers.map(async (row) => {
        let warnings = [];
        try {
          const matches = [
            ...row.definition.matchAll(
              /\b(EXECUTE|PERFORM)\s+(FUNCTION|PROCEDURE)?\s*([a-zA-Z_][\w]*)/gi
            ),
          ];
          const functionNames = matches.map((m) => m[3]);
          let fullText = row.definition + "\n";

          // collect all function codes and add it to main source

          for (const functionName of functionNames) {
            const { allCodeResult, warnings: fnWarnings } =
              await collectFunctionBodies(client, fullName, functionName);

            const body = allCodeResult;
            if (fnWarnings?.length) warnings.push(...fnWarnings);

            // search for bad practice EXECUTE inline string
            const execMatches = [
              ...body.matchAll(
                // iterator
                /\bEXECUTE\s+(?!FUNCTION|PROCEDURE)([^;]+)/gi
              ),
            ];

            if (execMatches.length > 0) {
              let aWarning = {
                table: fullName,
                function: functionName,
                warn: ` code with "EXECUTE 'someString'" is not sure and was not parsed.  `,
              };
              warnings.push(aWarning);

              console.log(JSON.stringify(aWarning));

              const dynamicExec = execMatches.map((m) => m[1].trim());
              console.log(dynamicExec);
            }
            // append
            fullText += body + "\n";
          }

          const cleanedText = stripSqlComments(fullText);

          const impactedTables = [
            ...new Set(
              extractImpactedTables(cleanedText).filter((t) => t !== fullName)
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
            warnings,
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
            warnings,
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
 reset pool to change db 
*/
app.post("/api/reset-pool", async (req, res) => {
  try {
    await resetPool();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
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
 the following code search for complementary documentation if any 
 
 in custom/docs/index.md.  (or any .md starting by 'index')

*/

app.get("/api/custom-docs-check", (req, res) => {
  const docsDir = path.join(__dirname, "public", "custom", "docs");

  fs.readdir(docsDir, (err, files) => {
    if (err) {
      return res.json({ available: false });
    }

    const matchingFiles = files.filter((name) => /^index.*\.md$/i.test(name));

    if (matchingFiles.length > 0) {
      res.json({ available: true, files: matchingFiles });
    } else {
      res.json({ available: false });
    }
  });
});

/*
 scan directory custom to get modules list 
*/
app.get("/api/custom-modules", async (_req, res) => {
  const customDir = path.join(__dirname, "public", "custom");
  try {
    const entries = await readdir(customDir, { withFileTypes: true });
    const jsFiles = entries
      .filter((d) => d.isFile() && d.name.endsWith(".js"))
      .map((d) => `/custom/${d.name}`);
    res.json(jsFiles);
  } catch (err) {
    console.error("Listing error:", err);
    res.status(500).json({ error: "Cannot list custom modules" });
  }
});

/*
 to know if server is running 
*/

app.get("/healthz", (req, res) => {
  res.json("server is on");
});

/*
 Experimental 
 read a dependencies list made by action Model/dbLayout/dependencies and accessible in clipReport. 
 Save this list in a file , into a git excluded directory ( here temp4Work )

 
 /exportAll?dbName=abcdef&, jsonName 

http://localhost:3000/exportALL?dbName=perfo7.8.20&jsonName=tables.json
*/

app.get("/exportAll", async (req, res) => {
  const { dbName, jsonName } = req.query;
  if (!dbName || !jsonName) {
    console.error("Missing parameter");
    return res
      .status(400)
      .json({ error: "Missing parameters expected { dbName , jsonName } " });
  }

  // on indique qu'on va envoyer du texte progressif
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  try {
    res.write("🚀 Export démarré...\n");

    // Exemple : tu peux écrire au fur et à mesure de ton exportAll
    const report = await exportAll(dbName, jsonName, (msg) => {
      res.write(msg + "\n"); // callback appelé depuis exportAll
    });

    res.write("✅ Export terminé !\n");
    res.end(JSON.stringify(report, null, 2)); // fin du flux
  } catch (err) {
    console.error("❌ exportAll failed:", err);
    res.write(`❌ Erreur: ${err.message}\n`);
    res.end();
  }
});








// Start the server

app.listen(PORT, () => {
  console.log(`Server started.App now available on http://localhost:${PORT}`);
});
