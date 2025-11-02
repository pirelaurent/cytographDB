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

"use strict";



import { menuDisplay } from "./menuDisplay.js";
import { menuNodes } from "./menuNodes.js";
import { menuEdges } from "./menuEdges.js";
import { menuModel } from "./menuModel.js";
import { menuDb } from "./menuDb.js";
import { menuGraph } from "./menuGraph.js";

/*
 connect an html menu object to a treatment function with action selected
*/
export function initMenus() {
  setupMenuActions("menu-db", "action", menuDb);
  setupMenuActions("menu-graph", "action", menuGraph);
  setupMenuActions("menu-display", "aspectAction", menuDisplay);
  setupMenuActions("menu-nodes", "action", menuNodes);
  setupMenuActions("menu-edges", "action", menuEdges);
  setupMenuActions("menu-model", "action", menuModel);

  setupMenuClickAction();
}
/*
 prepare click events on menus designed in html by data-menu-id 
*/

function setupMenuActions(menuId, actionAttribute, callbackFn) {
  const menu = document.querySelector(`[data-menu-id="${menuId}"] .menu`);
  if (!menu) return;

  // Items finaux dans les sous-menus
  menu
    .querySelectorAll(".submenu li:not([data-skip-action])")
    .forEach((item) => {
      item.addEventListener("click", () => {
        // e.stopPropagation();
        const choice = item.getAttribute(actionAttribute);
        if (choice) callbackFn(choice, item, "left");
      });

      item.addEventListener(
        "contextmenu",
        (e) => {
          e.preventDefault(); // bloque le menu natif
          const choice = item.getAttribute(actionAttribute);
          if (choice) callbackFn(choice, item, "right");
        },
        { capture: true }
      ); // capture pour éviter un stopPropagation éventuel
    });

  // first level without submenu
  // ⬇️ important : use :scope > li (NOT ".menu > li")

  menu.querySelectorAll(":scope > li").forEach((item) => {
    const hasSubmenu = item.querySelector(":scope > .submenu") !== null;
    if (!hasSubmenu) {
      item.addEventListener("click", () => {
        const choice = item.getAttribute(actionAttribute);
        if (choice) callbackFn(choice, item, "left");
      });

      item.addEventListener(
        "contextmenu",
        (e) => {
          e.preventDefault();
          const choice = item.getAttribute(actionAttribute);
          if (choice) callbackFn(choice, item, "right");
        },
        { capture: true }
      );
    }
  });
}

/*
change color temporarly on click
*/
function setupMenuClickAction() {
  document.querySelectorAll(".submenu li, .menu li").forEach((item) => {
    item.addEventListener("click", () => {
      item.classList.add("clicked");
      // Retirer la classe après 150 ms
      setTimeout(() => {
        item.classList.remove("clicked");
      }, 150);
    });
  });
}

