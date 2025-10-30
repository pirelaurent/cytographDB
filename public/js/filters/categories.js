// Copyright (C) 2025 pep-inno.com
// This file is part of CytographDB (https://github.com/pirelaurent/cytographdb)
//

import { getCy } from "../graph/cytoscapeCore.js";

import { fillInGuiNodesCustomCategories } from "../ui/custom.js";

import { NativeCategories } from "../util/common.js";

/*
 adaptation to specific database 
 new categories must be pushed into customCategories 
*/
const customModules = [];
/*
  custom added classes to be proposed in gui filter
*/
let customNodesCategories = new Set();

export function getCustomNodesCategories() {
  return customNodesCategories;
}

export function setCustomNodesCategories(someSet) {
  customNodesCategories = someSet;
}
/*
 declarative association between a dbName and a module
 The module must register itself. 
*/
export function registerCustomModule(dbPattern, moduleObject) {
  const pattern =
    dbPattern instanceof RegExp ? dbPattern : new RegExp(`^${dbPattern}$`); // string exacte par défaut
  customModules.push({ pattern, module: moduleObject });
}

/*
 find the first that match 
*/

function getCustomModule(dbName) {
  // ⚠️ Avoid regex with  flag "g"
  const entry = customModules.find((e) => e.pattern.test(dbName));
  return entry?.module;
}

let standardCategories = new Set([
  NativeCategories.ORPHAN,
  NativeCategories.ROOT,
  NativeCategories.LEAF,
  NativeCategories.ASSOCIATION,
  NativeCategories.MULTI_ASSOCIATION,
  NativeCategories.HAS_TRIGGERS,
]);

// if we don't want to sse these class in hover , fill in internalCategories
//export let internalCategories = new Set(['fk_detailed', 'fk_synth', 'showLabel','showColumns'])

export let internalCategories = new Set();

/*
 custom classes are stored with graph, but customNodesCatories has to be restored
 by creating a set of all found classes of node 
 and eliminate standard nodes categories and internal classes 
*/

export function restoreCustomNodesCategories() {
  let allClasses = new Set();

  getCy()
    .nodes()
    .forEach((node) => {
      node.classes().forEach((cls) => allClasses.add(cls));
    });
  let filtered = new Set(
    [...allClasses].filter(
      (cls) => !standardCategories.has(cls) && !internalCategories.has(cls)
    )
  );
  setCustomNodesCategories(filtered);
  fillInGuiNodesCustomCategories();
}

/*
 associated classes to separate nodes into catagories . 
 will be called after initial load of nodes
*/

export function createCustomCategories(myCurrentDB) {


  const mod = getCustomModule(myCurrentDB);
  if (mod?.createCustomCategories) {
    mod.createCustomCategories();
  } else {
    console.log(`No customCategories registered for ${myCurrentDB}`);
  }

  // allows to alias the label 
  if(mod?.setLabelAlias){

    mod.setLabelAlias();
  }
}

export function enforceLabelToAlias(myCurrentDB){
  const mod = getCustomModule(myCurrentDB);
  if(mod?.setLabelAlias){
    mod.setLabelAlias();
  }
}




/*
 associated styles . 
 will be added to standard style to create mergedStyles
*/

export function getCustomStyles(myCurrentDB) {
  const mod = getCustomModule(myCurrentDB);
  if (mod) {
    let blocStyle = mod.getCustomStyles();
    return blocStyle;
  } else {
    return [];
  }
}

/*
 standard categories created before custom using classes 
*/

function allColumnsAreFK(node) {
  const fkGroups = node.data("foreignKeys") || [];
  const fkSourceCols = new Set();

  // Récupérer toutes les colonnes sources des FK
  fkGroups.forEach((fk) => {
    (fk.column_mappings || []).forEach((mapping) => {
      if (mapping.source_column) {
        fkSourceCols.add(mapping.source_column);
      }
    });
  });

  // Récupérer toutes les colonnes du node
  const allColumns = (node.data("columns") || []).map((col) => col.column);

  // Vérifier s'il existe une colonne qui n'est pas dans fkSourceCols
  const hasNonFK = allColumns.some((col) => !fkSourceCols.has(col));

  return !hasNonFK; // true si toutes les colonnes sont des FK
}

/*
 Native categories based on number and type of edges 
*/

export function setNativeNodesCategories() {
  // due to relaod of previously misannotated node in stored json
  const classesToRemove = [
    NativeCategories.LEAF,
    NativeCategories.ROOT,
    NativeCategories.ASSOCIATION,
    NativeCategories.MULTI_ASSOCIATION,
  ];
  getCy()
    .nodes()
    .forEach((node) => {
      node.removeClass(classesToRemove.join(" "));

      if (node.data("triggers")?.length > 0)
        node.addClass(NativeCategories.HAS_TRIGGERS);

      const nbOut = node.outdegree();
      const nbIn = node.indegree();

      /*
      On a standard graph all nodes without incoming are root. 
      By default, functional root and association come into standard 'root' category.
      

    */
      if (nbIn === 0 && nbOut === 0) {
        // strict definition of a root in a directed graph
        // we prefer to distinguish orphan individually
        node.addClass(NativeCategories.ORPHAN);
        return;
      }

      if (nbOut === 0) {
        node.addClass(NativeCategories.LEAF);
        return;
      }

      /* 
  An association is identified if : 
      - it has a minimum of 2 FK
      - it has no other columns than those involved in these FK 
 */

      if (nbIn === 0 && nbOut === 2 && allColumnsAreFK(node)) {
        node.addClass(NativeCategories.ASSOCIATION);
        return;
      }

      // either more than 2 branches , either Two with extra column

      if (nbIn === 0 && nbOut >= 2) {
        node.addClass(NativeCategories.MULTI_ASSOCIATION);
        return;
      }

      // other case already done
      if (nbIn === 0) node.addClass(NativeCategories.ROOT);
    });
}
