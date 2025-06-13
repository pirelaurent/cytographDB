"use strict";

import { cyStyles } from "./cyStyles.js";
import { createCustomProperties, getCustomStyles } from "./customProperties.js";

// global var
let postgresConnected = false;

export function setPostgresConnected() {
  postgresConnected = true;
}

//
export let cy;

/*
   used to question 'save y/n ' before changing of graph
   if nothing had changed, allow a new load without question.

*/
export let graphHasChanged = false;
export function setGraphHasChanged(value) {
  graphHasChanged = value;
}

/*
 snapshot connected to undo and ctrl Z
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

  //console.log("PLA: pushSnapshot:" + positionStackUndo.length);

  // limit to a max
  if (positionStackUndo.length > maxUndo) {
    positionStackUndo.shift();
  }
}

export function resetPositionStackUndo() {
  positionStackUndo = [];
}

/*
 restore a snapshot 
*/
export function popSnapshot() {
  if (positionStackUndo.length === 0) {
    return;
  }

  const snapshot = positionStackUndo.pop();
  if (!snapshot) {
    console.log("No snapshot — reset?");
    return;
  }
  //console.log("PLA: popSnapshot:" + positionStackUndo.length);

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

// pour ctrl grag

let ctrlPressed = false;
let previousSelection = null;

// default const OR_SELECTED = " or_selected";
export const AND_SELECTED = "AND";

export function modeSelect() {
  return document.getElementById("modeSelect").value;
}

const VISIBLE_PLAN = "visible_plan";
// default not used const ALL_PLANS = "allNodes";
// pour restreindre certaines opérations
export function restrictToVisible() {
  return document.getElementById("planSelect").value === VISIBLE_PLAN;
}

// to keep track of current DB
let localDBName = null;

export function setLocalDBName(aName) {
  localDBName = aName;
}
export function getLocalDBName() {
  return localDBName;
}

export let mergedStyles;
// autre layout importé depuis le html

export function main() {
  console.log("start of application. Create cy");
  // autre layout
  cytoscape.use(cytoscapeDagre);

  mergedStyles = cyStyles.concat(getCustomStyles());

  cy = cytoscape({
    container: document.getElementById("cy"),
    elements: [],
    style: mergedStyles,
    boxSelectionEnabled: true, // ✅ OBLIGATOIRE pour pouvoir draguer
    autounselectify: false, // ✅ Permet sélection multiple
    wheelSensitivity: 0.5, // Valeur par défaut = 1
  });
  document.getElementById("cy").style.backgroundColor = "white";

  //--------- set events'trap for cy

  cy.on("mouseover", "node", (evt) => evt.target.addClass("hovered"));

  cy.on("mouseout", "node", (evt) => evt.target.removeClass("hovered"));

  cy.on("mouseover", "node, edge", function (evt) {
    const hoverEnabled = document.getElementById("hoverInfoToggle").checked;
    if (!hoverEnabled) return;
    const ele = evt.target;
    const renderedPos = evt.renderedPosition;

    const panel = document.getElementById("info-panel");
    panel.style.left = renderedPos.x + 20 + "px";
    panel.style.top = renderedPos.y + 20 + "px";
    panel.style.display = "block";

    let output;
    if (ele.isNode()) {
      let node = ele;
      let classInfo = "";

      const classArray = Array.from(node.classes()).filter(
        (c) => c !== "hovered"
      );
      if (classArray.length > 0) {
        classInfo = `<small>[${classArray.join(", ")}]</small>`;
      }
      
   
      const data = node.data();

/*    can be added to hover for debug   
   let dataInfo = "";


      if (Object.keys(data).length > 0) {
        dataInfo = `
        <ul>
          ${Object.entries(data)
            .map(([key, value]) => `<li><small>${key}</small>: ${value}</li>`)
            .join("")}
        </ul>
  `;
      } */

      let incomers = node.incomers("edge").length;
      let outgoers = node.outgoers("edge").length;
      if (incomers == 0) incomers = " ";
      else incomers = " <- " + incomers;
      if (outgoers == 0) outgoers = " ";
      else outgoers = outgoers + " <- ";

      output = `${outgoers} ${data.id || ""} ${incomers}<br\>`;
      output = `${data.id || ""} <br\>`;
      output += `<small>${outgoers} □ ${incomers} </small><br\>`;


      if (classInfo) output += ` ${classInfo}<br/> `;
      // ${dataInfo}  can be added to hover for debug   

      if (node.data("hasTriggers")) {
        let nbTrigs = node.data("hasTriggers").length;
        if (nbTrigs > 0) {
          output += `<small>${nbTrigs} trigger(s)</small>`;
        }
      }
    } else {
      let edge = ele;
      const label = ele.data("label");
      const classList = edge.classes(); // c'est une cytoscape collection

      // Convertir en tableau de chaînes
      const classArray = Array.from(classList);
      let libelArray='';
      if( classArray.length>0) libelArray =`<br/>[${classArray.join(", ")}]`;

      output = ` 
   ${edge.source().id()} --> 
   ${edge.target().id()}
   <br/><small>
   (${label}) ${libelArray}
  </small>
   `;
      // debug  output+= Array.from(edge.classes()).join(' ');
    }
    document.getElementById("nodeDetails").innerHTML = output;
    //${node.data('category')} <br>
  });

  cy.on("mouseout", "node, edge", function () {
    document.getElementById("info-panel").style.display = "none";
  });

  // retrait du menu si on clic ailleurs
  cy.on("mouseover", "node", function () {
    clicNodeMenu.style.display = "none";
  });

  // surlignage en couleurs des liens entrants et sortants
  cy.on("mouseover", "node", function (evt) {
    const node = evt.target;
    // Réinitialise les styles
    cy.edges().removeClass("incoming outgoing dimmed");

    cy.nodes().addClass("faded");
    node.removeClass("faded");

    cy.edges().forEach((edge) => {
      if (edge.source().id() === node.id()) {
        edge.addClass("outgoing");
        edge.target().removeClass("faded");
      } else if (edge.target().id() === node.id()) {
        edge.addClass("incoming");
        edge.source().removeClass("faded");
      } else {
        edge.addClass("dimmed");
      }
    });
  });

  // set to front selected nodes
  cy.on("select", "node", function (evt) {
    const ele = evt.target;
    ele.style("z-index", Date.now());
  });

  // menu to continue action when a node is clicked
  const clicNodeMenu = document.getElementById("clicNodeMenu");

  // Masquer le menu si on clique ailleurs
  document.addEventListener("click", () => {
    clicNodeMenu.style.display = "none";
  });

  // undo et select all

  document.addEventListener("keydown", (e) => {
    if (!e.key || e.key === "Unidentified") return;
    if (e.key === "Control") {
      ctrlPressed = true;
    }

    const key = e.key.toLowerCase(); // gestion uniforme des majuscules/minuscules

    // ✅ Ctrl/⌘ + Z → Undo
    if ((e.ctrlKey || e.metaKey) && key === "z") {
      e.preventDefault();
      popSnapshot();
    }

    // ✅ Ctrl/⌘ + A → Select all nodes
    if ((e.ctrlKey || e.metaKey) && key === "a") {
      e.preventDefault();
      if (cy) {
        nodes.select();
        let nodes = restrictToVisible() ? cy.nodes(":visible") : cy.nodes();
      }
    }
  });
  // button undo 
  document.getElementById("undo-btn").addEventListener("click", () => {
  popSnapshot();
});

  document.addEventListener("keyup", (e) => {
    if (e.key === "Control") {
      ctrlPressed = false;
    }
  });

  // Affichage du menu contextuel sur clic droit
  let nodeForInfo = null;
  cy.on("cxttap", "node", function (evt) {
    nodeForInfo = evt.target;
    const renderedPos = evt.renderedPosition;
    // Obtenir la position du container Cytoscape dans la page
    const containerRect = cy.container().getBoundingClientRect();
    // Calculer la position réelle dans la fenêtre
    const x = containerRect.left + renderedPos.x;
    const y = containerRect.top + renderedPos.y;

    clicNodeMenu.style.left = `${x + 5}px`;
    clicNodeMenu.style.top = `${y - 5}px`;
    clicNodeMenu.style.display = "block";
  });

  document.getElementById("open-table").addEventListener("click", () => {
    openTable(nodeForInfo.id());
  });

  document.getElementById("open-trigger").addEventListener("click", () => {
    openTriggerPage(nodeForInfo);
  });

  cy.on("mouseout", "node", function () {
    {
      cy.edges().removeClass("incoming outgoing dimmed "); // internal ?
    }
    cy.nodes().removeClass("faded");
  });

  // show red when AND selection

  const select = document.getElementById("modeSelect");

  select.addEventListener("change", function () {
    if (select.value === "AND") {
      select.classList.add("red-select");
    } else {
      select.classList.remove("red-select");
    }
  });

  // Facultatif : appliquer au chargement si nécessaire
  if (select.value === "AND") {
    select.classList.add("red-select");
  }

  //--------------------  marquage d'un noeud sélectionné

  /*         NE PAS REFAIRE A LA MANO LAISSER CYTO
                    NO: cy.on("tap", "node", function (evt) {
                    car cet évènement arrive après le select natif
*/

  // trace selection
  cy.on("select unselect", "node", function () {
    metrologie();
  });

  cy.on("select unselect", "edge", function () {
    metrologie();
  });

  // clic hors éléments
  cy.on("tap", function (event) {
    if (event.target === cy) {
      cy.elements().unselect();
      cy.edges(":selected").removeClass("internal outgoing incoming");
    }  else if (event.target.isNode && event.target.isNode()) {
      pushSnapshot();
  } else if (event.target.isEdge && event.target.isEdge()) {
      pushSnapshot();
  }
  });

  // pouvoir déselectionner un rectangle en maintenant ctrl
  // difference is a cytomethod

  cy.on("boxstart", () => {
    pushSnapshot();
    if (ctrlPressed) {
      previousSelection = cy.elements(":selected"); // snapshot AVANT
      //console.log('boxstart '+previousSelection.length)
      previousSelection.unselect();
      previousSelection.forEach((elt) => elt.addClass("doubleSelect"));
      //console.log("Marqués doubleSelect:", previousSelection.length);
    }
  });

  /*
 several attempt to catch edge inside the select box. no good answers. 
*/
  cy.on("boxend", () => {
    if (ctrlPressed) {
      setTimeout(() => {
        const currentSelection = cy.elements(":selected");
        // add selection of
        const newlySelected = previousSelection.difference(currentSelection);

        currentSelection.unselect();
        newlySelected.select();
        cy.elements(".doubleSelect").removeClass("doubleSelect");
        //previousSelection.forEach((elt) => elt.removeClass("doubleSelect"));
        previousSelection = null;
      }, 0); // ⚡ 0 millisecondes suffit pour passer au cycle suivant
    }
  });
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
function openTable(tableId) {
  if (!postgresConnected) {
    alert("no connection to database. Connect first to the original DB");
    return;
  }
  //@todo checker qu'on a bien la bonne base ouverte avec checkCurrentDb
  checkCurrentDb();

  window.open(
    `/table.html?name=${tableId}&currentDBName=${localDBName}`,
    "TableDetails"
  );
}
/*
 verify a DB is connected 
 and diplay name on the top of screen

*/
function checkCurrentDb() {
  fetch("/current-db")
    .then((res) => {
      if (!res.ok) throw new Error("no database connected");
      return res.json();
    })
    .then((data) => {
      //alert("currently connected to : " + data.dbName);
      document.getElementById(
        "current-db"
      ).innerHTML = `<em>${data.dbName}</em>`;
    })
    .catch((err) => {
      alert("Erreur : " + err.message);
    });
}


function cytogaphdb_version(){

  fetch('/api/version')
    .then(response => response.json())
    .then(data => {
      const versionElement = document.getElementById('versionInfo');
      if (versionElement && data.version) {
        versionElement.textContent = `cytographdb V${data.version}`;
      } else {
        versionElement.textContent = 'unknown version';
      }
    })
    .catch(error => {
      console.error('Erreur de récupération de la version :', error);
      const versionElement = document.getElementById('versionInfo');
      if (versionElement) {
        versionElement.textContent = 'Erreur';
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
  let display = `Nodes&nbsp;&nbsp;<small>${selectedCountVisible}/${wholeVisible}&nbsp; (${selectedCountHidden}/${wholeHidden})</small>`;

  labelNodes.innerHTML = display;

  const labelEdges = document.querySelector("#EdgesId");
  display = `Edges&nbsp;&nbsp;&nbsp; <small>${selectedEdges}/${allEdges}&nbsp;</small>`;
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
  if (selectedNodes.length < 4) {
    alert("Warning: not enough nodes for layout (4 min). Verify your selection");
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
      rankDir: "LR",           // Left to Right
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
    const roots = selectedNodes.filter((n) =>
      n.incomers("edge").length === 0
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

  // customize nodes
  createCustomProperties();

  cy.once("layoutstop", () => {});

  //PLA : avoid layout when come from disk
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

function openTriggerPage(node) {
  const table = node.id();
  const url = `/triggers.html?table=${encodeURIComponent(table)}`;
  window.open(url, "triggers");
}

/*
  set size according to number of edges 
*/

export function restoreProportionalSize() {
  //console.log("restore  size");
  cy.nodes().forEach((node) => {
    const degree = node.data("degree");
    if (degree>=0) {
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