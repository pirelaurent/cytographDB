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




import {
  captureGraphAsPng
} from "./selectors.js";

import {
  getCy,
      metrologie,
} from "./graph/cytoscapeCore.js";

import {
  pushSnapshot,
  popSnapshot,

} from "./graph/snapshots.js"

import {
  showAlert,

} from "./ui/dialog.js"

import { 
  openTable,
  openTriggerPage,
}
from "./dbFront/tables.js"

/*
 all the events in gui defined here 
*/

export function setInterceptors() {
  //--------- set events'trap for cy

  getCy().on("mouseover", "node", (evt) => evt.target.addClass("hovered"));
  getCy().on("mouseout", "node", (evt) => evt.target.removeClass("hovered"));

  /*
   information on mouse over on nodes and edges 
  */

  getCy().on("mouseover", "node, edge", function (evt) {
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

    
      if (node.hasClass("hasTriggers")) {
        let nbTrigs = node.data("triggers").length;
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
      let libelArray = "";
      if (classArray.length > 0) libelArray = `<br/>[${classArray.join(", ")}]`;

      output = ` 
          ${edge.source().id()} --> 
          ${edge.target().id()}
          <br/><small>
          ${label} ${libelArray}
          </small>
        `;
      // debug  output+= Array.from(edge.classes()).join(' ');
    }
    document.getElementById("nodeDetails").innerHTML = output;
    //${node.data('category')} <br>
  });

  getCy().on("mouseout", "node, edge", function () {
    document.getElementById("info-panel").style.display = "none";
  });

  // retrait du menu si on clic ailleurs
  getCy().on("mouseover", "node", function () {
    clicNodeMenu.style.display = "none";
  });

  // surlignage en couleurs des liens entrants et sortants
  getCy().on("mouseover", "node", function (evt) {
    const node = evt.target;
    // Réinitialise les styles
    getCy().edges().removeClass("incoming outgoing faded");

    getCy().nodes().addClass("faded");
    node.removeClass("faded");

    getCy().edges().forEach((edge) => {
      if (edge.source().id() === node.id()) {
        edge.addClass("outgoing");
        edge.target().removeClass("faded");
      } else if (edge.target().id() === node.id()) {
        edge.addClass("incoming");
        edge.source().removeClass("faded");
      } else {
        edge.addClass("faded");
      }
    });
  });

  // set to front selected nodes
  getCy().on("select", "node", function (evt) {
    const ele = evt.target;
    ele.style("z-index", Date.now());
  });

  // Masquer le menu si on clique ailleurs
  document.addEventListener("click", () => {
    clicNodeMenu.style.display = "none";
  });

  /* visible
  document.getElementById("planSelect").addEventListener("change", function () {
    metrologie(); // Appelle ta fonction quand le select change
  });
*/
  // undo et select all

  let ctrlPressed = false;

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
            pushSnapshot();
        let nodes = restrictToVisible() ? getCy().nodes(":visible") : getCy().nodes();
        nodes.select();
      }
    }
// ✅ Ctrl/⌘ + Z → Undo
    if ((e.ctrlKey || e.metaKey) && key === "g") {
      e.preventDefault();
      captureGraphAsPng();
    }
  });

  /*
    some cleaning action between two actions on Nodes menu
  */


document.getElementById('NodesId').addEventListener('click', () => {
  // clean input text 
  const input = document.getElementById('nameFilter');
  if (input) input.value = "";

  // clean result 
  const result = document.getElementById('nameFilterResult');
  if (result) result.textContent = "";
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

  getCy().on("mouseout", "node", function () {
    {
      getCy().edges().removeClass("incoming outgoing faded "); // internal ?
    }
    getCy().nodes().removeClass("faded");
  });

  document.getElementById("open-table").addEventListener("click", () => {
    openTable(nodeForInfo.id());
  });

  document.getElementById("open-trigger").addEventListener("click", () => {

    if (nodeForInfo.data().triggers.length>=1){
    openTriggerPage(nodeForInfo);}
    else showAlert("no triggers on this table")

  });

  // show red when AND selection

  const select = document.getElementById("modeSelect");
  select.addEventListener("change", function () {
    if (select.value === "AND") {
      select.classList.add("AND-select");
    } else {
      select.classList.remove("AND-select");
    }
  });

  // Facultatif : appliquer au chargement si nécessaire
  if (select.value === "AND") {
    select.classList.add("AND-select");
  }

  // menu to continue action when a node is clicked
  const clicNodeMenu = document.getElementById("clicNodeMenu");

  // Affichage du menu contextuel sur clic droit
  let nodeForInfo = null;
  getCy().on("cxttap", "node", function (evt) {
    nodeForInfo = evt.target;
    const renderedPos = evt.renderedPosition;
    // Obtenir la position du container Cytoscape dans la page
    const containerRect = getCy().container().getBoundingClientRect();
    // Calculer la position réelle dans la fenêtre
    const x = containerRect.left + renderedPos.x;
    const y = containerRect.top + renderedPos.y;

    clicNodeMenu.style.left = `${x + 5}px`;
    clicNodeMenu.style.top = `${y - 5}px`;
    clicNodeMenu.style.display = "block";
  });

  //--------------------  marquage d'un noeud sélectionné

  /*         NE PAS REFAIRE A LA MANO LAISSER CYTO
                    NO: getCy().on("tap", "node", function (evt) {
                    car cet évènement arrive après le select natif
*/

  // trace selection
  getCy().on("select unselect", "node", function () {
    metrologie();
  });

  getCy().on("select unselect", "edge", function () {
    metrologie();
  });

  // clic hors éléments
  getCy().on("tap", function (event) {
    if (event.target === cy) {
      getCy().elements().unselect();
      getCy().elements().removeClass("faded start-node")
      getCy().edges(":selected").removeClass("internal outgoing incoming");
    } else if (event.target.isNode && event.target.isNode()) {
      pushSnapshot();
    } else if (event.target.isEdge && event.target.isEdge()) {
      pushSnapshot();
    }
  });

  // pouvoir déselectionner un rectangle en maintenant ctrl
  // difference is a cytomethod

  let previousSelection = null;

  getCy().on("boxstart", () => {
    pushSnapshot();
    if (ctrlPressed) {
      previousSelection = getCy().elements(":selected"); // snapshot AVANT
      //console.log('boxstart '+previousSelection.length)
      previousSelection.unselect();
      previousSelection.forEach((elt) => elt.addClass("doubleSelect"));
      //console.log("Marqués doubleSelect:", previousSelection.length);
    }
  });

  /*
 several attempt to catch edge inside the select box. no good answers. 
*/
  getCy().on("boxend", () => {
    if (ctrlPressed) {
      setTimeout(() => {
        const currentSelection = getCy().elements(":selected");
        // add selection of
        const newlySelected = previousSelection.difference(currentSelection);

        currentSelection.unselect();
        newlySelected.select();
        getCy().elements(".doubleSelect").removeClass("doubleSelect");
        //previousSelection.forEach((elt) => elt.removeClass("doubleSelect"));
        previousSelection = null;
      }, 0); // ⚡ 0 millisecondes suffit pour passer au cycle suivant
    }
  });

  /*
  set back color 
  */

  document.getElementById("cy").style.backgroundColor = "white";
/*
 add capture png
*/
document.getElementById("btn-export").addEventListener("click", () => {
  captureGraphAsPng();
});



} // setInterceptor

