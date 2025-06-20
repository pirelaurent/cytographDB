/*
 adaptation to specific database 
 new categories must be pushed into customCategories 
*/

export const customModules = {};
export let customCategories ={};

/*
 add a set of entries [ a,b,c] into customProperties 
 at this day, add native to index.html to see the option
*/

export function addCustomCategories(element, props) {
  // add to node data
  const current = element.data('customCategories') || [];
  const merged = Array.from(new Set([...current, ...props]));
  element.data('customCategories', merged);
 // add to global list 
 props.forEach(ajouterCategorie);
}

/*
 this list will be used to propose filter in IHM 
*/
function ajouterCategorie(categ) {
  customCategories[categ] = (customCategories[categ] || 0) + 1;
// add to gui
}


export function registerCustomModule(dbName, moduleObject) {
  //console.log("register module "+dbName)
  customModules[dbName] = moduleObject;
}

export function clearCustomCategories(){
  customCategories = {};
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


