# Customization

You can enhance your graph for a specific database by 
- adding in a module : 
  - **Custom categories** to enable element filtering
  - **Custom styles** for tables of standard and custom categories
  - a list of db names you want to associate with this customization

---

## Principles

cytographDB scan the directory *custom*, searching for js files .   
It loads the corresponding modules.
The modules associates DBnames to be used with it.    

When a graph is loaded, the app calls two functions :  

```js
  createCustomCategories(current_db);
  getCustomStyles(current_db);
```

- the app try to retrieve an associated module in an internal collection **customModules[]** . 
- then it call the previous functions, those defined inside the module.


### democytodb custom module as an example

 *public/custom/democytodb.js*
```js
import {
  getCy,
} from "../js/graph/cytoscapeCore.js"
import {   registerCustomModule, getCustomNodesCategories } from "../js/filters/categories.js";

// must declare a module as follow:
const democytodbModule = {
  // method to customize styles
  getCustomStyles() {
    // Return an array of styling rules  - see source code
  },
  // method to create custom categories for filter or for styling 
  createCustomCategories() {
    // Add custom classes and categories to nodes - see source code
  }
};

/*
The module mustregister itself with the DB names list it applies to
*/
registerCustomModule("democytodb", democytodbModule);
registerCustomModule("democytodbV2", democytodbModule);

```



##  Create your own Custom Module

1. **Create a `myModule.js` file**  
   Use `democytodb.js` as a reference template.

   Don't forget to link this module to your dbNames.
   For example:

    ```js
    registerCustomModule("myDBtest", myModule);
    registerCustomModule("myDBstaging", myModule);
    
    ```

2. **put the file in** `public/custom`

a log in the navigator console show custom modules : ```[custom] loaded : /custom/democytodb.js```



#### Note : 

this folder is excluded from version control to protect user-specific code.

  `.gitignore` Rule:

``` bash
# Optional: exclude custom modules except for democytodb.js
/public/custom/*
!/public/custom/democytodb.js
```

---

## Weave Your Module with the App

The only thing you have to do is to put your module source code in the *public/custom* directory.
and to **restart the application**

✅ From now on, whenever you open a DB named `myDBtest` or `myDBstaging`,  
the `myModule` customization will be applied automatically.

You can leave several modules in the custom dir

--- 

# custom documentation 

You can set your owwn documentation under ***custom/docs***.

If any ***index\.md*** is found by cytographdb at startup in this directory,  it will add a secondary link on the right of *documentation* :  

![](./img/customLink.png)

This can give custom details and custom examples. 

---



- ⚪️ [Main](./main.md)
