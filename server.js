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
import { getTableDetails } from "./dbUtils.js";

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

import {
  reqListOfTables,
  edgesQuery,
  triggerQuery,
  triggerQueryOneTable,
  tableCommentQuery,
  reqCheckColumn,

} from "./dbreq.js";

import { encodeCol2Col } from "./public/js/util/common.js";
import { escapeHtml } from "./public/js/util/formater.js";

import { exportAll } from "./exportTables.js";

console.log("init env");
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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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

/*
 create a network with tables as nodes and FK as edges
*/
app.post("/OLDload-from-db", async (req, res) => {
  const { dbName } = req.body;

  let client;
  try {
    const pool = getPoolFor(dbName);
    client = await pool.connect();



    // Get column info per table (simplified version)
    const columnMap = {}; // tableName -> array of columns
    const columnResult = await client.query(reqListOfTables);

    // separate names in a collection
    const tableNames = [...new Set(columnResult.rows.map((r) => r.table_name))];

    // dispatch columns in a new dict array
    columnResult.rows.forEach(({ table_name, column_name }) => {
      if (!columnMap[table_name]) columnMap[table_name] = [];
      columnMap[table_name].push(column_name);
    });

    // Get FK columns per table in another array

    const fkResult = await client.query(edgesQuery);
    /*
    //console.log(fkResult);
    {
      constraint_name: 'line_product_production_line_id_fkey',
      source: 'line_product',
      target: 'production_line',
      on_delete: 'c',
      on_update: 'a',
      comment: null,
      source_column: 'production_line_id',
      source_not_null: true
    },
    
    
    */
    const fkColumnMap = {}; // tableName -> Set of FK column names

    fkResult.rows.forEach(({ source, source_column, source_not_null }) => {
      if (!fkColumnMap[source]) fkColumnMap[source] = [];
      // here true or false on source_not_null
      fkColumnMap[source].push({
        column: source_column,
        nullable: !source_not_null,
      });
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

    const nodes = [];

    for (const name of tableNames) {
      const details = await getTableDetails(client, name);
      const trigs = triggersByTable.get(name) || [];

      const data = {
        id: name,
        label: name, //+ (trigs.length > 0 ? "\n" + "*".repeat(trigs.length) : ""), replaced by icon + data.triggers.length
        // change : now bring back all infos on columns
        //columns: details.columns.map((c) => c.column),
        columns: details.columns,
        foreignKeys: details.foreignKeys || [], // ex .map(fk => fk.column),
        comment: details.comment,
        primaryKey: details.primaryKey,
        indexes: details.indexes,
        triggers: trigs,
      };

      // data.columns is an array of json  { column: 'id', type: 'integer', nullable: 'NO', comment: null }
      // nodes new fk with all_source_not_null
      nodes.push({ data });
    }

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
          // we add a visual label to be set on screen with //`${e.source_column} → ${e.target_column}`,
          columnsLabel: encodeCol2Col(e.source_column, e.target_column),

          onDelete: e.on_delete, // raw code: 'a', 'c', etc.
          onUpdate: e.on_update, // raw code
          nullable: !e.source_not_null,
        },
        // a no action c: cascade.
        classes: [
          "fk_detailed", // one edge per column fk
          e.on_delete === "c" ? "delete_cascade" : "",
          e.on_delete === "r" ? "delete_restrict" : "",
          !e.source_not_null ? "nullable" : "",
        ]
          .filter(Boolean) // supprime les chaînes vides
          .join(" "),
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

app.post("/load-from-db", async (req, res) => {
  const { dbName } = req.body;

  let client;
  try {
    const pool = getPoolFor(dbName);
    client = await pool.connect();

    /******************************************************************
     * 1. RÉCUPÉRER TOUTES LES COLONNES DE TOUTES LES TABLES
     ******************************************************************/
    const columnResult = await client.query(`
      SELECT 
        c.table_schema,
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        pgd.description AS comment
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON c.table_name = t.table_name
       AND c.table_schema = t.table_schema
      LEFT JOIN pg_catalog.pg_statio_all_tables st
        ON st.relname = c.table_name
       AND st.schemaname = c.table_schema
      LEFT JOIN pg_catalog.pg_description pgd
        ON pgd.objoid = st.relid
       AND pgd.objsubid = c.ordinal_position
      WHERE c.table_schema NOT IN ('information_schema')
        AND c.table_schema NOT LIKE 'pg_%'
        AND t.table_type = 'BASE TABLE'
      ORDER BY c.table_schema, c.table_name, c.ordinal_position;
    `);

    // tableNames sera du style ["production.product", "sales.salesorderheader", ...]
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
    const fkResult = await client.query(`
      SELECT
        tc.constraint_name,
        tc.table_schema      AS source_schema,
        tc.table_name        AS source,
        kcu.column_name      AS source_column,

        /* nullable info for source column */
        (SELECT (c.is_nullable = 'NO') AS not_null
         FROM information_schema.columns c
         WHERE c.table_schema = tc.table_schema
           AND c.table_name   = tc.table_name
           AND c.column_name  = kcu.column_name
        ) AS source_not_null,

        ccu.table_schema     AS target_schema,
        ccu.table_name       AS target,
        ccu.column_name      AS target_column,

        rc.update_rule       AS on_update,
        rc.delete_rule       AS on_delete
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema    = kcu.table_schema
      JOIN information_schema.referential_constraints rc
           ON tc.constraint_name = rc.constraint_name
          AND tc.table_schema    = rc.constraint_schema
      JOIN information_schema.constraint_column_usage ccu
           ON ccu.constraint_name  = tc.constraint_name
          AND ccu.constraint_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema NOT IN ('information_schema')
        AND tc.table_schema NOT LIKE 'pg_%'
      ORDER BY source_schema, source, kcu.ordinal_position;
    `);

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

    /******************************************************************
     * 3. RÉCUPÉRER LES TRIGGERS POUR TOUS LES SCHÉMAS
     ******************************************************************/
    // Note: string_agg(event_manipulation) pour avoir INSERT/UPDATE/DELETE
    const triggerRows = await client.query(`
      SELECT 
        t.event_object_schema AS table_schema,
        t.event_object_table  AS table_name,
        t.trigger_name,
        t.action_timing       AS timing,
        string_agg(t.event_manipulation, ', ') AS triggered_on,
        t.action_statement    AS definition
      FROM information_schema.triggers t
      WHERE t.event_object_schema NOT IN ('information_schema')
        AND t.event_object_schema NOT LIKE 'pg_%'
      GROUP BY 
        t.event_object_schema,
        t.event_object_table,
        t.trigger_name,
        t.action_timing,
        t.action_statement
      ORDER BY 
        t.event_object_schema,
        t.event_object_table,
        t.trigger_name;
    `);

    // Map "schema.table" -> [ { name, on, timing, definition }, ... ]
    const triggersByTable = new Map();

    for (const row of triggerRows.rows) {
      const fullName = `${row.table_schema}.${row.table_name}`;
      const trigger = {
        name: row.trigger_name,
        on: row.triggered_on, // "INSERT, UPDATE", etc.
        timing: row.timing, // BEFORE / AFTER
        definition: row.definition,
      };

      if (!triggersByTable.has(fullName)) {
        triggersByTable.set(fullName, []);
      }
      triggersByTable.get(fullName).push(trigger);
    }

    /******************************************************************
     * 4. DÉTAILS PAR TABLE (PK, index, commentaire table, FKs structurées)
     ******************************************************************/
    async function getTableDetails(client, fullName) {

      const [schema, table] = fullName.split(".");

      // colonnes déjà construites via columnMap, mais tu avais un format plus riche :
      const columns = columnMap[fullName] || [];

      // commentaire de la table 

      const commentResult = await client.query(
        `
  SELECT obj_description(to_regclass($1 || '.' || $2)::oid) AS comment
  `,
        [schema, table]
      );
      const tableComment =
        commentResult.rows[0] && commentResult.rows[0].comment
          ? commentResult.rows[0].comment
          : null;

      // clé primaire



      const pkResult = await client.query(
        `
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2
        ORDER BY kcu.ordinal_position;
        `,
        [schema, table]
      );
      const primaryKey = pkResult.rows.map((r) => r.column_name);

      // indexes
      // On va interroger pg_indexes
      const idxResult = await client.query(
        `
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = $1
          AND tablename = $2;
        `,
        [schema, table]
      );
      const indexes = idxResult.rows.map((r) => ({
        name: r.indexname,
        def: r.indexdef,
      }));

      // FKs sortantes structurées pour cette table
      const fksForThisTable = fkResult.rows
        .filter(
          (fk) =>
            fk.source_schema === schema &&
            fk.source === table
        )
        .map((fk) => ({
          constraint: fk.constraint_name,
          column: fk.source_column,
          target: `${fk.target_schema}.${fk.target}`,
          targetColumn: fk.target_column,
          onDelete: fk.on_delete, // e.g. CASCADE, RESTRICT, NO ACTION...
          onUpdate: fk.on_update,
          nullable: !fk.source_not_null,
        }));

      return {
        columns,
        foreignKeys: fksForThisTable,
        primaryKey,
        comment: tableComment,
        indexes,
      };
    }

    /******************************************************************
     * 5. CONSTRUIRE LES NODES POUR CYTOSCAPE
     ******************************************************************/
    const nodes = [];
    for (const fullName of tableNames) {
      const details = await getTableDetails(client, fullName);
      const trigs = triggersByTable.get(fullName) || [];

      const data = {
        id: fullName, // "schema.table"
        label: fullName, // idem pour l'affichage
        columns: details.columns, // tableau d'objets { column, type, nullable, comment }
        foreignKeys: details.foreignKeys || [],
        comment: details.comment,
        primaryKey: details.primaryKey,
        indexes: details.indexes,
        triggers: trigs,
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
     * 7. RÉPONSE
     ******************************************************************/
    res.json({ nodes, edges: filteredEdges });
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
    const sql = format ('SELECT 1 FROM %I.%I LIMIT 1', schema, table);
    try {
      await client.query(sql);
    } catch {
      return res
        .status(404)
        .json({ error: `Table '${table}' does not exist.` });
    }

    const details = await getTableDetails(client, fullName);
    //console.log(JSON.stringify(details));//PLA
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
    const sql = format ('SELECT * FROM %I.%I LIMIT 10', schema, table);
    console.log(sql);//PLA
    const result = await client.query(sql);
console.log(result.rows);//PLA
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
    const table = req.params.name;
    const result = await client.query(tableCommentQuery, [table]);

    const comment = result.rows[0]?.comment || null;

    res.json({ comment }); // Renvoie toujours { comment: string | null }
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
  const table = req.query.table;
  if (!table) {
    console.error("Missing table parameter");
    return res.status(400).json({ error: "Missing table parameter" });
  }

  // search keywords in source code

  try {
    //const { rows } = await client.query(triggerQuery);

    //const filteredTriggers = rows.filter((row) => row.table_name === table);
    const { rows } = await client.query(triggerQueryOneTable, [table]);
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

          //
          let fullText = row.definition + "\n";

          // collect all function codes and add it to main source

          for (const functionName of functionNames) {
            const { allCodeResult, warnings: fnWarnings } =
              await collectFunctionBodies(client, table, functionName);

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
                table: table,
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


/*
 specific sanity check experimental 

search column exist or not in tables 
http://localhost:3000/searchColumns?dbName=perfo7.8.20&columnName=db_version&exists=false

*/

app.get("/searchColumn", async (req, res) => {
  const { dbName, columnName, exists } = req.query;
  if (!dbName) {
    console.error("Missing parameter");
    return res.status(400).json({ error: "Missing dbName parameters } " });
  }
  let client;
  try {
    const pool = getPoolFor(dbName);
    if (!pool) {
      return res
        .status(500)
        .json({ error: "Database connection not initialized." });
    }

    client = await pool.connect();

    // check if tables have the column

    if (columnName) {
      let results = await client.query(reqCheckColumn, [columnName, exists]);

      let stack = [];
      stack.push(` ## ${results.rows.length} tables that have not a column named "${columnName}"`);

      results.rows.forEach((r) => {
        stack.push(r.tablename);
      });

      console.log(stack.join("\n"));


      const body = stack.map(escapeHtml).join("<br/>");
      const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Report</title></head>
<body style="font-family:system-ui">${body}</body></html>`;

      res.type("html"); // = Content-Type: text/html; charset=utf-8
      res.send(html);
    } else {
      return res.status(400).json({ error: "Missing columnName parameter" });
    }
  } catch (err) {
    console.error("Error running query:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release(); // Always release connection
  }
});

// Start the server

app.listen(PORT, () => {
  console.log(`Server started.App now available on http://localhost:${PORT}`);
});
