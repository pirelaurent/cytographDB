// Copyright (C) 2025 pep-inno.com
// This file is part of CytographDB (https://github.com/pirelaurent/cytographdb)
//

"use strict";

import {
  getCy,
  initializeGraph,
  setAndRunLayoutOptions,
  metrologie,
  restoreProportionalSize,
  proportionalSizeNodeSizeByLinks,
} from "./cytoscapeCore.js";
import {
  enterFkSynthesisMode,
  saveDetailedEdges,
  getCurrentFKMode,
  setCurrentFKMode,
  enterFkDetailedMode,
} from "./detailedEdges.js";

import { showAlert, showError, showMultiChoiceDialog } from "../ui/dialog.js";

import { getLocalDBName, setLocalDBName } from "../dbFront/tables.js";

import { resetPositionStackUndo } from "./snapshots.js";

import {
  getCustomNodesCategories,
  restoreCustomNodesCategories,
} from "../filters/categories.js";

//---------------------
export function loadInitialGraph() {
  let dbName = getLocalDBName();
  if (!dbName) {
    showAlert("you must first connect a database.");
    return;
  }

  if (typeof cy !== "undefined" && cy) {
    getCy().elements().remove();
  }

  getCustomNodesCategories().clear();
  waitLoading("⏳ Analyzing DB --> create graph...");

  //document.getElementById("current-graph").textContent = "new graph from db ";
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
      resetPositionStackUndo();
      initializeGraph(data);
      // store details at load time /now generated with details
      saveDetailedEdges();
      enterFkSynthesisMode(true);

      hideWaitLoading();
      proportionalSizeNodeSizeByLinks();
      setAndRunLayoutOptions();

      getCy().fit();
      // traiter les données pour le graph, par ex : getCy().add(data)
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
  loadGraphNamed(filename);
}

/*
 load from a stored file on server (not yet used)
*/
function loadGraphNamed(filename) {
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
        cy = cytoscape({
          container: document.getElementById("cy"),
          ...graphState,
        });
        initializeGraph(null, true);
      }
      //document.getElementById("current-graph").textContent = filename;
      document.getElementById("graphName").value = filename;
      restoreProportionalSize();
      resetPositionStackUndo();

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
          loadGraphNamed(file);
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
  getCy()
    .elements()
    .forEach((ele) => {
      if (ele.style("display") === "none") {
        ele.data("hidden", true);
      } else {
        ele.removeData("hidden");
      }
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
 download and upload from local disk 

*/

export function saveGraphToFile() {
  let filenameInput = document.getElementById("graphName");
  let filename = filenameInput.value.trim();

  if (!filename) {
    showAlert("please, enter a file name.");
    return;
  }

  // Ajoute .json si manquant
  if (!filename.toLowerCase().endsWith(".json")) {
    filename += ".json";
  }

  getCy()
    .elements()
    .forEach((ele) => {
      if (ele.style("display") === "none") {
        ele.data("hidden", true);
      } else {
        ele.removeData("hidden");
      }
    });

  /*
   temporarily switch to detail mode to save graph
  */
  let wasFkMode = getCurrentFKMode();
  if (wasFkMode === "synthesis") {
    enterFkDetailedMode();
  }
  // then save graph
  const json = {
    ...getCy().json(),
    originalDBName: getLocalDBName(),
    currentFkMode: getCurrentFKMode(),
  };
  // if detailed for change but not on screen, restore
  if (wasFkMode === "synthesis") {
    enterFkSynthesisMode(true);
  }

  const blob = new Blob([JSON.stringify(json, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  // revision : keep graph name in box
  //document.getElementById("current-graph").textContent = filename;
  //filenameInput.value = "";
}

/*
 load file when user had choosen 
*/

export function loadGraphFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  //document.getElementById("current-graph").textContent = file.name;
  document.getElementById("graphName").value = file.name;

  const reader = new FileReader();
  reader.onload = function (e) {
    const json = JSON.parse(e.target.result);
    const originalDBName = json.originalDBName || null;

    const currentDBName = getLocalDBName();
    const message = `All details would not be available<br/> 
    <br/> if compatible DB is accessible:<br/> Use <i> connect to DB only</i> then reload the json file`;

    // if no db connected accept upload without question
    //if ((currentDBName != null) && (currentDBName != originalDBName)) {
    if (currentDBName != null && currentDBName != originalDBName) {
      {
        let original = originalDBName == null ? " not defined" : originalDBName;
        let current = currentDBName;

        showMultiChoiceDialog(
          ` <i>${file.name}</i> was created from <i>${original}</i>`,
          `is current <b>${current}</b> compatible ?`,
          [
            {
              label: "✅ Yes",
              onClick: () => {},
            },
            {
              label: "❌ No",
              onClick: () => {
                resetPoolFromFront();
                showAlert(`${message}`);
              },
            },
          ]
        );
      }
    }
    if (currentDBName === null) {
      showAlert(`no DB connected. ${message}`);
    }

    setCurrentFKMode(json.currentFkMode);

    // affiche, utilise, etc.
    const cyData = { ...json };
    delete cyData.originalDBName;
    getCy().json(cyData);
    restoreProportionalSize();
    resetPositionStackUndo();
    restoreCustomNodesCategories();

    // show in synthetic after saving details
    saveDetailedEdges();


    enterFkSynthesisMode(true);
    metrologie();
    //getCy().layout({ name: 'cose'}).run();
  };
  reader.readAsText(file);
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
 as originalDB was saved in downlod, must reset connection if wrong db in place 
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
