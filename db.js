"use strict";
import pkg from "pg";
const { Pool } = pkg;

let currentPool = null;

// to keep track of current DB
let currentDBName = null;

export function setCurrentDBName(aName) {
  currentDBName = aName;
}

export function getCurrentDBName() {
  return currentDBName;
}

/**
 * Crée ou réutilise un pool PostgreSQL pour une base donnée.
 * @param {string} dbName - Nom de la base de données PostgreSQL à utiliser.
 * @returns {Pool} Instance du pool PostgreSQL.
 */
export function getPoolFor(dbName) {
  if (!dbName) {
    throw new Error("Must give a DB name");
  }

  if (getCurrentDBName() === dbName && currentPool) {
    return currentPool;
  }

  if (currentPool) {
    currentPool.end().catch(console.error);
  }

  setCurrentDBName(dbName);
  currentPool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: dbName,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
  });

  return currentPool;
}

/**
 * Fournit le pool actuel si une base a déjà été sélectionnée.
 * @returns {Pool|null}
 */
export function getCurrentPool() {
  return currentPool;
}

/**
 * Réinitialise le pool actif (à appeler en cas de déconnexion/changement de base).
 */
export async function resetPool() {
  if (currentPool) {
    await currentPool.end().catch(console.error);
    currentPool = null;
    setCurrentDBName(null);
  }
}
