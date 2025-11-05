"use strict";

import {
  loadInitialGraph,
} from "../core/loadSaveGraph.js";

import {
  connectToDb,
  setLocalDBName,
} from "../dbFront/tables.js";


import {
  showError,
} from "./dialog.js";

import { getLocalDBName } from "../dbFront/tables.js";
/*
  ----------------------------------menu for db access and files 
*/
export function menuDb(option, menuItemElement, whichClic = "left") {

  if (whichClic == "right") return;
  switch (option) {
    case "connectToDb":

alert("connectToDb");

      connectToDb(menuItemElement).catch((err) =>
        showError("connection failed: " + err.message)
      );
      break;

    case "loadFromDb":
      // avoid relaoding if already in place
      let savedDBName = getLocalDBName();
      setLocalDBName(null);

      connectToDb(menuItemElement)
        .then(() => {
          // if loaded the api had loaded dbName
          let dbName = getLocalDBName();

          if (dbName != null) {
            loadInitialGraph();
          } else {
            // no choice restore same if any
            setLocalDBName(savedDBName);
          }
        })
        .catch((err) => showError("loadFromDB: " + err.message));
      break;
  }
}
