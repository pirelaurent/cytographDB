// Copyright (C) 2025 Laurent P.
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



/*
 adaptation to specific database 
 new categories must be pushed into customCategories 
*/

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


