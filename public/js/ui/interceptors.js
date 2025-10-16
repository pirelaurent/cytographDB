"use strict";
// Copyright (C) 2025 pep-inno.com
// This file is part of CytographDB (https://github.com/pirelaurent/cytographdb)

import {
  getCy,
  metrologie,
  captureGraphAsPng,
  hideNotSelected,
  selectAllVisibleNodes,
} from "../graph/cytoscapeCore.js";

import { popSnapshot, reDoSnapshot } from "../graph/snapshots.js";

import {
  showAlert,
  menuSelectSizeOutgoing,
  menuSelectSizeIncoming,
  deleteNodesSelected,
  helpRegex,
} from "./dialog.js";

import { openTable, openTriggerPage } from "../dbFront/tables.js";

import { internalCategories } from "../filters/categories.js";

import {
  enterFkDetailedModeForEdges,
  enterFkSynthesisModeForEdges,
} from "../graph/detailedEdges.js";

import { follow } from "../graph/walker.js";
import { menuNodes } from "./menus.js";
import { setModalInterceptors } from "./modal.js";
import { NativeCategories, ConstantClass } from "../util/common.js";
import { showClipReport } from "../util/clipReport.js";



/*
 all the events set in gui are defined here 
*/

export function setInterceptors() {
  //--------- set events'trap for cy

  setModalInterceptors(); // isolated in module modal.js

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

      //const internalCategories = ['fk_detailed', 'fk_synth', 'showLabel','showColumns'];
      const filteredClasses = classArray.filter(
        (cls) => !internalCategories.has(cls)
      );

      let allInfos = [];
      let classInfo = "";
      if (filteredClasses.length > 0) {
        filteredClasses.forEach((cls) => {
          switch (cls) {
            case NativeCategories.HAS_TRIGGERS:
              allInfos.push(`${cls}(${node.data().triggers.length})`);
              break;
            default:
              allInfos.push(`${cls}`);
          }
        });
        classInfo = `<small>[${allInfos.join(" ")} ]</small>`;
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
      if (node.selected()) output += "    "; // trick to verify selected
      output += `<small>${outgoers} □ ${incomers} </small><br\>`;

      if (classInfo) output += ` ${classInfo}<br/> `;
      // ${dataInfo}  can be added to hover for debug
    }
    // ele is edge
    else {
      let edge = ele;
      let labelToShow = ele.data("label");

      if (edge.hasClass(`${ConstantClass.FK_DETAILED}`)) {
        labelToShow += "<BR/>" + ele.data("columnsLabel");
      }

      const label = labelToShow;
      const classList = edge.classes(); // c'est une cytoscape collection

      // Convertir en tableau de chaînes
      const classArray = Array.from(classList);
      let libelArray = "";

      const filteredClasses = classArray.filter(
        (cls) => !internalCategories.has(cls)
      );

      let classInfo;

      if (filteredClasses.length > 0) {
        let allInfos = [];
        filteredClasses.forEach((cls) => {
          switch (cls) {
            case "fk_detailed":
              allInfos.push(`1/Col`);
              break;
            case `${ConstantClass.FK_SYNTH}`:
              allInfos.push(`1/FK`);
              break;
            default:
              allInfos.push(cls);
          }
        });
        classInfo = `<small>[${allInfos.join(" ")}]</small>`;
      }

      output = `
          ${edge.source().id()} --> 
          ${edge.target().id()}
          <br/><small>
          ${label} ${libelArray}
          </small>
        `;
      if (classInfo) output += `<br/> ${classInfo} `;
      // debug  output+= Array.from(edge.classes()).join(' ');
    }

    document.getElementById("nodeDetails").innerHTML = output;
    //${node.data('category')} <br>
  });

  getCy().on("mouseout", "node, edge", function () {
    document.getElementById("info-panel").style.display = "none";
  });

  // menu to show actions when a node is clicked

  const clicNodeMenu = document.getElementById("clicNodeMenu");

  const quickAccessMenu = document.getElementById("quickAccessMenu");

  // show colored link automatically
  getCy().on("mouseover", "node", function (evt) {
    const node = evt.target;
    // Réinitialise les styles
    getCy().edges().removeClass("incoming outgoing faded internal");

    getCy().nodes().addClass("faded");
    node.removeClass("faded");

    const cy = getCy();

    cy.batch(() => {
      cy.edges().forEach((edge) => {
        // Toujours repartir propre
        edge.removeClass("outgoing incoming faded");

        if (edge.source().id() === node.id()) {
          edge.addClass("outgoing");
          // si tu veux aussi dé-fader les nœuds connectés :
          edge.target().removeClass("faded");
          edge.source().removeClass("faded");
        } else if (edge.target().id() === node.id()) {
          edge.addClass("incoming");
          edge.source().removeClass("faded");
          edge.target().removeClass("faded");
        } else {
          edge.addClass("faded");
        }
      });
    });
  });

  getCy().on("mouseout", "node", function () {
    getCy().edges().removeClass("incoming outgoing faded ");
    getCy().nodes().removeClass("faded start-node"); // due to long path
    clicNodeMenu.style.display = "none";
  });

  getCy().on("mouseout", "edge", function () {
    clicEdgeMenu.style.display = "none";
  });

  // set to front selected nodes
  getCy().on("select", "node", function (evt) {
    const ele = evt.target;
    ele.style("z-index", Date.now());
  });

  // hide nodeMenu if a click on back
  document.addEventListener("click", () => {
    clicNodeMenu.style.display = "none";
    clicEdgeMenu.style.display = "none";
    quickAccessMenu.style.display = "none";
  });

  let ctrlPressed = false;

  const ctrlShortcuts = {
    a: selectAllVisibleNodes,
    g: captureGraphAsPng,
    h: hideNotSelected,
    y: reDoSnapshot,
    z: popSnapshot, //undo

    // Ajoute d'autres raccourcis ici
  };

  document.addEventListener("keydown", (event) => {
    // Vérifie si une touche avec Ctrl correspond à un raccourci connu
    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();
      const action = ctrlShortcuts[key];

      if (action) {
        event.preventDefault(); // ✅ Bloque uniquement si raccourci défini
        event.stopPropagation();
        action();
        return;
      }
    }
    // Del : Avoid del in some places
    if (
      ["INPUT", "TEXTAREA"].includes(event.target.tagName) ||
      event.target.isContentEditable
    ) {
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault(); // Bloque suppression navigateur (retour page)
      deleteNodesSelected();
    }
  });

  /*
    some cleaning action between two actions on Nodes menu
  */

  document.getElementById("NodesId").addEventListener("click", () => {
    // clean input text
    const input = document.getElementById("nameFilter");
    if (input) input.value = "";

    // clean result
    const result = document.getElementById("nameFilterResult");
    if (result) result.textContent = "";
  });

  // button undo
  document.getElementById("undo-btn").addEventListener("click", () => {
    popSnapshot("undo button");
  });

