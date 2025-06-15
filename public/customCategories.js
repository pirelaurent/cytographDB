/*
 adaptation to specific database 
 new categories must be pushed into customCategories 
*/

import { cy } from "./main.js";

export const customModules = {};


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
  if(customModules[myCurrentDB]){
    let blocStyle =  customModules[myCurrentDB].getCustomStyles();
    return blocStyle;
  } else {
    return [] ;
  }
}


