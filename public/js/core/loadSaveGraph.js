// Copyright (C) 2025 pep-inno.com
// This file is part of CytographDB (https://github.com/pirelaurent/cytographdb)
//

"use strict";

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
  saveOriginalEdges,
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

/*
    Once connected to a DB, analyse model and create graph    
*/
export function loadInitialGraph() {

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

      // store details at load time /now generated with details
      // by defaukt graph is in synthetic mode 
      saveOriginalEdges();
 
  


      // moved after reduction to 1 edge per fk
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

/*
 check filename in the box
*/
export function loadGraphState() {
  const filename = document.getElementById("graphName").value.trim();
  if (!filename) {
    showAlert("Please enter a filename in the 'Graph name' box.");
    return;
  }
  loadGraphNamedFromServer(filename);
}

/*
 load from a stored file on server (not yet used)
*/
function loadGraphNamedFromServer(filename) {
  if (typeof cy !== "undefined" && cy) {
    getCy().elements().remove();
  }
  waitLoading("⏳ Loading saved graph");

  //document.getElementById("current-graph").textContent = "";

  fetch(`/load-graph/${filename}`)
    .then((res) => {
      if (!res.ok) {
        hideWaitLoading();
        if (res.status === 404) {
          throw new Error("file-not-found");
        }
        throw new Error("fetch-failed");
      }
      return res.json();
    })
    .then((graphState) => {
      if (cy) {
        getCy().json(graphState); // Restore the graph state
        getCy()
          .elements()
          .forEach((ele) => {
            if (ele.data("hidden")) {
              ele.style("display", "none");
            } else {
              ele.removeStyle("display");
            }
          });
      } else {
        setCy(
          cytoscape({
            container: document.getElementById("cy"),
            ...graphState,
          })
        );
        initializeGraph(null, true);
        metrologie();
      }
      //document.getElementById("current-graph").textContent = filename;
      document.getElementById("graphName").value = filename;
      restoreProportionalSize();
      resetSnapshot();

      restoreCustomNodesCategories();

      hideWaitLoading();
      metrologie();
    })
    .catch((error) => {
      showError(error);
      console.error("Error loading graph state:", error);
    });
}
/*
 window on top to choose un the list of availbale files on server
*/
export function showOverlayWithFiles() {
  fetch("/list-saves")
    .then((res) => res.json())
    .then((files) => {
      const list = document.getElementById("files");
      list.innerHTML = "";
      files.forEach((file) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#";
        a.textContent = file;
        a.onclick = () => {
          document.getElementById("overlay").style.display = "none";
          loadGraphNamedFromServer(file);
        };
        li.appendChild(a);
        list.appendChild(li);
      });
      document.getElementById("overlay").style.display = "block";
    })
    .catch((err) => {
      showError("Error while loading saved file");
      console.error(err);
    });
}

export function saveGraphState() {
  const filename = document.getElementById("graphName").value.trim();
  if (!filename) {
    showAlert("Please enter a filename.");
    return;
  }
  if (!cy) {
    showAlert("No graph to save.");
    return;
  }

  fetch(`/check-file?filename=${encodeURIComponent(filename)}`)
    .then((response) => response.json())
    .then(({ exists }) => {
      if (exists) {
        const confirmOverwrite = confirm(
          `The file "${filename}" already exists. Overwrite?`
        );
        if (!confirmOverwrite) return;

        // Continuer vers la sauvegarde
        sendGraphState(filename);
      } else {
        sendGraphState(filename);
      }
      document.getElementById("graphName").value = "";
    })
    .catch((err) => {
      console.error("Error checking file:", err);
    });
}

/*
 store a grph on file 
*/

function sendGraphState(filename) {
  // preserve hidden status
  const cy = getCy();

  cy.batch(() => {
    cy.$(':hidden').data('hidden', true);     // copy hidden dans une data
    cy.$(':visible').removeData('hidden');    // remove on visible if any
  });

  const graphState = getCy().json(); // Capture the current graph state

  fetch("/save-graph", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filename, data: graphState }),
  })
    .then((response) => {
      if (response.ok) {
        showAlert(`graph "${filename}" saved successfully.`);
        //document.getElementById("current-graph").textContent = filename;
        document.getElementById("graphName").value = filename;
      } else {
        showError("Failed to save graph state.");
      }
    })
    .catch((error) => {
      console.error("Error saving graph state:", error);
    });
}
/*
 generate list of nodes label on a new html page 
*/

/*
 download and upload JSON from local disk 

*/

export function saveGraphToFile() {
  let filenameInput = document.getElementById("graphName");
  let filename = filenameInput.value.trim();

  if (!filename) {
    showAlert("please, enter a file name.");
    return;
  }

  // add extension .json if none
  if (!filename.toLowerCase().endsWith(".json")) {
    filename += ".json";
  }

  let cy = getCy();
  // cytoscape don't store visible/hide in json. Set an explicit data for further upload
  cy.batch(() => {
    cy.elements().forEach((ele) => {
      if (ele.hidden()) ele.data("hidden", true);
      else ele.removeData("hidden");
    });
  });

  /*
   temporarily switch to detail mode to save graph with full info
  */

  pushSnapshot("saveGraphToFile");

  enterFkDetailedMode(true);
  // then save graph on file
  const json = {
    ...getCy().json(),
    originalDBName: getLocalDBName(),
  };

  const blob = new Blob([JSON.stringify(json, null, 2)], {
    type: "application/json",
  });

  popSnapshot("saveGraphToFile-exit");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  // restore
  //enterFkSynthesisMode(true);
}

