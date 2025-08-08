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

import {
  getCy,
  initializeGraph,
  setAndRunLayoutOptions,
  metrologie,
  restoreProportionalSize,
  proportionalSizeNodeSizeByLinks,
} from "./cytoscapeCore.js"
import {
  enterFkSynthesisMode,
  saveDetailedEdges,
} from "./detailedEdges.js";

import {
  showAlert,
  showError,
  showMultiChoiceDialog
} from "../ui/dialog.js"

import {
  getLocalDBName,
}
  from "../dbFront/tables.js";

import {
  resetPositionStackUndo
} from "./snapshots.js";

import { getCustomNodesCategories } from "../filters/categories.js";
//---------------------
export function loadInitialGraph() {

  let dbName = getLocalDBName();
  if (!dbName) {
    showAlert("you must first connect a database.");
    return;
  }

  if (typeof cy !== 'undefined' && cy) {
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
      // preference show synthetic at startup
      enterFkSynthesisMode();

      hideWaitLoading();
      proportionalSizeNodeSizeByLinks();
      setAndRunLayoutOptions();

      getCy().fit();
      // traiter les données pour le graph, par ex : getCy().add(data)
    })
    .catch((err) => {
      showAlert("load-from-db:" + err);
      hideWaitLoading();
    });
}

//------------------
export function loadGraphState() {
  const filename = document.getElementById("graphName").value.trim();
  if (!filename) {
    showAlert("Please enter a filename in the 'Graph name' box.");
    return;
  }
  loadGraphNamed(filename);
}

//------------------
function loadGraphNamed(filename) {
  if (typeof cy !== 'undefined' && cy) {
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
        getCy().elements().forEach((ele) => {
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

      hideWaitLoading();
      metrologie();
    })
    .catch((error) => {
      showError(error);
      console.error("Error loading graph state:", error);
    });
}
/*
  fenêtre en superposition et affichage de la liste des fichiers
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
  getCy().elements().forEach((ele) => {
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
export function sendNodeListToHtml() {
  let nodes;
  // permimeter
  nodes = getCy().nodes(":selected:visible");
  if (nodes.length === 0) nodes = getCy().nodes(":visible");
  if (nodes.length == 0) {
    showAlert("no nodes to list in current perimeter. <br/> Check your selection. ");
    return;
  }

  const sortedNodes = nodes.sort((a, b) => {
    const labelA = a.data("label") || "";
    const labelB = b.data("label") || "";
    return labelA.localeCompare(labelB);
  });
  const html = `
    <html>
    <head><title>Node List</title></head>
    <body>
      <h2><button class="close-btn" title="Close" onclick="window.close()">x</button> &nbsp; ${sortedNodes.length
    } nodes in current perimeter</h2>
      <ul>
        ${sortedNodes.map((node) => `<li>${node.data('label')}</li>`).join("")}
      </ul>
    </body>
    </html>
  `;
  const win = window.open("", "nodeListWindow");
  // win.document.write(html);
  win.document.body.innerHTML = html;
  win.document.close();

}

/*
 generate list of nodes label on a new html page 
*/
export function sendEdgeListToHtml() {
  let edges = getCy().edges(":selected:visible");
  if (edges.length === 0) edges = getCy().edges(":visible");

  if (edges.length == 0) {
    showAlert("no selected edges to list.");
    return;
  }

  const sortedEdges = edges.sort((a, b) => {
    let labelA = ` 
      ${a.source().id()} --> 
      ${a.target().id()}
      \n ${a.data("label")}
      `
    if (a.hasClass('fk_detailed')) labelA += '\n'+a.data('columnsLabel');

   let labelB = ` 
      ${b.source().id()} --> 
      ${b.target().id()}
      \n ${b.data("label")}
      `
    if (b.hasClass('fk_detailed')) labelB += '\n'+b.data('columnsLabel');
    return labelA.localeCompare(labelB);
  });

  const win = window.open("", "edgeListWindow");
  let outputLines = "<ul>";
  let lastSourceTarget = '';
  let lastFKLabel='';

  sortedEdges.forEach((edge) => {
    let sourceTarget = ` 
      ${edge.source().id()} --> 
      ${edge.target().id()}
      `
    if (lastSourceTarget != sourceTarget) {
      outputLines += `<strong>${sourceTarget}</strong><br/>`;
      lastSourceTarget = sourceTarget;
    }

    if( lastFKLabel != edge.data("label")){
      outputLines += `&nbsp; ${edge.data("label")}<br/>`;
      lastFKLabel = edge.data("label");
    }

if (edge.hasClass('fk_detailed')){
 outputLines += `&nbsp;&nbsp;&nbsp;- ${edge.data('columnsLabel')}<br/>`;
}

   
      
     
      
  });

  outputLines += "</ul>";
  //console.log(outputLines);//PLA
  const html = `
    <html>
    <head><title>Edge List</title></head>
    <body>
      <h2>${edges.length} edges <small>(in current perimeter)</small></h2>
       ${outputLines}
    </body>
    </html>
  `;
  // ${edges.map((name) => `<li>${name}</li>`).join("")}
  // win.document.write(html);
  win.document.body.innerHTML = html;
  win.document.close();
}

/*

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

  getCy().elements().forEach((ele) => {
    if (ele.style("display") === "none") {
      ele.data("hidden", true);
    } else {
      ele.removeData("hidden");
    }
  });



  const json = {
    ...getCy().json(),
    originalDBName: getLocalDBName()
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
    // if no db connected accept upload without question 
    if ((currentDBName != null) && (currentDBName != originalDBName)) {

      {
        let original = originalDBName == null ? ' not defined' : originalDBName;
        let current = currentDBName;

        showMultiChoiceDialog(` <i>${file.name}</i> was done with DB:<br/>${original}`, `is <b>${current}</b> compatible ?`, [
          {
            label: "✅ Yes",
            onClick: () => { }
          },
          {
            label: "❌ No",
            onClick: () => {
              resetPoolFromFront()
              showAlert('Some details from database could not be retrieved<br/> <br/>Try selecting <i>DB: connect to DB only</i> then reload')
            }
          },
        ]);
      }
    }


    // affiche, utilise, etc.
    const cyData = { ...json };
    delete cyData.originalDBName;
    getCy().json(cyData);
    restoreProportionalSize();
    resetPositionStackUndo();
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
  const response = await fetch('/api/reset-pool', {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error("Échec du reset pool");
  }
  return response.json();
}