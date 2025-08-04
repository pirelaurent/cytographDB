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
  getCy,
  metrologie,
  captureGraphAsPng,
  hideNotSelected,
  selectAllVisibleNodes,

} from "../graph/cytoscapeCore.js";

import {
  pushSnapshot,
  popSnapshot,
} from "../graph/snapshots.js"

import {
  showAlert,
  menuSelectSizeOutgoing,
  menuSelectSizeIncoming,
  openNameFilterModal,
  deleteNodesSelected
} from "./dialog.js"

import {
  openTable,
  openTriggerPage,
}
  from "../dbFront/tables.js"

/*
 all the events set in gui are defined here 
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

      const classArray = Array.from(node.classes()).filter(
        (c) => c !== "hovered"
      );

      const technicalClasses = ['fk_detailed', 'fk_synth', 'showLabel'];
      const filteredClasses = classArray.filter(
        cls => !technicalClasses.includes(cls)
      );

      let classInfo = '';
      if (filteredClasses.length > 0) {
        classInfo = `<small>[${filteredClasses.join(', ')}]</small>`;
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


      output = `${data.id} <br\>`;
      output += `<small>${outgoers} □ ${incomers} </small><br\>`;

      if (classInfo) output += ` ${classInfo}<br/> `;
      // ${dataInfo}  can be added to hover for debug

    } else
    // ele is edge
    {
      let edge = ele;
      let labelToShow = ele.data('label');

      if (edge.hasClass('fk_detailed')) {
        labelToShow = ele.data('detailedLabel').replace('\n', "<BR/>");
      }


      const label = labelToShow;
      const classList = edge.classes(); // c'est une cytoscape collection

      // Convertir en tableau de chaînes
      const classArray = Array.from(classList);
      let libelArray = "";

      const technicalClasses = ['fk_detailed', 'fk_synth', 'showLabel'];
      const filteredClasses = classArray.filter(
        cls => !technicalClasses.includes(cls)
      );

      let classInfo;

      if (filteredClasses.length > 0) {
        classInfo = `<small>[${filteredClasses.join(', ')}]</small>`;
      }



      if (classInfo) output += ` ${classInfo}<br/> `;

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

  // menu to continue action when a node is clicked
  const clicNodeMenu = document.getElementById("clicNodeMenu");

  // retrait du menu si on clic ailleurs
  getCy().on("mouseover", "node", function (event) {
    const node = event.target;
    if (node.hasClass("hasTriggers")) {
      document.getElementById("open-trigger").style.display = "list-item";
    } else {
      document.getElementById("open-trigger").style.display = "none";
    }
    clicNodeMenu.style.display = "none";
  });

  // surlignage en couleurs des liens entrants et sortants
  getCy().on("mouseover", "node", function (evt) {
    const node = evt.target;
    // Réinitialise les styles
    getCy().edges().removeClass("incoming outgoing faded ");

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

  let ctrlPressed = false;

  const ctrlShortcuts = {
    'a': selectAllVisibleNodes,
    'g': captureGraphAsPng,
    'h': hideNotSelected,
    'z': popSnapshot, //undo

    // Ajoute d'autres raccourcis ici
  };


  document.addEventListener('keydown', (event) => {
    // Vérifie si une touche avec Ctrl correspond à un raccourci connu
    if ((event.ctrlKey || event.metaKey)) {
      const key = event.key.toLowerCase();
      const action = ctrlShortcuts[key];

      if (action) {
        event.preventDefault();   // ✅ Bloque uniquement si raccourci défini
        event.stopPropagation();
        action();
        return;
      }
    }
    // Del : Avoid del in some places
    if (['INPUT', 'TEXTAREA'].includes(event.target.tagName) || event.target.isContentEditable) {
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();   // Bloque suppression navigateur (retour page)
      deleteNodesSelected();
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
      getCy().edges().removeClass("incoming outgoing faded ");
    }
    getCy().nodes().removeClass("faded start-node"); // due to long path
  });

  document.getElementById("open-table").addEventListener("click", () => {
    openTable(nodeForInfo.id());
  });

  document.getElementById("open-trigger").addEventListener("click", () => {

    if (nodeForInfo.data().triggers.length >= 1) {
      openTriggerPage(nodeForInfo);
    }
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
  set back color at startup
  */

  document.getElementById("cy").style.backgroundColor = "white";
  /*
   add capture png
  */
  document.getElementById("btn-export").addEventListener("click", () => {
    captureGraphAsPng();
  });

  const btn = document.getElementById("btnSizeOutgoing");
  if (btn) {
    btn.addEventListener("click", menuSelectSizeOutgoing);
  }
  const btnIn = document.getElementById("btnSizeIncoming");
  if (btnIn) {
    btnIn.addEventListener("click", menuSelectSizeIncoming);
  }

  document.querySelectorAll('li[data-category="nodesName"]').forEach(li => {
    li.addEventListener('click', openNameFilterModal);
  });


} // setInterceptor

