"uses strict"

import {
  getCy,
}
  from "../graph/cytoscapeCore.js";

import {
  promptDatabaseSelectionNear,
}
  from "../ui/dialog.js"


import { getCustomNodesCategories } from "../custom/customCategories.js";

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