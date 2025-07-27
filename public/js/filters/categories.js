// Copyright (C) 2025 pep-inno.com
// This file is part of CytographDB (https://github.com/pirelaurent/cytographdb)
// 


import { getCy } from "../graph/cytoscapeCore.js";

/*
 adaptation to specific database 
 new categories must be pushed into customCategories 
*/
const customModules = {};
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

export function registerCustomModule(dbName, moduleObject) {
  //console.log("register module "+dbName)
  customModules[dbName] = moduleObject;
}


/*
 associated classes to separate nodes into catagories . 
 will be called after initial load of nodes
*/

export function createCustomCategories(myCurrentDB) {
  //console.log("createCustomCategories in customCategorie for "+myCurrentDB)

  if (customModules[myCurrentDB]) {
    customModules[myCurrentDB].createCustomCategories(); // ✅ Appelle la fonction enregistrée
  } else {
    console.log(`No customCategories registered for ${myCurrentDB}`);
  }
}
/*
 associated styles . 
 will be added to standard style to create mergedStyles
*/
export function getCustomStyles(myCurrentDB) {
  if (customModules[myCurrentDB]) {
    let blocStyle = customModules[myCurrentDB].getCustomStyles();
    return blocStyle;
  } else {
    return [];
  }
}


/*
 standard categories created before custom using classes 
*/

export function createNativeNodesCategories() {
  getCy().nodes().forEach((node) => {
    if (node.data("triggers").length > 0) node.addClass("hasTriggers");

    let nbOut = node.outgoers("edge").length;
    let nbIn = node.incomers("edge").length;
    if (nbOut >= 2 && nbIn == 0) {
      if (nbOut == 2) {
        const allCols = node.data.columns || [];
        const fkCols = node.data.foreignKeys || [];
        // association porteuse de sens ou pas
        const hasOnlyColsForFK = allCols.length === fkCols.length;
        if (hasOnlyColsForFK) {
          node.addClass("association");
        }
      } else {
        node.addClass("multiAssociation");
      }
    }

    if (nbOut == 0 && nbIn == 0) {
      node.addClass("orphan");
    }
    // root node for pk 
    if (nbOut == 0 && nbIn > 0) {
      node.addClass("root")
    }

  });
}