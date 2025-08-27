// Copyright (C) 2025 pep-inno.com
// This file is part of CytographDB (https://github.com/pirelaurent/cytographdb)
// 


import { getCy } from "../graph/cytoscapeCore.js";

import {fillInGuiNodesCustomCategories} from "../ui/custom.js";

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
export let standardCategories = new Set(['orphan','root','leaf','association','multiAssociation','hasTriggers']);
export let internalCategories = new Set(['fk_detailed', 'fk_synth', 'showLabel','showColumns'])

/*
 custom classes are stored with graph, but customNodesCatories has to be restored
 by creating a set of all found classes of node 
 and eliminate standard nodes categories and internal classes 
*/

export function restoreCustomNodesCategories(){  
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

  if (customModules[myCurrentDB]) {
    customModules[myCurrentDB].createCustomCategories(); 
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





export function createNativeNodesCategories() {
  getCy().nodes().forEach((node) => {
    if (node.data("triggers")?.length > 0) node.addClass("hasTriggers");

    // Dédupliqué : une destination table = 1
    const outTargets = new Set(
      node.outgoers("edge").map(edge => edge.target().id())
    );
    const nbOut = outTargets.size;

    const inSources = new Set(
      node.incomers("edge").map(edge => edge.source().id())
    );
    const nbIn = inSources.size;


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

    if (nbOut === 0 && nbIn > 0) {
      node.addClass("root");
    }

      if (nbOut === 1 && nbIn === 0) {
      node.addClass("leaf");
    }
  });
}
