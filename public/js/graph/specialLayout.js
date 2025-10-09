"use strict";

import { getCy, perimeterForNodesAction } from "../graph/cytoscapeCore.js";
import { getCustomNodesCategories } from "../filters/categories.js";
/*
 organize dependencies by levels 
*/

export function organizeSelectedByDependencyLevels() {
  let cy = getCy();

  // keep track of selected to work only on the subset if any
  //let withSelect = true;
  let selectedNodes = cy.nodes(":selected:visible");
  
  if (selectedNodes.length == 0) {
    selectedNodes = cy.nodes(":visible");
    // withSelect = false;
  }

  if (selectedNodes.empty()) return;

  // --- 1. Construire la map des dépendances ---
  // Chaque nœud => les cibles qu'il référence (ses "parents")
  const deps = {};
  selectedNodes.forEach((node) => {
    const id = node.id();
    let targets = node.outgoers("edge[target]").targets();
targets = targets.filter(":visible");

/*     if (withSelect) {
      targets = targets.filter(":selected");
    } */

    deps[id] = targets.map((t) => t.id());
  });

  // --- 2. Calculer le niveau de dépendance de chaque nœud ---
  const levelMap = {};
  const visited = new Set();

  function computeLevel(nodeId) {
    if (levelMap[nodeId] !== undefined) return levelMap[nodeId];
    if (visited.has(nodeId)) return 0; // éviter les cycles
    visited.add(nodeId);

    const targets = deps[nodeId] || [];
    if (targets.length === 0) {
      levelMap[nodeId] = 0; // feuille : aucune FK sortante
    } else {
      const targetLevels = targets.map((tid) => computeLevel(tid));
      levelMap[nodeId] = Math.max(...targetLevels) + 1;
    }
    return levelMap[nodeId];
  }

  selectedNodes.forEach((n) => computeLevel(n.id()));

  // --- 3. Grouper les nœuds par niveau ---
  const levels = {};
  Object.entries(levelMap).forEach(([id, lvl]) => {
    if (!levels[lvl]) levels[lvl] = [];
    levels[lvl].push(id);
  });

  // --- 4. mode nodes on horizontal layers ---


const maxCount = Object.values(levels).reduce((m, arr) => Math.max(m, arr.length), 0);

const multiplier = Math.floor(maxCount / 50) + 1;
  const xSpacing = 30+180 *multiplier; //from Object.keys(levels).length;
  const ySpacing = 100;
  const minY = cy.extent().y1 + 100;
  const minX = cy.extent().x1 + 100;

  Object.keys(levels)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((lvl, idx) => {
      const nodesAtLevel = levels[lvl];
      const x = minX + idx * xSpacing;
      const totalHeight = (nodesAtLevel.length - 1) * ySpacing;
      nodesAtLevel.forEach((id, j) => {
        const y = minY + j * ySpacing - totalHeight / 2;
        cy.getElementById(id).position({ x, y });
      });
    });

  cy.animate({
    fit: { eles: selectedNodes, padding: 100 },
    duration: 800,
  });

  // --- 4. Trier les niveaux et les nœuds ---
  const orderedLevels = Object.keys(levels)
    .map(Number)
    .sort((a, b) => a - b)
    .map((lvl) => ({
      level: lvl,
      nodes: levels[lvl]
        .map((id) => cy.getElementById(id))
        .sort((a, b) => {
          const la = a.data("label") || a.data("name") || a.id();
          const lb = b.data("label") || b.data("name") || b.id();
          return la.localeCompare(lb);
        })
        .map((n) => n.id()),
    }));

  const formatedResult = JSON.stringify(orderedLevels, null, 2);
  //console.log("Levels:", formatedResult);
  return formatedResult;
}

// adapt vertically by categories horizontally
export function organizeSelectedByDependencyLevelsWithCategories() {
  let cy = getCy();

  const selected = perimeterForNodesAction();
  if (selected.empty()) return [];

  // --- 0) Categories come from node classes
  const categoryOrder = Array.from(getCustomNodesCategories() ?? new Set());
  const pickCategory = (node) => {
    for (const c of categoryOrder) if (node.hasClass(c)) return c;
    return "uncategorized";
  };

  // --- 1) Dependencies only within the selected subgraph
  const deps = {};
  selected.forEach((n) => {
    const id = n.id();
    deps[id] = n
      .outgoers("edge")
      .targets()
      .filter(":selected")
      .map((t) => t.id());
  });

  // --- 2) Compute dependency levels (leaf = 0)
  const levelMap = {};
  const visiting = new Set();
  const levelOf = (id) => {
    if (levelMap[id] !== undefined) return levelMap[id];
    if (visiting.has(id)) return 0; // break cycles
    visiting.add(id);
    const children = deps[id] || [];
    levelMap[id] = children.length ? Math.max(...children.map(levelOf)) + 1 : 0;
    visiting.delete(id);
    return levelMap[id];
  };
  selected.forEach((n) => levelOf(n.id()));

  // --- 3) Group: category -> level -> [nodes]
  const groups = {};
  selected.forEach((n) => {
    const cat = pickCategory(n);
    const lvl = levelMap[n.id()];
    groups[cat] ??= {};
    (groups[cat][lvl] ??= []).push(n);
  });

  // --- 4) Sort nodes alphabetically within each level
  const nameOf = (n) => n.data("label") ?? n.data("name") ?? n.id();
  Object.values(groups).forEach((levels) => {
    Object.keys(levels).forEach((lvl) => {
      levels[lvl].sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
    });
  });

  // --- 5) Place categories in separated horizontal bands
  const xSpacing = 200 * categoryOrder.length; // distance between successive levels (columns)
  const ySpacing = 100; // distance between nodes in a column
  const categorySpacing = 400; // horizontal gap between categories (bands)

  const padX = 100,
    padY = 100;
  const baseX = cy.extent().x1 + padX;
  const baseY = cy.extent().y1 + padY;

  // Only keep categories that actually have selected nodes
  const presentCategories = categoryOrder.filter((c) => groups[c]);
  if (groups["uncategorized"] && !presentCategories.includes("uncategorized")) {
    presentCategories.push("uncategorized");
  }

  let currentX = baseX;

  presentCategories.forEach((cat) => {
    const levels = groups[cat];
    if (!levels) return;

    const levelKeys = Object.keys(levels)
      .map(Number)
      .sort((a, b) => a - b);

    // Place each level as a column within this category band
    levelKeys.forEach((lvl, idx) => {
      const colX = currentX + idx * xSpacing;
      const nodes = levels[lvl];

      const totalHeight = (nodes.length - 1) * ySpacing;
      nodes.forEach((n, j) => {
        const y = baseY + j * ySpacing - totalHeight / 2;
        n.position({ x: colX, y }); 
      });
    });

    // advance X by the width of this category (its #levels) plus spacing
    const catWidth = (levelKeys.length - 1) * xSpacing;
    currentX += catWidth + categorySpacing;
  });

  cy.animate({ fit: { eles: selected, padding: 150 }, duration: 700 });

  // --- 6) Export structure
  const exported = presentCategories.map((cat) => ({
    category: cat,
    levels: Object.keys(groups[cat] || {})
      .map(Number)
      .sort((a, b) => a - b)
      .map((lvl) => ({
        level: lvl,
        nodes: (groups[cat][lvl] || []).map((n) => n.id()),
      })),
  }));

  //console.log("Dependency levels by class-category:", exported);
  return exported;
}
