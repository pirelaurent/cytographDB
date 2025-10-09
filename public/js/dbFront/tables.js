"uses strict";

import { getCy } from "../graph/cytoscapeCore.js";

import {
  promptDatabaseSelectionNear,
  showError,
  showInfo,
  showAlert,
} from "../ui/dialog.js";

import { getCustomNodesCategories } from "../filters/categories.js";
import { resetSnapshot } from "../graph/snapshots.js";

import { warningOutputHtml,NativeCategories } from "../util/common.js";


/*
 as in a new page (and no session) dbname cannot be shared with main
 This info is furnished into the url 
*/
export function openTable(tableId) {
  if (!postgresConnected) {
    showError("no connection to database. Connect first to the original DB");
    return;
  }
  //@ todo checker qu'on a bien la bonne base ouverte avec getCurrent_db
  //WARNING async below bad code
  // @todo save db used with graoh, then compare at uload
  // checkWithCurrent_db();

  window.open(
    `/table.html?name=${tableId}&currentDBName=${localDBName}`,
    `TableDetails_${tableId}`
  );
}

/*
 fill in a visual page for triggers details
*/

export function openTriggerPage(node) {
  if (node.hasClass(NativeCategories.HAS_TRIGGERS)) {
    const table = node.id();
    const url = `/triggers.html?table=${encodeURIComponent(table)}`;
    window.open(url, "triggers");
  } else {
    showInfo("no triggers on this table.");
  }
}

/*
 connect to db with graph or only db 
*/
export function connectToDb(menuItemElement) {
  return promptDatabaseSelectionNear(menuItemElement).then((dbName) => {
    if (!dbName) {
      // no selection of db , not an error
      //return Promise.reject(new Error("No database selected"));
      return;
    }

    document.getElementById("current-db").innerHTML = "";

    return fetch("/connect-db", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dbName }),
    }).then((res) => {
      if (!res.ok) {
        showError("Connection failed to DB : " + dbName);
        throw new Error("Failed to connect to " + dbName);
      }
      // the dbName that is displayed
      setLocalDBName(dbName);

      document.getElementById(
        "current-db"
      ).innerHTML = `<small>&nbsp;connected to: </small><b> ${dbName}</b>`;

      // clean current graph
      if (typeof getCy() !== "undefined" && getCy()) {
        getCy().elements().remove();
        resetSnapshot();
        document.getElementById("graphName").value = "";
      } else {
        showError("Graph not initialized");
      }
      getCustomNodesCategories().clear();
      return res.text(); // ou `return dbName` si tu veux
    });
  });
}

/*
 used to try to reopen under the hood the stored DB name used by a saved Json 

*/

export async function connectToDbByNameWithoutLoading(dbName) {
  try {
    const res = await fetch("/connect-db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dbName }),
    });

    const body = await res.text();
    if (!res.ok) throw new Error(body || `HTTP ${res.status}`);
    document.getElementById(
      "current-db"
    ).innerHTML = `<small>&nbsp;connected to: </small> <b>${dbName}</b>`;

    return { ok: true, message: body };
  } catch (err) {
    return { ok: false, message: err.message || String(err) };
  }
}

// about DB through postgres
let postgresConnected = false;
// to set from several places
export function setPostgresConnected() {
  postgresConnected = true;
}
/*
 to keep track of current DB
*/
let localDBName = null;
/*
 the connected DB is known by server not navigator code
 One found through /current-db a local copy is kept here   

*/
export function setLocalDBName(aName) {
  localDBName = aName;
}
export function getLocalDBName() {
  return localDBName;
}

/*
 clean generated triggers impact edges 
*/
export function removeTriggers() {
  getCy().edges(".trigger_impact").remove();
}

/*
create special links from triggers .
Use recorded triggs into a node
call script analysis to get impacted tables 
Clean previous if any
*/

export async function generateTriggers(nodes) {
  const nodesWithTriggers = nodes.filter((node) => {
    const trigs = node.data("triggers");
    return Array.isArray(trigs) && trigs.length > 0;
  });

  if (nodesWithTriggers.length == 0) {
    showAlert("no table with triggers in selection.");
    return;
  }
  // clean if any

  removeTriggers();

  //------------- get

  let allWarnings = [];
  for (const aNode of nodesWithTriggers) {
    let table = aNode.id();
    let data;
    try {
      const response = await fetch(`/triggers?table=${table}`);
      data = await response.json();

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
    } catch (error) {
      console.error(`Error fetching triggers for table ${table}:`, error);
      showError("Database is not accessible. Please check your connection.");
      break; // on peut arrêter la boucle ici si ça ne sert à rien de continuer
    }
    if (!data || data.triggers.length === 0) {
      showAlert(`no trigger for table ${aNode.id()}.`);
      return;
    }

    data.triggers.forEach((t) => {
      // bring back internal errors on parsing sql
      if (t.warnings.length > 0) {
        allWarnings.push(...t.warnings);
      }
      const triggerName = t.name;
      const source = t.sourceTable || table; // à adapter si "table" est ailleurs
      const impactedTables = t.impactedTables || [];

      impactedTables.forEach((target) => {
        const edgeId = triggerName;

        const targetNode = getCy().getElementById(target);

        const sourceNode = getCy().getElementById(source);

        if (targetNode.nonempty() && sourceNode.nonempty()) {
          // Vérifie si l’arête existe déjà (via son ID)
          if (!getCy().getElementById(edgeId).nonempty()) {
            const edge = getCy().add({
              group: "edges",
              data: {
                id: edgeId,
                label: edgeId,
                source: source,
                target: target,
              },
            });

            edge.addClass(NativeCategories.TRIGGER_IMPACT);

            edge.show();
            sourceNode.show();
            targetNode.show();
          }
        } else {
          allWarnings.push({
            table: ` ${source}`,
            function: "trigger impact",
            warn: `missing impact destination :  --> ${target}`,
          });
        }
      });
    });

    getCy().style().update(); // forcer le style
  }

  if (allWarnings.length > 0) {
    showAlert(warningOutputHtml(allWarnings));
  }

  return true;
}
