/*
    set here import to let modules visible into the application
    set them into public/custom  directory as this is out of the git upload 
    as a js module app, path must be relative : 
*/
import '../custom/democytodb.js';

// adding other specific modules
import '../custom/AWProject.js';
import '../custom/HSW.js';

/*
    to avoid upload of modif in YOUR LOCAL REPO : 
    git update-index --skip-worktree public/customModulesIndex.js
*/