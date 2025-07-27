"uses strict"

import {
  getCy,
}
  from "../graph/cytoscapeCore.js";

import {
  promptDatabaseSelectionNear,
}
  from "../ui/dialog.js"


import { getCustomNodesCategories } from "../filters/categories.js";

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
    "TableDetails"
  );
}

/*
 fill in a visual page for triggers details
*/

export function openTriggerPage(node) {
  if (node.hasClass("hasTriggers")) {
    const table = node.id();
    const url = `/triggers.html?table=${encodeURIComponent(table)}`;
    window.open(url, "triggers");
  } else {
    showAlert("no triggers on this table.");
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

      setLocalDBName(dbName);

      document.getElementById(
        "current-db"
      ).innerHTML = `<small>&nbsp;connected to: </small> ${dbName}`;

      // clean current graph
      if (typeof getCy() !== 'undefined' && getCy()) {
        getCy().elements().remove();
      } else {
        showError("Graph not initialized");
      }
      getCustomNodesCategories().clear();
      return res.text(); // ou `return dbName` si tu veux
    });
  });
}

// about DB through postgres
let postgresConnected = false;
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
create special links from triggers .
Use recorded triggs into a node
call script analysis to get impacted tables 
*/

export async function generateTriggers() {
  const nodes = perimeterForAction();

  const nodesWithTriggers = nodes.filter((node) => {
    const trigs = node.data("triggers");

    return Array.isArray(trigs) && trigs.length > 0;
  });
  if (nodesWithTriggers.length == 0) {
    showAlert("no table with triggers in selection.");
    return;
  }
  //------------- get

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
      showAlert(`no trigger for table ${node.id()}.`);
      return;
    }

    data.triggers.forEach((t) => {
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

            edge.addClass("trigger_impact");

            edge.show();
            sourceNode.show();
            targetNode.show();
          }
        } else {
          console.warn(
            `Missing node(s) for trigger '${triggerName}' — skipping edge from '${source}' to '${target}'`
          );
        }
      });
    });

    getCy().style().update(); // forcer le style
  }
}