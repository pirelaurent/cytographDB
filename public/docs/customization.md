# Customization

You can enhance your graph for your specific databases by 
- adding in a module : 
  - **Custom categories** to enable element filtering
  - **Custom styles** for tables of standard and custom categories
  - a list of db names you want to associate with this customization

---

## Principles

cytographDB scan the directory *custom*, searching for js files and run them.   
These codes must 
- create a *module* then 
- link it to a pattern
  - either exact name: `registerCustomModule("democytodb", democytodbModule);` 
  - either a regex  : `registerCustomModule(/demo.*/, democytodbModule)` 
   
When a graph is loaded, the app calls two functions expected from the corresponding module:  

```js
  createCustomCategories(current_db);
  getCustomStyles(current_db);
```

### democytodb custom module as an example

 *public/custom/democytodb.js*
```js



import {
  getCy,
} from "../js/graph/cytoscapeCore.js"

import { registerCustomModule, getCustomNodesCategories } from "../js/filters/categories.js";

/*----------------------------------------------
  module name
*/
const democytodbModule = {
  /*
    define specfic properties to this DB nodes
  */
  createCustomCategories() {
    // categories for nodes 
    getCy().nodes().forEach((node) => {
      /* 
        add custom category (class in cyto) that allows filter
        for visual effect set a style in getCustomStyles
      */
      if (node.data("label").includes("product")) node.addClass("product");
    });
    // register the category 
    getCustomNodesCategories().add("product");
  },

  /*----------------------------------------------
  GUI aspects
  method returns a json defining new style for the 'myClass' set in createCustomCategories  
  */

  getCustomStyles() {
    return [
      {
        selector: "node.product",
        style: {
          "color": "#b82641",
          "font-size": "30px",
          "font-style": "italic"
        },
      },
    ];
  },
};
/* 
 autoregister the module 
 - by exact name between quotes : registerCustomModule("democytodb", democytodbModule);
 - with a regex to match several names with same module 
 */
registerCustomModule(/democyto.*/, democytodbModule);

```



##  Steps to create your own Custom Module

1. **Create a `myModule.js` file**  
   Use `democytodb.js` as a reference template.

   Don't forget to link this module to your dbNames.

    ```js
    registerCustomModule("myExactlyNamedDBtest", myModule);
    // or regex
    registerCustomModule(/myDB.*/, myModule);
    
    ```

2. **put the file in** `public/custom`

To verify : 
At startup a log in the navigator console show loaded custom modules : ```[custom] loaded : /custom/democytodb.js```

#### Note : 

This custom folder is excluded in the github reference from version control to protect user-specific code.
It's up to you to organize the saving of your own modules in *custom*. 

  `.gitignore` Rule:

``` bash
# Optional: exclude custom modules except for democytodb.js
/public/custom/*
!/public/custom/democytodb.js
```

--- 

## custom documentation 

You can set your owwn documentation under ***custom/docs***.

If any ***index\.md*** is found by cytographdb at startup in this directory,  it will add a secondary link on the right of *documentation* :  

![](./img/customLink.png)

This can give custom details and custom examples. 

For the day, this is not related to any dbName, rather to your own file structure (as it is excluded by gitignore)

---



- ⚪️ [return to Main](./main.md)
