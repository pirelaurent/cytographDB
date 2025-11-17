

import {
  getCy,
  setCy,
} from "../graph/cytoscapeCore.js";

import {
  setAndRunLayoutOptions,
} from '../core/layout.js';

import { initializeGraph, } from "../core/initializeGraph.js";

import {
  restoreProportionalSize,
  setProportionalNodeSizeByLinks,
  adjustLabelsToCurrentSchemas
} from "../core/nodeOps.js";


import { metrologie } from '../core/metrology.js';


import {
  enterFkSynthesisMode,

  enterFkDetailedMode,
} from "../graph/detailedEdges.js";

import { showAlert, showError, showMultiChoiceDialog } from "../ui/dialog.js";

import { trace } from "../util/tracer.js";

import {
  getLocalDBName,
  setLocalDBName,
  connectToDbByNameWithoutLoading,
  setPostgresConnected,
} from "../dbFront/tables.js";

import { popSnapshot, pushSnapshot, resetSnapshot } from "../util/snapshots.js";

import {
  setNativeNodesCategories,
  getCustomNodesCategories,
  restoreCustomNodesCategories,
  enforceLabelToAlias,
} from "../filters/categories.js";

import { waitLoading,hideWaitLoading } from "../util/popupWait.js";

import { resetPoolFromFront } from "../dbFront/frontToDb.js";




/*
    Once connected to a DB, analyse model and create graph    
*/

export function loadInitialGraph() {

  trace?.("loadInitialGrapH");

  let dbName = getLocalDBName();
  if (!dbName) {
    showAlert("you must first connect a database.");
    return;
  }

  // reset existing
  if (typeof cy !== "undefined" && cy) {
    getCy().elements().remove();
  }

  getCustomNodesCategories().clear();
  resetSnapshot();
  waitLoading("⏳ Analyzing DB --> create graph...");
  document.getElementById("graphName").value = "draft";

  fetch("/load-from-db", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dbName }),
  })
    .then((res) => res.json())
    .then((data) => {

      initializeGraph(data);
      if (getCy().nodes().length == 0) {
        showAlert("Empty model");
        hideWaitLoading();
        return;
      }

      adjustLabelsToCurrentSchemas(data);

      // by default graph is in synthetic mode 
      
      setNativeNodesCategories();
      hideWaitLoading();

      setProportionalNodeSizeByLinks();
      setAndRunLayoutOptions();

      getCy().fit();
      // traiter les données pour le graph, par ex : getCy().add(data)
      metrologie();
    })
    .catch((err) => {
      showAlert(`load-from-db:${dbName} :` + err);
      hideWaitLoading();
    });
}


