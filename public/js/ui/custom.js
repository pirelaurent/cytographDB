"use strict";

import {perimeterForNodesSelection, perimeterForEdgesSelection,getCy} from "../graph/cytoscapeCore.js"

import { getCustomNodesCategories }
  from "../filters/categories.js"
import { showToast } from "./dialog.js";

  /*
 find all data types in nodes that we leave to user choice 
*/

export function fillInGuiNodesCustomCategories() {
  // find position in menus
  const container = document.getElementById("customList");
  // create or get submenu
  let submenu = container.querySelector(".submenu");
  if (!submenu) {
    submenu = document.createElement("ul");
    submenu.classList.add("submenu");
    container.appendChild(submenu);
  }

  // Supprime les anciens éléments
  submenu.querySelectorAll("li.dynamic-data-key").forEach((el) => el.remove());

  // Add new custom
  for (let key of getCustomNodesCategories()) {
    const li = document.createElement("li");
    li.classList.add("dynamic-data-key");
    li.setAttribute("data-key", key);
    li.textContent = key;
    li.addEventListener("click", () => {
      selectNodesByCustomcategories(key);
    });
    submenu.appendChild(li);
  }
}

/*
  following eventlistener set in dynamic list 
  filter nodes 
  take care of OR/AND 
*/

function selectNodesByCustomcategories(aCategory) {
  const nodes = perimeterForNodesSelection();
  nodes.forEach((node) => {
    if (node.hasClass(aCategory)) {
      node.select();
    }
  });
}

/*
  discrete native categories are set in index.html with dedicated actions 
*/

export function selectEdgesByNativeCategories(aCategory) {
  const edges = perimeterForEdgesSelection();
  if (edges.length === 0) {
    showToast("nothing to filter");
    return;
  }
  const count =  getCy().edges(':selected').length;
  edges.forEach((edge) => {
    if (edge.hasClass(aCategory)) {
      edge.select();
    }
  });
  const count2 = getCy().edges(':selected').length;
      showToast(`${count2-count} more selected`);
}

export async function checkForCustomDocs() {
  try {
    const response = await fetch("/api/custom-docs-check");
    const result = await response.json();
    return result; // { available: true/false, files: [...] }
  } catch (err) {
    console.error("Failed to check custom docs:", err);
    return { available: false, files: [] };
  }
}

/*
 add a new link on menu bar to acces at custom docs if any 
*/

export async function addCustomDocLink() {
  const result = await checkForCustomDocs();
  if (result.available && result.files.length > 0) {
    const firstFile = result.files[0];

    // Trouver le lien Documentation existant
    const docLink = document.querySelector(".doc-link");
    if (docLink) {
      const customLink = document.createElement("a");
      customLink.href = `/custom/docs/${firstFile}`;
      customLink.textContent = "Custom doc.";
      customLink.className = "doc-link";
      customLink.style.cursor = "pointer";

      // force l'ouverture dans un onglet nommé (ou le réutilise)
      customLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.open(customLink.href, "docTab");
      });

      docLink.parentNode.insertBefore(customLink, docLink.nextSibling);
    }
  }
}