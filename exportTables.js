/*
 experimental 
 export in csv a set of ordered tables prepared through Model/DB Layout/by dependencies 
 Save the clipped string into a json file here in temp4work then call it with url 
*/

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { to as copyTo } from "pg-copy-streams";
import { getPoolFor } from "./db.js"; //

import { formatDuration, formatBytes } from "./public/js/util/formater.js";

// Recreate __filename and __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_DIR = path.join(__dirname, "temp4Work");
const OUTPUT_DIR = path.join(JSON_DIR, "exports");

/*
 helper to share destination 
*/
function pathForOutput(tableName) {
  return path.join(OUTPUT_DIR, `${tableName}.csv`);
}

function pathForInputJson(jsonName) {
  return path.join(JSON_DIR, `${jsonName}`);
}

/*
 takes a Json file as metadata then goes to dump table by stream in csv
*/

export async function exportAll(dbName, jsonName, onProgress) {
  const pool = getPoolFor(dbName);

  let client;
  const errors = [];
  const perTableStats = [];

  //const t0 = performance.now();

  try {
    // make sure directories exist
    await fs.ensureDir(JSON_DIR);
    await fs.ensureDir(OUTPUT_DIR);

      onProgress?.("Connexion à la base...");
    // 1️⃣ Récupération du client depuis le pool
    client = await pool.connect();

    // 2️⃣ Chargement du JSON
    const levels = await fs.readJson(pathForInputJson(jsonName));
    await fs.ensureDir(OUTPUT_DIR);
  onProgress?.("Export en cours...");
    // 3️⃣ Démarrage transaction snapshot
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ");

    console.log("Transaction REPEATABLE READ started (snapshot in place)");

    let bigTotalBytes = 0;
    let bigTotalTime = 0;
    let bigTotalTable = 0;

    // 4️⃣ Parcours des niveaux
    for (const levelObj of levels.sort((a, b) => a.level - b.level)) {
      let totalByteThisLevel = 0;
      let totalTimeThisLevel = 0;
      console.log(`\n=== Level ${levelObj.level} ===`);
        onProgress?.(`\n=== Level ${levelObj.level} ===`);

      for (const tableName of levelObj.nodes) {
        bigTotalTable += 1;
        const tTable0 = performance.now();
        let tTable1 = performance.now(); // for visibility in console error message
        onProgress(`export: ${tableName} `);
        try {
          const { bytes } = await exportTable(client, tableName);
          tTable1 = performance.now();
          perTableStats.push({
            tableName,
            ms: tTable1 - tTable0,
            bytes,
          });

          totalByteThisLevel += bytes;
          totalTimeThisLevel += tTable1 - tTable0;
          const result = `${formatBytes(bytes)} in ${tableName}.csv -  ${formatDuration(tTable1 - tTable0)} `
          console.log(result);
           onProgress(result);


          
        } catch (err) {
          errors.push({ tableName, message: err.message });
          console.error(
            `✖ ${tableName} failed after ${formatDuration(
              tTable1 - tTable0
            )} → ${err.message}`
          );
          // tu peux choisir :
          // continue;  // continuer avec les autres
          // ou throw err;  // interrompre tout
        }
      }
      console.log(
        `total byte for level ${levelObj.level} :${formatBytes(
          totalByteThisLevel
        )} in ${formatDuration(totalTimeThisLevel)} ms`
      );
      bigTotalBytes += totalByteThisLevel;
      bigTotalTime += totalTimeThisLevel;
    }

    if (errors.length) {
      console.warn("\n⚠️  Some table export have failed:");
      errors.forEach((e) => console.warn(`- ${e.table}: ${e.message}`));
    }

    // 5️⃣ Validation finale
    await client.query("COMMIT");
    console.log("\n✅ Succes for export!");
    const report = `total for ${bigTotalTable} table(s) in time: ${formatDuration(
      bigTotalTime
    )}    ( ${formatBytes(bigTotalBytes, { decimals: 3 })})`;

    console.log(report);
    return report;
  } catch (err) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    const report = `❌ Erreur while exporting :${err}`;
    console.error(report);
    return report;
  } finally {
    if (client) client.release(); // important to free in pool
  }
}

/*
 one table export in csv through bulk copy in csv
*/

async function exportTable(client, tableName) {
  const filePath = pathForOutput(tableName);
  //console.log(`→ Export ${tableName} into ${filePath}`);
  let bytes = 0;
  try {
    // enquote table name as authorization is keyword
    const sql = `COPY "${tableName}" TO STDOUT WITH CSV HEADER`;
    const fileStream = fs.createWriteStream(filePath);
    const stream = client.query(copyTo(sql));

    bytes = await new Promise((resolve, reject) => {
      stream.pipe(fileStream);

      let totalBytes = 0;

      // count bytes manually as they stream
      stream.on("data", (chunk) => {
        totalBytes += chunk.length;
      });

      stream.on("error", reject);
      fileStream.on("error", reject);

      fileStream.on("finish", () => resolve(totalBytes));
    });
  } catch (err) {
    throw new Error(`failed export of ${tableName} : ${err.message}`);
  }
  return { bytes };
}
