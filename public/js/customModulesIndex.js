"use strict";
/*
    set here import to let modules visible into the application
    set them into public/custom  directory as this is out of the git upload 
    as a js module app, path must be relative : 
*/
// main.js (aucun import statique vers des modules optionnels !)
const optionalModules = [
  '../custom/democytodb.js',
  '../custom/AWProject.js',
  '../custom/fake.js',
];

// on déclenche les imports sans attendre qu’ils finissent
optionalModules.forEach(spec => {
  import(spec).then(() => {
    console.info('[custom] chargé :', spec);
  }).catch(err => {
    console.debug('[custom] ignoré :', spec, err?.message || err);
  });
});

// la suite de ton appli part immédiatement
//startApp(); // <-- rien n’est bloqué

/*
    to avoid upload of modif in YOUR LOCAL REPO : 
    git update-index --skip-worktree public/customModulesIndex.js
*/