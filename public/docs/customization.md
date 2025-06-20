# Customization 

To enhance a specific database graph one can add : 
- custom styles for choosen tables 
- custom tags to filter elements 

## Extension points : customModules 

On loading a graph, the code call the following internal methods: 

``` js
getCustomStyle();
createCustomCategories(); 
```

These methods can be automatically relayed to custom modules that rewrite there own equivalent methods. 

in the module must be declared the overlapping function 

``` js
import { cy } from "../main.js";
import { addCustomCategories, registerCustomModule } from "../customCategories.js";

// declare module inline with expected functions
const myModule = {
 getCustomStyles(){
  //some code taht return an array 
 },
  createCustomCategories(){
//some code to ass classes and tags to nodes 
  }

 } 
 //module must registered itself with one or several dbnames in order to be loaded such a DB is used.
 registerCustomModule("myDBtest", myModule);
 registerCustomModule("myDBstaging", myModule);
``` 


## Create your own customization module

#### create a *myModule.js*  file 
 use democytodb.js as a sample 

#### deposit your file into public/custom 

As an opensource, this app cannot embark customer code by inadvertence.
Putting a file under *custom* prevents from an upload in repository  using **.gitignore** 
``` bash
# optional specfic categories not to be saved
/public/custom/*
!/public/custom/democytodb.js
``` 

## weave the module  

Your module must be imported within the application to be operationnal 

### patch customModulesIndex.js 

``` javascript
/*
    set here import to let modules visible into the application
    set  them into ./custom  directory as this one is out of the git upload 
*/
import './custom/democytodb.js';

// ------------ adding myModule -----------------
import './custom/myModule.js';
``` 
restart the application. 

Each time you pen a db named *myDBtest* or *myDBstaging* myModule will be called to adapt aspect and tags of the generated graph. 

---- 