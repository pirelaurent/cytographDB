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

import { cyStyles } from "./cyStyles.js";
import { createCustomCategories, getCustomStyles } from "./customCategories.js";
import "./customModulesIndex.js";
import "./interceptors.js";
import "./loadSaveGraph.js";
import "./menus.js";
import "./selectors.js";

import { fillInGuiNodesCustomCategories } from "./selectors.js";
import { setInterceptors } from "./interceptors.js";
// global vars
export let cy;
// about DB through postgres
let postgresConnected = false;
export function setPostgresConnected() {
  postgresConnected = true;
}
/*
 to keep track of current DB
*/
let localDBName = null;

export function setLocalDBName(aName) {
  localDBName = aName;
}
export function getLocalDBName() {
  return localDBName;
}

/*
   used to question 'save y/n ' before changing of graph
   if nothing had changed, allow a new load without question.
*/
export let graphHasChanged = false;
export function setGraphHasChanged(value) {
  graphHasChanged = value;
}

/*
 snapshot(s) connected to undo and ctrl Z
*/

export let positionStackUndo = [];
const maxUndo = 20;
export function resetSnapshot() {
  positionStackUndo = [];
}

export function pushSnapshot() {
  if (!cy) return;

  const json = cy.json();
  const selectedIds = cy.elements(":selected").map((ele) => ele.id());
  const hiddenIds = cy.elements(":hidden").map((ele) => ele.id());

  let snapshot = {
    json,
    selectedIds,
    hiddenIds,
  };

  // Ajouter en haut de la pile
  positionStackUndo.push(snapshot);

  // limit to a max
  if (positionStackUndo.length > maxUndo) {
    positionStackUndo.shift();
  }
}
export function resetPositionStackUndo() {
  positionStackUndo = [];
}

export function popSnapshot() {
  if (positionStackUndo.length === 0) {
    return;
  }

  const snapshot = positionStackUndo.pop();
  if (!snapshot) {
    console.log("No snapshot — reset?");
    return;
  }

  cy.elements().remove();
  cy.json(snapshot.json);

  cy.elements().unselect();
  snapshot.selectedIds.forEach((id) => {
    const el = cy.getElementById(id);
    el.select();
  });
  cy.elements().removeClass("faded");
  cy.elements().show(); // réinitialise tout
  snapshot.hiddenIds.forEach((id) => cy.getElementById(id).hide());

  restoreProportionalSize();

  //cy.fit(); // optionnel, pour bien voir le résultat
}

/*
 pour ctrl grag
*/

// default const OR_SELECTED = " or_selected";
export const AND_SELECTED = "AND";

export function modeSelect() {
  return document.getElementById("modeSelect").value;
}

const VISIBLE_PLAN = "visible_plan";
// default not used const ALL_PLANS = "allNodes";
// enforce visible and remove acts on in gui 
export function restrictToVisible() {
  //return document.getElementById("planSelect").value === VISIBLE_PLAN;
  return true;
}

export let mergedStyles;
// autre layout importé depuis le html

export function main() {
  console.log("start of application. Create cy");
  // autre layout
  cytoscape.use(cytoscapeDagre);
  cy = cytoscape({
    container: document.getElementById("cy"),
    elements: [],
    boxSelectionEnabled: true, // ✅ OBLIGATOIRE pour pouvoir draguer
    autounselectify: false, // ✅ Permet sélection multiple
    wheelSensitivity: 0.5, // Valeur par défaut = 1
  });

  setInterceptors();

  cytogaphdb_version();
} // main
/*
 run main once dom is loaded 
*/
document.addEventListener("DOMContentLoaded", main);