/*

 load file when user had chosen an element from navigator to upload 
*/

export function loadGraphFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  trace?.(`loadGraphFromFile: ${file.name}`);
  // GUI position show asked graphname
  document.getElementById("graphName").value = file.name;

  const reader = new FileReader();
  let json;

  reader.onload = function (e) {
    json = JSON.parse(e.target.result);
    const originalDBName = json.originalDBName || null;
    let currentDBName = getLocalDBName();

    trace?.(`original: ${originalDBName} current: ${currentDBName}`);

    // same DB as the current one : ok continue

    if (originalDBName && originalDBName === currentDBName) {
      trace?.(`case same DB: ${currentDBName}`);
      createGraphFromJson(json);
      return;
    }

    // not the same , try to open the right one from json

    if (originalDBName) {
      connectToDbByNameWithoutLoading(originalDBName).then((result) => {
        // ok to connect right DB
        if (result.ok) {
          trace?.(`DB found and connected : ${originalDBName}`);
          setPostgresConnected();
          setLocalDBName(originalDBName);
          createGraphFromJson(json);
          return;
        }
        // either no original db name, either cannot be able to connect to original
        // try compatible
        else {
          showAlert(
            `unable to connect <b>${originalDBName}</b><br/>` +
            `Details: ${result.message}`
          );
          // try to connect had failed
          if (currentDBName != null) {
            {
              let original =
                originalDBName == null ? " not defined" : originalDBName;
              let current = currentDBName;

              showMultiChoiceDialog(
                ` <i>${file.name}</i> was created from <i>${original}</i>`,
                `is current <b>${current}</b> compatible ?`,
                [
                  {
                    label: "✅ Yes",
                    onClick: () => {
                      // must reconnect as try to connect had failed
                      connectToDbByNameWithoutLoading(currentDBName).then(
                        (result) => {
                          if (result.ok) {
                            trace?.(
                              `DB not found: ${originalDBName} Current reconnected : ${currentDBName}`
                            );
                            setPostgresConnected();
                            setLocalDBName(currentDBName);
                            createGraphFromJson(json);
                          } else {
                            showAlert(
                              `unable to connect <b>${currentDBName}</b><br/>` +
                              `Details: ${result.message}`
                            );
                          }
                        }
                      );
                    },
                  },
                  {
                    label: "❌ No",
                    onClick: () => {
                      resetPoolFromFront();
                      trace?.("not compatible. refused  ");
                      showAlert(
                        `All details would not be available as no DB is connected<br/>`
                      );
                      createGraphFromJson(json);
                    },
                  },
                ]
              );
            }
          }
        }
      });
    } else {
      showAlert("The json has no information on its original DB");
      createGraphFromJson(json);
    }
  };
  reader.readAsText(file);
}

function createGraphFromJson(json) {
  const cyData = { ...json };

  let cy = getCy();

  cy.json(cyData);

  cy.batch(() => {
    cy.elements("[hidden]").hide(); // data(hidden)=true → hide()
    cy.elements().not("[hidden]").show(); // le reste → show()
  });

  restoreProportionalSize();
  resetSnapshot();
  restoreCustomNodesCategories();
  setNativeNodesCategories(); // redo categories due to leaf/root change

  enforceLabelToAlias(cyData.originalDBName); // despite alias could have been saved in new



  // show in synthetic after saving details
  saveOriginalEdges();
  //PLA no more 
  enterFkSynthesisMode(true);
  /*

ne change pas les roots et leaf malgré le change dans les classes

cy.style().clear();
  let moreStyles = getCustomStyles(getLocalDBName());
  cy.style().fromJson(getCyStyles());
cy.nodes().forEach(node => {
  node.style(); // forces style recalculation on that node
});
*/
  delete cyData.originalDBName;
  metrologie();
  cy.fit();
  //getCy().layout({ name: 'cose'}).run();
}

/*
link to gui
*/
export function linkToUi() {
  const input = document.getElementById("graphUpload");
  if (input) {
    input.addEventListener("change", loadGraphFromFile);
  } else {
    console.warn("graphUpload input not found");
  }
}

function waitLoading(message) {
  document.getElementById("waitLoading").style.display = "block";
  document.getElementById("waitLoading").innerHTML = message;
}

function hideWaitLoading() {
  document.getElementById("waitLoading").style.display = "none";
}

/*
 as originalDB was saved in download, must reset connection if wrong db in place 
*/

export async function resetPoolFromFront() {
  const response = await fetch("/api/reset-pool", {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Échec du reset pool");
  }
  setLocalDBName(null);
  document.getElementById("current-db").innerHTML = "";
  return response.json();
}


// --- Fonction de classification ---
export function classifyForeignKey(fk) {
  const required = fk.all_source_not_null === true;
  const identifying = fk.source_columns.every(col =>
    fk.source_table_pk_columns?.includes(col)
  );
  const deleteRule = fk.delete_rule?.toUpperCase() || '';

  if (identifying && required && deleteRule === 'CASCADE') {
    return 'composition';
  } else if (required && !identifying) {
    return 'association';
  } else {
    return 'simple_link';
  }
}