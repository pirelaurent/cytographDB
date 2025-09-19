"use strict";
// Copyright (C) 2025 pep-inno.com
// This file is part of CytographDB (https://github.com/pirelaurent/cytographdb)

import {
  getCy,
  perimeterForNodesSelection,
} from "../graph/cytoscapeCore.js";

import { modeSelect, AND_SELECTED } from "../ui/dialog.js";

/*
 modal screens 
*/

/*
 trap events to be called at startup   
*/
export function setModalInterceptors() {
  /*
 -----------------------------------------------  modal degree window 
*/
  document
    .getElementById("modalDegreeFilterOk")
    .addEventListener("click", modalDegreeFilter);

  // filter by degree start
  document
    .getElementById("byFilterMenu")
    .addEventListener("click", () => openDegreeFilter());

  // leave modal if clic on background 
  
     document
    .getElementById("degreeFilter")
    .addEventListener("click", function (e) {
      if (e.target === this) closeDegreeFilter();
    }); 

    //close on any clic on background 
  document
    .getElementById("modalDegreeFilterCancel")
    .addEventListener("click", function (e) {
      if (e.target === this) closeDegreeFilter();
    });

  /*
    -----------------------------------------------  modal by name 
*/
  document.querySelectorAll('li[data-category="nodesName"]').forEach((li) => {
    li.addEventListener("click", (e) => openNameFilterModal(e, "node"));
  });

  document.querySelectorAll('li[data-category="edgesName"]').forEach((li) => {
    li.addEventListener("click", (e) => openNameFilterModal(e, "edge"));
  });

  document
    .getElementById("modalNameFilterOk")
    .addEventListener("click", modalSelectByName);

  document
    .getElementById("modalNameFilterCancel")
    .addEventListener("click", function (e) {
      if (e.target === this) closeNameFilterModal();
    });

  
     document
    .getElementById("nameFilterModal")
    .addEventListener("click", function (e) {
      if (e.target === this) closeNameFilterModal();
    }); 
    
} // setModalInterceptors

/*
 ---------------------------------   modal degree window services 
*/

function openDegreeFilter() {
  document.getElementById("degreeFilter").style.display = "flex";
}

function closeDegreeFilter() {
    console.log("closeDegreeFilter")
  document.getElementById("degreeFilter").style.display = "none";
}

/*
 apply choices for degree 
*/
function modalDegreeFilter() {
  let degreeRestrictToVisible = document.getElementById(
    "degreeRestrictToVisible"
  ).checked;

  let v = document.getElementById("degree-out-min").valueAsNumber; //NaN
  const minOut = Number.isFinite(v) ? Math.trunc(v) : null;

  v = document.getElementById("degree-out-max").valueAsNumber;
  const maxOut = Number.isFinite(v) ? Math.trunc(v) : null;

// AND OR
  let logicAnd = document.getElementById("degree-logic-and").value;

  v = document.getElementById("degree-in-min").valueAsNumber;
  const minIn = Number.isFinite(v) ? Math.trunc(v) : null;

  v = document.getElementById("degree-in-max").valueAsNumber;
  const maxIn = Number.isFinite(v) ? Math.trunc(v) : null;

  // calculation loop
  let cy = getCy();
  let nodes = cy.nodes(":visible");

  // if at least one input go on
  if (minOut != null || maxOut != null || minIn != null || maxIn != null) {

// console.log("bornes: minout:"+minOut+" maxout:"+maxOut+" minIN:"+minIn+" maxIn:"+maxIn) //PLA

    nodes.forEach((n) => {
      const n_in = degreeRestrictToVisible
        ? n.incomers("edge:visible").length
        : n.incomers("edge").length;

      const n_out = degreeRestrictToVisible
        ? n.outgoers("edge:visible").length
        : n.outgoers("edge").length;



      let outOk = true;

      if (minOut != null && !(n_out >= minOut)) outOk = false;
      if (maxOut != null && !(n_out < maxOut)) outOk = false;



      let inOk = true;
      if (minIn != null && !(n_in >= minIn)) inOk = false;
      if (maxIn != null && !(n_in < maxIn)) inOk = false;



      let allOk = true;
      if (logicAnd === "AND") allOk = outOk && inOk;
      else allOk = outOk || inOk;
      if (allOk) {
        //console.log(n.id() + " ok "); //PLA
        n.select();
      }
    });
  }
      // exit
    closeDegreeFilter();
}

/*
 ------------------------------------------------ modal filter by name 
*/

function closeNameFilterModal() {
  document.getElementById("nameFilterModal").style.display = "none";
}
/*
 Search by name --shared for edges and nodes --- 
 modal to enter the regex 
 hiddenType store 'nodes' or 'edges' for further filter. 
*/
function openNameFilterModal(event, type) {
  document.getElementById("nameFilterModal").style.display = "flex";
  const title = document.getElementById("nameFilterTitle");
  document.getElementById("modalNameFilterInput").value = "";
  const hiddenType = document.getElementById("modalNameFilterType");

  // adjust title to nodes or edges

  const isNode =
    type === "node" || event?.currentTarget?.dataset.category === "nodesName";
  title.textContent = `Filter ${isNode ? "nodes" : "edges"} by name (regex)`;
  hiddenType.value = isNode ? "nodes" : "edges";

  document.getElementById("modalNameFilterInput").focus();
}

function modalSelectByName() {
  const val = document.getElementById("modalNameFilterInput").value;
  const hiddenType = document.getElementById("modalNameFilterType").value;
  const ok = selectByName(val, hiddenType);
  if (ok) closeNameFilterModal();
}

// hiddentType is node or edges
export function selectByName(pattern, hiddenType) {
  let regex;
  try {
    regex = new RegExp(pattern.trimEnd(), "i");
  } catch (e) {
    showAlert("unvalid regex:", e.message);
    return false;
  }

  if (hiddenType === "nodes") {
    /*
 by name will search in visible and hidden. 
 If found in hidden, bring back these nodes
*/

    // perimeter special
    const withHidden = document.getElementById("searchOnHidden").checked;
    let nodes = withHidden ? getCy().nodes() : perimeterForNodesSelection();
    if (nodes == null) return;

    // un select residual hidden selecteed nodes if any
    if (withHidden) getCy().$("node:hidden").unselect();

    nodes.forEach((node) => {
      if (regex.test(node.id())) {
        node.select(); //add
      } else {
        if (modeSelect() == AND_SELECTED) node.unselect();
      }

      getCy().$("node:selected").show(); //$ for elements( )
      // show also edges
      getCy().$("node:selected").connectedEdges().show();
      // (future compound nodes, show montrer les parents
      getCy().$("node:selected").ancestors().show();
    });
  }

  //
  if (hiddenType === "edges") {
    // perimeter
    const withHidden = document.getElementById("searchOnHidden").checked;
    let edges = withHidden ? getCy().edges() : perimeterForEdgesSelection();
    if (edges == null) return;

    // un select residual hidden selecteed nodes if any
    if (withHidden) getCy().$("edge:hidden").unselect();

    edges.forEach((edge) => {
      if (regex.test(edge.data("label"))) {
        edge.select(); //add
      } else {
        if (modeSelect() == AND_SELECTED) edge.unselect();
      }
    });
  }
  getCy().$("edge:selected").show(); //$ for elements( )
  return true;
}
