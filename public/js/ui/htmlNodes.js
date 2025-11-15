/*
 html is rendered by nodes-list.ejs filled in by modes-list.js
*/
"use strict";
import { getCy } from "../graph/cytoscapeCore.js";
import { getLocalDBName } from "../dbFront/tables.js";


export function listNodesToHtml(all = true) {
  // gie access to  cy to the popup
  window.getCy = () => getCy();

  // Callback for popup return result . lust be set before the page
  window.applySelectionFromPopup = (ids) => {
    const cy = getCy();
    cy.batch(() => {
      cy.elements().unselect();
      if (ids?.length) {
        cy.$(
          ids
            .map((id) => `#${CSS.escape(id)}`)
            .join(",")
        ).select();
      }
    });
  };

  //  ask server to open the popup 

  const db = getLocalDBName();
  const url = `/nodes-list?currentDBName=${encodeURIComponent(db)}&scope=${all ? "all" : "selected"}`;
  const name = "nodeListWindow";

  let win = window.open("", name);

  if (win && !win.closed) {
    try {
      if (win.location.href !== url) win.location.href = url;
      win.focus();
    } catch {
      win = window.open(url, name);
      if (win) win.focus();
    }
  } else {
    win = window.open(url, name);
    if (win) win.focus();
  }
}