/*
 as in a new page (and no session) dbname cannot be shared with main
 This info is furnished into the url 
*/
export function openTable(tableId) {
  if (!postgresConnected) {
    alert("no connection to database. Connect first to the original DB");
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
 verify a DB is connected 
 and diplay name on the top of screen


function getCurrent_db() {
  // the name is on server. Bring back to nav code
  fetch("/current-db")
    .then((res) => {
      if (!res.ok) throw new Error("no database connected");
      return res.json();
    })
    .then((data) => {
      let current_db = data.dbName;
      //alert("currently connected to : " + data.dbName);
      document.getElementById(
        "current-db"
      ).innerHTML = ` DB:<em>${current_db}</em>`;
    })
    .catch((err) => {
      alert("Erreur : " + err.message);
    });
}
*/
function cytogaphdb_version() {
  fetch("/api/version")
    .then((response) => response.json())
    .then((data) => {
      const versionElement = document.getElementById("versionInfo");
      if (versionElement && data.version) {
        versionElement.textContent = `cytographdb V${data.version}`;
      } else {
        versionElement.textContent = "unknown version";
      }
    })
    .catch((error) => {
      console.error("Erreur de récupération de la version :", error);
      const versionElement = document.getElementById("versionInfo");
      if (versionElement) {
        versionElement.textContent = "Erreur";
      }
    });
}

//------------- display counts ------------
export function metrologie() {
  //display some measures

  const wholeVisible = cy.nodes(":visible").length;

  const selectedCountVisible = cy.nodes(":selected:visible").length;
  const wholeHidden = cy.nodes(":hidden").length;
  const selectedCountHidden = cy.nodes(":selected:hidden").length;

  const allEdges = cy.edges().length;
  const selectedEdges = cy.edges(":selected:visible").length;

  const labelNodes = document.querySelector("#NodesId");

  //  const whole = cy.nodes().length;
  //let display = `Nodes : ${whole}&nbsp;&nbsp;[`;
  //display += `${selectedCountVisible}:${wholeVisible}]&nbsp; (${selectedCountHidden}:${wholeHidden})`;

  /*
 to obective the perimeter : enhance the number 
 if select = 0 : small font and big font for total  
 else select big , total small 
 */

  let big = '<span class = "bigPerim">';
  let small = '<span class = "smallPerim">';
  let display = "";

  if (selectedCountVisible > 0) {
    display += `Nodes&nbsp;&nbsp;${big}${selectedCountVisible}/</span> ${small}${wholeVisible}</span>`;
  } else {
    display += `Nodes&nbsp;&nbsp;${small}${selectedCountVisible}/</span> ${big}${wholeVisible}</span>`;
  }

  // hidden
  let dispHidden = `&nbsp;&nbsp;&nbsp; ${small}(${selectedCountHidden}/</span>${small}${wholeHidden})</span>`;
  if (!restrictToVisible()) {
    if (selectedCountHidden > 0) {
      dispHidden = `&nbsp; ${big}(${selectedCountHidden}/</span>${small}${wholeHidden})</span>`;
    } else {
      dispHidden = `&nbsp; ${small}(${selectedCountHidden}/</span>${big}${wholeHidden})</span>`;
    }
  }
  display += dispHidden;
  labelNodes.innerHTML = display;

  // ------------ edges info

  display= "Edges &nbsp;";
  const labelEdges = document.querySelector("#EdgesId");
 if(selectedEdges != 0){
  display += `&nbsp;${big} ${selectedEdges}/</span>${small}${allEdges}</span>`
 } else {
    display += `&nbsp;${small} ${selectedEdges}/</span>${big}${allEdges}</span>`
 }


   labelEdges.innerHTML = display;

  /* const labelDelete = document.querySelector(
    '[data-menu-id="menu-nodes"] [data-category="delete"] .menu-delete'
  );
  if (labelDelete) {
    let nbDel = cy.nodes(":selected:visible").length;
    display = "delete ";
    if (nbDel != 0) display += `${nbDel} nodes`;
    labelDelete.textContent = display;
  } */
}

//----------- some layouts parameters

export function setAndRunLayoutOptions(option) {
  let layoutName = option ?? "cose-bilkent";
  // choix du périmètre

  let selectedNodes = perimeterForAction();
  if (selectedNodes.length < 3) {
    alert(
      "Warning: not enough nodes for layout (3 min). Verify your selection"
    );
    return;
  }
  // add edges to selection to see them after reord
  const connectedEdges = selectedNodes
    .connectedEdges()
    .filter(
      (edge) =>
        selectedNodes.contains(edge.source()) &&
        selectedNodes.contains(edge.target())
    );

  const selection = selectedNodes.union(connectedEdges);

  //console.log("setAndRunLayoutOptions:" + layoutName);
  //common
  let layoutOptions = {
    name: layoutName,
    animate: true,
    nodeDimensionsIncludeLabels: true,
    fit: true,
  };

  switch (layoutName) {
    case "dagre":
      Object.assign(layoutOptions, {
        rankDir: "LR", // Left to Right
        nodeSep: 50,
        edgeSep: 10,
        rankSep: 100,
        numIter: 1000,
      });
      break;

    case "cose":
      Object.assign(layoutOptions, {
        nodeRepulsion: 1000000,
        gravity: 10,
        // idealEdgeLength: 100,
        // edgeElasticity: 0.4,
        // numIter: 1000,
      });
      break;

    case "cose-bilkent":
      Object.assign(layoutOptions, {
        name: "cose-bilkent", // redéclaré explicitement si nécessaire
        nodeRepulsion: 1000000,
        idealEdgeLength: 160,
        edgeElasticity: 0.1,
        gravity: 0.25,
        numIter: 1000,
      });
      break;

    case "circle":
      Object.assign(layoutOptions, {
        avoidOverlap: true,
        padding: 30,
        numIter: 1000,
      });
      break;

    case "breadthfirst":
      const roots = selectedNodes.filter(
        (n) => n.incomers("edge").length === 0
      );
      Object.assign(layoutOptions, {
        orientation: "horizontal",
        directed: true,
        spacingFactor: 0.7,
        roots: roots,
      });
      break;

    case "elk":
      Object.assign(layoutOptions, {
        algorithm: "layered",
        direction: "RIGHT",
        spacing: 50,
        nodePlacement: "BRANDES_KOEPF",
      });
      break;
  }

  selection.layout(layoutOptions).run();
  cy.fit();
}

//-------------------
export function initializeGraph(data, fromDisk = false) {
  // cy a été créé avec des data vides , mais si on s'en est servi, faut nettoyer
  cy.elements().remove();
  cy.add(data);



  let current_db = getLocalDBName();

  // customize nodes // PLA a relayer coté front : getXurrentDBName

  createCustomCategories(current_db); // PLQ

  let moreStyles = getCustomStyles(current_db);
  //console.log(JSON.stringify(moreStyles));
  let mergedStyles = cyStyles.concat(moreStyles);
  cy.style(mergedStyles).update();

  fillInGuiNodesCustomCategories();

  cy.once("layoutstop", () => {});

  //avoid layout when come from disk
  if (!fromDisk) {
    setAndRunLayoutOptions();
  }
  metrologie();
}

/*
 fix the perimer of actions
 if selection : acts on selection
 otherwise acts on all nodes eventually visible only 
*/
export function perimeterForAction() {
  let nodes;

  if (restrictToVisible()) {
    nodes = cy.nodes(":selected:visible");
    if (nodes.length == 0) nodes = cy.nodes(":visible");
  } else {
    nodes = cy.nodes(":selected");
    if (nodes.length == 0) nodes = cy.nodes();
  }
  return nodes;
}

/*
 acess mode regarding options in menus 
*/

export function perimeterForSelect() {
  // if restrict take visible otherwise take whole graph

  let nodes = restrictToVisible() ? cy.nodes(":visible") : cy.nodes();
  // sinon on ne retient que les selectionnés parmi le premier lot
  if (modeSelect() == AND_SELECTED)
    nodes = nodes.intersect(cy.nodes(":selected"));

  if (nodes.length == 0) {
    let msg = "Nothing to filter";
    msg += "\ncheck options : \n- play on visible:" + restrictToVisible();
    msg += "\n-select mode :" + modeSelect();
    alert(msg);
    return null;
  }
  // retour de la sélection
  return nodes;
}

/*
 fill in a visual page for triggers details
*/

export function openTriggerPage(node) {
  const categories = node.data("nativeCategories");
  if (Array.isArray(categories) && categories.includes("hasTriggers")) {
    const table = node.id();
    const url = `/triggers.html?table=${encodeURIComponent(table)}`;
    window.open(url, "triggers");
  } else {
    alert("no triggers on this node");
  }
}

/*
  set size according to number of edges 
*/

export function restoreProportionalSize() {
  //console.log("restore  size");
  cy.nodes().forEach((node) => {
    const degree = node.data("degree");
    if (degree >= 0) {
      const size = mapValue(degree, 1, 40, 20, 100);
      node.style({ width: size, height: size });
    }
  });
}
// Helper pour interpoler une valeur entre deux bornes
export function mapValue(value, inMin, inMax, outMin, outMax) {
  const clamped = Math.max(inMin, Math.min(value, inMax));
  const ratio = (clamped - inMin) / (inMax - inMin);
  return outMin + ratio * (outMax - outMin);
}

/*
 add a set of entries [ a,b,c] into nativeProperties 
 at this day, add native to index.html to see the option
*/

export function addNativeCategories(element, props) {
  const current = element.data("nativeCategories") || [];
  const merged = Array.from(new Set([...current, ...props]));
  element.data("nativeCategories", merged);
}
