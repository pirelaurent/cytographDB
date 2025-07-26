"use strict";

import { getCyStyles } from "./cyStyles.js";
import { showAlert } from "../ui/dialog.js";

/*
 cy defined in a module cannot be accessed directly
*/
let cy;
export function setCy(instance) {
  cy = instance;
}
export function getCy() {
  return cy;
}
import { modeSelect,AND_SELECTED} from "../ui/dialog.js";

import {
  getLocalDBName
} from "../dbFront/tables.js"

import {
  createNativeNodesCategories,
  createCustomCategories,
  getCustomStyles,

} from "../custom/customCategories.js";

import { fillInGuiNodesCustomCategories } from "../ui/custom.js";
//-------------------
export function initializeGraph(data, fromDisk = false) {
  // cy a été créé avec des data vides , mais si on s'en est servi, faut nettoyer
  if (typeof cy !== 'undefined' && cy) {
    cy.elements().remove();
  }
  cy.add(data);

  let current_db = getLocalDBName();

  // customize nodes
  createNativeNodesCategories();

  createCustomCategories(current_db); 
  let moreStyles = getCustomStyles(current_db);
  //console.log(JSON.stringify(moreStyles));
  let mergedStyles = getCyStyles().concat(moreStyles);
  cy.style(mergedStyles).update();

 fillInGuiNodesCustomCategories();

  cy.once("layoutstop", () => { });

  //avoid layout when come from disk
  if (!fromDisk) {
    setAndRunLayoutOptions();
  }
  metrologie();
}

/*
 leaved to true to simplify. Could be set through a gui option. 
*/
export function restrictToVisible() {
  return true;
}

//----------- some layouts parameters

export function setAndRunLayoutOptions(option) {
  let layoutName = option ?? "cose-bilkent";
  // choix du périmètre

  let selectedNodes = perimeterForAction();
  if (selectedNodes.length < 3) {
    showAlert(
      "not enough nodes to calculate layout (>3).<br/> Check your selection"
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

export function perimeterForNodesSelection() {
  // if restrict take visible otherwise take whole graph

  let nodes = cy.nodes(":visible");
  // If AND to come restrict to current selected
  if (modeSelect() == AND_SELECTED) {
    nodes = cy.nodes(":visible:selected");
    if (nodes.length == 0) {
      let msg = "Nothing to filter with an AND operation.";
      msg += "<br/>Needs to have already selected nodes.";
      msg += "<br/> ( or change for OR operation )";
      showAlert(msg);
      return null;
    }
  }

  // return partial nodes but all unselected if AND
  if (modeSelect() == AND_SELECTED) nodes.unselect();
  return nodes;
}

export function perimeterForEdgesSelection() {
  // if restrict take visible otherwise take whole graph

  let edges = cy.edges(":visible");
  // If AND to come restrict to current selected
  if (modeSelect() == AND_SELECTED) {
    edges = cy.edges(":visible:selected");
    if (edges.length == 0) {
      let msg = "Nothing to filter with an AND operation.";
      msg += "<br/>Needs to have already selected edges.";
      msg += "<br/> ( or change for OR operation )";
      showAlert(msg);
      return null;
    }
  }

  // return partial nodes but all unselected if AND
  if (modeSelect() == AND_SELECTED) edges.unselect();
  return edges;
}

//------------- display counts in menu bar------------
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

  display = "Edges &nbsp;";
  const labelEdges = document.querySelector("#EdgesId");
  if (selectedEdges != 0) {
    display += `&nbsp;${big} ${selectedEdges}/</span>${small}${allEdges}</span>`;
  } else {
    display += `&nbsp;${small} ${selectedEdges}/</span>${big}${allEdges}</span>`;
  }

  labelEdges.innerHTML = display;

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
