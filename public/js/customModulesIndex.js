/*
    set here import to let modules visible into the application
    set  them into ./custom  directory as this one is out of the git upload 
    to avoid upload of modif IN THIS LOCAL REPO : 
    git update-index --skip-worktree public/customModulesIndex.js

*/
import '../custom/democytodb.js';

// adding myModule
import '../custom/AWProject.js';
import '../custom/HSW.js';