// clipBoard 
  document.getElementById("clip-btn").addEventListener("click", () => { 
    showClipReport();
  });


  document.addEventListener("keyup", (e) => {
    if (e.key === "Control") {
      ctrlPressed = false;
    }
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

  /*
    useful to position contextual menu in current container
  */

  function whereClicInContainer(renderedPos) {
    const containerRect = getCy().container().getBoundingClientRect();
    // real pos in window
    const x = containerRect.left + renderedPos.x;
    const y = containerRect.top + renderedPos.y;
    return { x, y };
  }

  /* 
  contextual menu for node 
  */

  // global to be reused once clicked on subMenu
  let nodeForInfo;

  /* 
  getCy().on("cxttap", "node", function (evt) {
    nodeForInfo = evt.target;
    const { x, y } = whereClicInContainer(evt.renderedPosition)
    clicNodeMenu.style.left = `${x + 5}px`;
    clicNodeMenu.style.top = `${y - 5}px`;
    document.getElementById("open-trigger").style.display = nodeForInfo.hasClass(NativeCategories.HAS_TRIGGERS) ? "list-item" : "none"
    clicNodeMenu.style.display = "block";
  });
 */

  getCy().on("cxttap", "node", function (evt) {
    nodeForInfo = evt.target;

    // Position rendue (px) du centre du nœud
    const center = nodeForInfo.renderedPosition();
    const topY = center.y - nodeForInfo.renderedHeight() / 2; // haut du nœud
    const anchor = { x: center.x, y: topY };

    // Convertir vers coords CSS du container (ta fonction existante)
    const { x, y } = whereClicInContainer(anchor);

    // Poser le menu au-dessus et centré sur le nœud
    const offsetY = 8; // petit décalage
    clicNodeMenu.style.left = `${x - (clicNodeMenu.offsetWidth || 0) / 2}px`;
    clicNodeMenu.style.top = `${
      y + 5 - (clicNodeMenu.offsetHeight || 0) - offsetY
    }px`;

    // Ton affichage conditionnel
    document.getElementById("open-trigger").style.display =
      nodeForInfo.hasClass(NativeCategories.HAS_TRIGGERS)
        ? "list-item"
        : "none";

    clicNodeMenu.style.display = "block";
  });

  getCy().on("cxttap", (e) => {
    // si on a cliqué un node/edge, on ne montre pas ce menu-là
    if (e.target !== getCy()) return;

    // coordonnées souris écran
    const oe = e.originalEvent; // MouseEvent / PointerEvent
    const { clientX, clientY } = oe;

    // positionner le menu en tenant compte du conteneur
    const rect = getCy().container().getBoundingClientRect();
    let left = clientX - rect.left;
    let top = clientY - rect.top;

    // 3) Ajuster pour éviter que le menu sorte du conteneur
    // (attendre display pour mesurer)
    quickAccessMenu.style.display = "block";
    const mw = quickAccessMenu.offsetWidth;
    const mh = quickAccessMenu.offsetHeight;
    const maxLeft = rect.width - mw - 4;
    const maxTop = rect.height - mh - 4;
    left = Math.min(Math.max(4, left), Math.max(4, maxLeft));
    top = Math.min(Math.max(4, top), Math.max(4, maxTop));

    quickAccessMenu.style.left = `${left}px`;
    quickAccessMenu.style.top = `${top}px`;
  });

  // 4) Cacher le menu quand on clique ailleurs, on scrolle/pan/zoom, ou touche Échap
  function hideQuickMenu() {
    quickAccessMenu.style.display = "none";
  }

  getCy().on("tap", (e) => {
    // si on a cliqué ailleurs que le menu, on masque
    // (tap catchera aussi le clic gauche; c’est voulu)
    if (e.target === cy || e.target.isNode?.() || e.target.isEdge?.())
      hideQuickMenu();
  });
  getCy().on("pan zoom drag", hideQuickMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideQuickMenu();
  });

  // Optionnel: empêcher qu’un clic dans le menu le ferme si tu as des boutons dedans
  quickAccessMenu.addEventListener("mousedown", (e) => e.stopPropagation());

  // Si tu veux masquer dès qu’on clique hors du container :
  document.addEventListener("mousedown", (e) => {
    if (
      !getCy().container().contains(e.target) &&
      !quickAccessMenu.contains(e.target)
    )
      hideQuickMenu();
  });

  document.getElementById("open-table").addEventListener("click", () => {
    openTable(nodeForInfo.id());
        //openTable10rows(nodeForInfo.id())
  });

  document.getElementById("open-trigger").addEventListener("click", () => {
    if (nodeForInfo.data().triggers.length >= 1) {
      openTriggerPage(nodeForInfo);
    } else showAlert("no triggers on this table");
  });

  /*
   contextual menu for edge 
  */

  let edgeForInfo;

  const clicEdgeMenu = document.getElementById("clicEdgeMenu");

  getCy().on("cxttap", "edge", function (evt) {
    edgeForInfo = evt.target;
    const option = document.getElementById("toggleEdgeDetails");
    option.classList.remove("hidden");
    if (edgeForInfo.hasClass(NativeCategories.TRIGGER_IMPACT)) {
      option.classList.add("hidden");
    }

    const { x, y } = whereClicInContainer(evt.renderedPosition);
    clicEdgeMenu.style.left = `${x - 10}px`;
    clicEdgeMenu.style.top = `${y - 20}px`;
    clicEdgeMenu.style.display = "block";
  });

  /*
   back to synth from edge contextual menu
  */

  document.getElementById("toggleEdgeDetails").addEventListener("click", () => {
    if (edgeForInfo.hasClass(NativeCategories.TRIGGER_IMPACT)) return;
    let synthEdges = getCy().collection([edgeForInfo]);
    if (edgeForInfo.hasClass(`${ConstantClass.FK_SYNTH}`)) {
      enterFkDetailedModeForEdges(synthEdges);
    } else {
      // find all others from same label , ie details of a unique synth
      let cy = getCy();
      let aLabel = edgeForInfo.data("label");
      let edges = cy
        .edges(":visible")
        .filter((edge) => edge.data("label") === aLabel);
      enterFkSynthesisModeForEdges(edges);
    }
  });

  document.getElementById("toggleEdgeLabel").addEventListener("click", () => {
    if (
      edgeForInfo.hasClass(NativeCategories.TRIGGER_IMPACT) ||
      edgeForInfo.hasClass(ConstantClass.FK_SYNTH) ||
      edgeForInfo.hasClass(NativeCategories.SIMPLIFIED)
    ) {
      edgeForInfo.toggleClass(`${ConstantClass.SHOW_LABEL}`);
    } else if (edgeForInfo.hasClass(ConstantClass.FK_DETAILED)) {
      edgeForInfo.toggleClass(ConstantClass.SHOW_COLUMNS);
    }
  });

  // trace current selection values
  getCy().on("select unselect", "node", function () {
    metrologie();
  });

  getCy().on("select unselect", "edge", function () {
    metrologie();
  });

  // clic hors éléments
  getCy().on("tap", function (event) {
    if (event.target === getCy()) {
      getCy().elements().unselect();
      getCy().elements().removeClass("faded start-node");

      getCy().edges(":selected").removeClass("internal outgoing incoming");
    } else if (event.target.isNode && event.target.isNode()) {
      // pushSnapshot('tapNode');
    } else if (event.target.isEdge && event.target.isEdge()) {
      // pushSnapshot('tapEdge');
    }
  });

  // pouvoir déselectionner un rectangle en maintenant ctrl
  // difference is a cytomethod

  let previousSelection = null;

  getCy().on("boxstart", () => {
    //pushSnapshot('boxStart');
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

  document.getElementById("arrowLeft").addEventListener("click", () => {
    commonArrow("outgoing");
  });

  document.getElementById("arrowRight").addEventListener("click", () => {
    commonArrow("incoming");
  });

  document.getElementById("arrowMiddle").addEventListener("click", () => {
    commonArrow("both");
  });


  const svg = document.getElementById('follow-graph');

  // Clic souris / tactile
  svg.addEventListener('click', (e) => {
    const zone = e.target.closest('.zone');
    if (!zone || !svg.contains(zone)) return;

menuNodes(zone.dataset.action, e);

    //triggerAction(zone.dataset.action);
  
  
  });






  function commonArrow(direction) {
    // store current selected
    let selectedElements = getCy().elements(":visible:selected");
    selectedElements.unselect();

    // replace by a unique selected node to call follow
    nodeForInfo.select();
    follow(direction);
    // restore previoous
    selectedElements.select();
  }

  /*

  quick menu 
  */
  document.getElementById("icon-selectAll").addEventListener("click", () => {
    menuNodes("all");
  });
  document.getElementById("icon-selectNone").addEventListener("click", () => {
    menuNodes("none");
  });
  document.getElementById("icon-selectSwap").addEventListener("click", () => {
    menuNodes("swapSelected");
  });

  document.getElementById("icon-hideSelected").addEventListener("click", () => {
    menuNodes("hideSelected");
  });

  document
    .getElementById("icon-hideNotSelected")
    .addEventListener("click", () => {
      menuNodes("hideNotSelected");
    });

  document.getElementById("icon-swapHidden").addEventListener("click", () => {
    menuNodes("swapHidden");
  });

  document.getElementById("icon-showAll").addEventListener("click", () => {
    menuNodes("showAll");
  });

const tipsBtn = document.getElementById('tipsBtn');
tipsBtn.addEventListener('click', () => {
  helpRegex();
});


} // setInterceptor
