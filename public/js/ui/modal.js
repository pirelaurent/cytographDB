"use strict";
// Copyright (C) 2025 pep-inno.com
// This file is part of CytographDB (https://github.com/pirelaurent/cytographdb)

import {
  getCy,
} from "../graph/cytoscapeCore.js";
import { metrologie } from '../core/metrology.js';
import {  perimeterForNodesSelection,
  perimeterForEdgesSelection } from "../core/perimeter.js";
import {
  modeSelect,
  AND_SELECTED,
  showAlert,
  showToast,
} from "../ui/dialog.js";

import { outputMarkdown } from "../util/markdown.js";

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

  document.querySelectorAll('li[data-category="columnsName"]').forEach((li) => {
    li.addEventListener("click", (e) => openNameFilterModal(e, "column"));
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
  document.getElementById("degreeFilter").style.display = "none";
}

/*
 apply choices for degree filter 
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
  let nodes;
  nodes = perimeterForNodesSelection();
  if (!degreeRestrictToVisible) nodes = cy.nodes();
  // nodes = degreeRestrictToVisible?cy.nodes(":visible"):cy.nodes();

  // if at least one input go on
  if (minOut != null || maxOut != null || minIn != null || maxIn != null) {
    cy.batch(() => {
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
          n.select();
          if (!degreeRestrictToVisible) n.show();
        }
      });
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
  //event?.currentTarget?.dataset.category === "nodesName";

  document.getElementById("nameFilterModal").style.display = "flex";
  const title = document.getElementById("nameFilterTitle");
  document.getElementById("modalNameFilterInput").value = "";
  const hiddenType = document.getElementById("modalNameFilterType");

  // adjust title to nodes or edges
  //|| event?.currentTarget?.dataset.category === "nodesName";

  if (type === "node") {
    title.textContent = "Filter tables by name";
    hiddenType.value = "nodes";
  }
  if (type === "edge") {
    title.textContent = "Filter relations by name";
    hiddenType.value = "edges";
  }

  if (type === "column") {
    title.textContent = "Search tables with column name";
    hiddenType.value = "columns";
  }

  document.getElementById("modalNameFilterInput").focus();
}

/*
As modal form is shared 
 relay to get hidden type nodes, edges, columns then call actions
*/
function modalSelectByName() {
  const val = document.getElementById("modalNameFilterInput").value;
  const cleanVal = val.trim();
  if (!cleanVal) { /* rien à filtrer */ return; }
  const hiddenType = document.getElementById("modalNameFilterType").value;
  const ok = selectByName(cleanVal, hiddenType);
  if (ok) closeNameFilterModal();
  metrologie();
}

/*
 grouped event and function to share the modal for input 
 nodes, edges, columns

*/
export function selectByName(pattern, hiddenType) {
  let regex;
  // detect a negative search to check differently
  const hasNegativeLookahead = /(?<!\\)\(\?\!/.test(pattern);

  // if a string has not the pattern : it is true 
  // if a string has the pattern: it is false (that it has not the pattern) 

  try {
    regex = new RegExp(pattern, "i");
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
  /*
   search by column names
  */
  if (hiddenType === "columns") {
    const withHidden = document.getElementById("searchOnHidden").checked;
    let nodes = withHidden ? getCy().nodes() : perimeterForNodesSelection();
    if (nodes == null) return;

    // un select residual hidden selecteed nodes if any
    if (withHidden) getCy().$("node:hidden").unselect();
    let results = [];
    let count = 0;

    getCy().batch(() => {
      nodes.forEach((node) => {
        let cases = [];
        // temporary patch for json reloaded
        const columns = node.data().columns.map((c) => c.column ?? c);

        let okNode;

        if (hasNegativeLookahead) {
          okNode = true;
          for (const name of columns) {
            const ok = regex.test(name);
            if (!ok) okNode = false; // one has = false that it has not 
          }
        } else {
          // Cas normal : au moins un champ correspond
          const anyMatch = columns.some((name) => {
            const m = regex.test(name);
            if (m) cases.push(name);
            return m;
          });
          okNode = anyMatch;
        }
        if (okNode) {
          count += 1;
          results.push(`${node.id()} :  ${cases.join(" , ")} `);
          node.select();
        } else {
          if (modeSelect() == AND_SELECTED) node.unselect();
        }
      });
    }); //batch
    getCy().$("node:selected").show();
    showToast(`${count} found`);
    const output = results.join("\n");

    outputMarkdown(
      {
        download: false,
        copyToClipboard: true,
        title: `search columm with ${pattern}`,
      },
      output, // that return text
      document
    );

    return true;
  }

  getCy().$("edge:selected").show(); //$ for elements( )
  return true;
}
