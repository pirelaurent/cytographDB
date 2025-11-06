import { adjustClipReportBtn } from "../util/clipReport.js";

import {getCy} from "../graph/cytoscapeCore.js";
import{restrictToVisible} from "../core/perimeter.js";
import { showToast } from "../ui/dialog.js";
//------------- display counts in menu bar------------

let lastSelectedNodes = 0;
let lastSelectedEdges = 0;

export function metrologie(where = "") {
  const cy = getCy();
  //display some measures
  const wholeNodesVisible = cy.nodes(":visible").length;
  const selectedCountNodesVisible = cy.nodes(":selected:visible").length;
  let deltaNode = selectedCountNodesVisible- lastSelectedNodes;
  lastSelectedNodes = selectedCountNodesVisible;

  if (deltaNode >0) {
    //console.log(`${deltaNode} in: ${where}`);//PLA
    showToast(`+${deltaNode} node(s)`);
  }




  const wholeNodesHidden = cy.nodes(":hidden").length;
  const selectedCountNodesHidden = cy.nodes(":selected:hidden").length;
  const labelNodes = document.querySelector("#NodesId");

  const wholeEdgesVisible = cy.edges(":visible").length;

  const selectedCountEdgesVisible = cy.edges(":selected:visible").length;
  let deltaEdge = selectedCountEdgesVisible-lastSelectedEdges;
  lastSelectedEdges=selectedCountEdgesVisible;

  const wholeEdgesHidden = cy.edges(":hidden").length;
  const selectedCountEdgesHidden = cy.edges(":selected:hidden").length;
  const labelEdges = document.querySelector("#EdgesId");

/*
 transitoire
*/
let deltaInfo="";
 if (deltaNode >0) deltaInfo=(`+ ${deltaNode} node(s)`);
 if (deltaEdge>0) deltaInfo+=(` (+ ${deltaEdge} edge(s))`);

if(deltaInfo!="") showToast(deltaInfo);


  /*
 to obective the perimeter : enhance the number 
 if select = 0 : small font and big font for total  
 else select big , total small 
 */

  let big = '<span class = "bigPerim">';
  let small = '<span class = "smallPerim">';
  let display = "Tables&nbsp;&nbsp;";

  if (selectedCountNodesVisible > 0) {
    display += `${big}${selectedCountNodesVisible}/</span> ${small}${wholeNodesVisible}</span>`;
  } else {
    display += `${small}${selectedCountNodesVisible}/</span> ${big}${wholeNodesVisible}</span>`;
  }

  // hidden
  let dispHidden = `&nbsp;&nbsp; ${small}(${selectedCountNodesHidden}/</span>${small}${wholeNodesHidden})</span>`;
  if (!restrictToVisible()) {
    if (selectedCountNodesHidden > 0) {
      dispHidden = `&nbsp; ${big}(${selectedCountNodesHidden}/</span>${small}${wholeNodesHidden})</span>`;
    } else {
      dispHidden = `&nbsp; ${small}(${selectedCountNodesHidden}/</span>${big}${wholeNodesHidden})</span>`;
    }
  }
  display += dispHidden;
  labelNodes.innerHTML = display;

  // ------------ edges info

  display = "Relations &nbsp;";
  if (selectedCountEdgesVisible > 0) {
    display += `${big}${selectedCountEdgesVisible}/</span> ${small}${wholeEdgesVisible}</span>`;
  } else {
    display += `${small}${selectedCountEdgesVisible}/</span> ${big}${wholeEdgesVisible}</span>`;
  }
  // hidden
  dispHidden = `&nbsp;&nbsp; ${small}(${selectedCountEdgesHidden}/</span>${small}${wholeEdgesHidden})</span>`;
  if (!restrictToVisible()) {
    if (selectedCountEdgesHidden > 0) {
      dispHidden = `&nbsp; ${big}(${selectedCounEdgesHidden}/</span>${small}${wholeEdgesHidden})</span>`;
    } else {
      dispHidden = `&nbsp; ${small}(${selectedCountEdgesHidden}/</span>${big}${wholeEdgesHidden})</span>`;
    }
  }
  display += dispHidden;
  labelEdges.innerHTML = display;
  // for reports
  adjustClipReportBtn();
}
