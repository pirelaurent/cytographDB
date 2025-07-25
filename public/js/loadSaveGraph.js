// Copyright (C) 2025 Laurent P.
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
  cy,
  resetPositionStackUndo,
  metrologie,
  setPostgresConnected,
  setLocalDBName,
  getLocalDBName,
  initializeGraph,
  setAndRunLayoutOptions,
  restoreProportionalSize,
  customNodesCategories,
  showAlert,
  showError,
  showMultiChoiceDialog
} from "./main.js";

import { proportionalSizeNodeSizeByLinks } from "./menus.js";

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
      if (typeof cy !== 'undefined' && cy) {
        cy.elements().remove();
      } else {
        showError("Graph not initialized");
      }
      customNodesCategories.clear();
      return res.text(); // ou `return dbName` si tu veux
    });
  });
}

//---------------------
export function loadInitialGraph() {

  let dbName = getLocalDBName();
  if (!dbName) {
    showAlert("you must first connect a database.");
    return;
  }

  if (typeof cy !== 'undefined' && cy) {
    cy.elements().remove();
  }

  customNodesCategories.clear();

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

      hideWaitLoading();
      proportionalSizeNodeSizeByLinks();
      setAndRunLayoutOptions();

      cy.fit();
      // traiter les données pour le graph, par ex : cy.add(data)
    })
    .catch((err) => {
      showAlert(err);
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
    cy.elements().remove();
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
        cy.json(graphState); // Restore the graph state
        cy.elements().forEach((ele) => {
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
  cy.elements().forEach((ele) => {
    if (ele.style("display") === "none") {
      ele.data("hidden", true);
    } else {
      ele.removeData("hidden");
    }
  });

  const graphState = cy.json(); // Capture the current graph state

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
  nodes = cy.nodes(":selected:visible");
  if (nodes.length === 0) nodes = cy.nodes(":visible");
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
      <h2><button class="close-btn" title="Close" onclick="window.close()">✖</button> &nbsp; ${sortedNodes.length
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
  let edges = cy.edges(":selected:visible");
  if (edges.length === 0) edges = cy.edges(":visible");

  if (edges.length == 0) {
    showAlert("no selected edges to list.");
    return;
  }

  const sortedEdges = edges.sort((a, b) => {
    const labelA = a.data("label") || "";
    const labelB = b.data("label") || "";
    return labelA.localeCompare(labelB);
  });
  //const names = edges.map((n) => n.data("id")).sort();

  const win = window.open("", "edgeListWindow");
  let outputLines = "<ul>";

  sortedEdges.forEach((edge) => {
    const label = edge.data("label");

    //const classList = edge.classes(); // c'est une cytoscape collection
    // Convertir en tableau de chaînes
    //const classArray = Array.from(classList);
    //let libelArray='';
    //if( classArray.length>0) libelArray =`<br/>[${classArray.join(", ")}]`;
    //${libelArray}

    outputLines += ` 
         <li>
         ${label} 
      &nbsp;<small>:&nbsp;
      ${edge.source().id()} --> 
      ${edge.target().id()}
      </small> 
      </li>
      `;
  });
  outputLines += "</ul>";

  const html = `
    <html>
    <head><title>Edge List</title></head>
    <body>
      <h2>${edges.length} edges in current perimeter</h2>
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

  cy.elements().forEach((ele) => {
    if (ele.style("display") === "none") {
      ele.data("hidden", true);
    } else {
      ele.removeData("hidden");
    }
  });


  console.log('PLA: ' + getLocalDBName());
  const json = {
    ...cy.json(),
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


    console.log('PLA2:' + originalDBName);

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
    cy.json(cyData);
    restoreProportionalSize();
    resetPositionStackUndo();
    //cy.layout({ name: 'cose'}).run();
  };
  reader.readAsText(file);
}
/*
link to gui
*/
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("graphUpload");
  if (input) {
    input.addEventListener("change", loadGraphFromFile);
  }
});

/*
 create a window to choose a database
*/

function promptDatabaseSelectionNear(targetElement) {
  //console.log("[prompt] started");
  return new Promise(async (resolve) => {
    // console.log("[prompt] inside Promise");
    document.querySelectorAll(".db-prompt-box").forEach((e) => e.remove());

    const box = document.createElement("div");
    box.className = "db-prompt-box";

    const select = document.createElement("select");
    select.className = "db-prompt-select";
    const button = document.createElement("button");
    button.class = "db-prompt-box";
    button.textContent = "OK";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.class = "db-prompt-box";

    box.appendChild(select);
    box.appendChild(button);
    box.appendChild(cancelBtn);

    const container = document.querySelector(".db-box-container");
    container.innerHTML = ""; // nettoie les anciennes boîtes
    container.style.position = "relative";

    container.appendChild(box);

    // document.body.appendChild(box);

    // Position
    const rect = targetElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    box.style.left = `${rect.left - containerRect.left}px`;
    box.style.top = `${rect.bottom - containerRect.top}px`;

    try {
      const res = await fetch("/api/databases");
      const dbs = await res.json();

      dbs.forEach((name) => {
        // avoid interna default DB of postgres
        if (!(name == "postgres")) {
          const opt = document.createElement("option");
          opt.value = name;
          opt.textContent = name;
          select.appendChild(opt);
        }
      });
    } catch {
      showError("Error loading databases");
      box.remove();
      resolve(null);
      return;
    }
    setPostgresConnected();
    select.focus();

    const cleanup = () => {
      box.remove();
      document.removeEventListener("click", outsideClickHandler);
    };

    const submit = () => {
      const value = select.value;
      cleanup();
      resolve(value);
    };

    button.addEventListener("click", submit);
    select.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });

    cancelBtn.addEventListener("click", () => {
      cleanup();
      resolve(null);
    });

    function outsideClickHandler(e) {
      if (!box.contains(e.target) && !targetElement.contains(e.target)) {
        cleanup();
        resolve(null);
      }
    }

    document.addEventListener("click", outsideClickHandler);
  });
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