import {
    getCy,
}   from "../graph/cytoscapeCore.js";

import { showAlert,modeSelect, AND_SELECTED } from "../ui/dialog.js";

/*
 fix the perimer of actions
 if selection : acts on selection
 otherwise acts on all nodes eventually visible only 
*/
export function perimeterForNodesAction() {
  let nodes;
    const cy = getCy();
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
 Special perimeter taking in account AND operation 
 if AND the perimeter includes only currently selected nodes 
 return a cyto collection . could be empty length === 0 
*/

export function perimeterForNodesSelection() {
  // if restrict take visible otherwise take whole graph
const cy = getCy();
  let nodes = cy.nodes(":visible");
  // If AND to come restrict to current selected
  if (modeSelect() === AND_SELECTED) {
    nodes = cy.nodes(":visible:selected");
    if (nodes.length === 0) {
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
/*
 action on elected if any, all otherwise
*/
export function perimeterForEdgesAction() {
    const cy = getCy();
  let edges;

  if (restrictToVisible()) {
    edges = cy.edges(":selected:visible");
    if (edges.length == 0) edges = cy.edges(":visible");
  } else {
    edges = cy.edges(":selected");
    if (edges.length == 0) edges = cy.edges();
  }
  return edges;
}

export function perimeterForEdgesSelection() {
  // if restrict take visible otherwise take whole graph
const cy = getCy();
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

/*
 leaved to true to simplify. Could be set later through a gui option. 
*/
export function restrictToVisible() {
  return true;
}
