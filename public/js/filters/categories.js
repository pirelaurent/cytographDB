// Copyright (C) 2025 pep-inno.com
// This file is part of CytographDB (https://github.com/pirelaurent/cytographdb)
// 


import { getCy } from "../graph/cytoscapeCore.js";

import { fillInGuiNodesCustomCategories } from "../ui/custom.js";

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
    dbPattern instanceof RegExp
      ? dbPattern
      : new RegExp(`^${dbPattern}$`); // string exacte par défaut
  customModules.push({ pattern, module: moduleObject });
}

/*
 find the first that match 
*/

function getCustomModule(dbName) {

  // ⚠️ Avoid regex with  flag "g"
  const entry = customModules.find(e => e.pattern.test(dbName));
  return entry?.module;
}


export let standardCategories = new Set(['orphan', 'root', 'leaf', 'association', 'multiAssociation', 'hasTriggers']);
//export let internalCategories = new Set(['fk_detailed', 'fk_synth', 'showLabel','showColumns'])
export let internalCategories = new Set(); 

/*
 custom classes are stored with graph, but customNodesCatories has to be restored
 by creating a set of all found classes of node 
 and eliminate standard nodes categories and internal classes 
*/

export function restoreCustomNodesCategories() {
  let allClasses = new Set();

  getCy().nodes().forEach(node => {
    node.classes().forEach(cls => allClasses.add(cls));
  });
  let filtered = new Set(
    [...allClasses].filter(
      cls => !standardCategories.has(cls) && !internalCategories.has(cls)
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
  //console.log("createCustomCategories in customCategorie for "+myCurrentDB)

const mod = getCustomModule(myCurrentDB);
if (mod?.createCustomCategories) {
  mod.createCustomCategories();
} else {
  console.log(`No customCategories registered for ${myCurrentDB}`);
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

function countFKSourceColumns(node) {
  const fkGroups = node.data("foreignKeys") || [];

  const sourceCols = new Set();

  fkGroups.forEach(fk => {
    (fk.column_mappings || []).forEach(mapping => {
      if (mapping.source_column) {
        sourceCols.add(mapping.source_column);
      }
    });
  });

  return sourceCols.size;
}


/*
 Native categories based on number and type of edges 
*/

export function createNativeNodesCategories() {
  getCy().nodes().forEach((node) => {

    let debug;
    //debug = (node.id() === 'xxxxx');

    if (node.data("triggers")?.length > 0) node.addClass("hasTriggers");

    const nbOut = node.outdegree();


    const nbIn = node.indegree();
    if (debug) {
      console.log(node.id());
      console.log('nbout:' + nbOut + " outdegree:" + node.outdegree());
      console.log('nbIn:' + nbIn)
    }

    
    if (nbOut >= 2 && nbIn === 0) {
      if (nbOut === 2) {
        const allCols = node.data("columns") || [];
        const nbFKColumns = countFKSourceColumns(node);
        const hasOnlyColsForFK = (allCols.length === nbFKColumns);

        if (hasOnlyColsForFK) {
          node.addClass("association");
        }
        else {
          node.addClass("multiAssociation");
        }
      }
    }

    if (nbOut === 0 && nbIn === 0) {
      node.addClass("orphan");
    }

    // rectified to join internal cytoscapes definition 

    if (nbIn === 0 && nbOut > 0) {
      node.addClass("root");
    }

    // we leave 1 out for leaf 

    if (nbIn > 0 && nbOut === 0)  {
      node.addClass("leaf");
    }
  });
}
