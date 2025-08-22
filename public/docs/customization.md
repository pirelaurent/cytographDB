# Customization

You can enhance your graph for a specific database by 
- adding a module : 
  - **Custom categories** to enable element filtering
  - **Custom styles** for tables of standard and custom categories
- declaring the module to be associated to some db names you want to enhance

---

## Principles

When a graph is loaded, the app calls two methods for custom enhancements with db name as parameter:

```js
  createCustomCategories(current_db);
  getCustomStyles(current_db);
```
with the name of `current_db' 
- the app retrieve an associated module in an internal collection **customModules[]** . 
- the app call the corresponding methods defined inside the module.


### Code of the democytodb custom module as an example

```js
import {
  getCy,
} from "../js/graph/cytoscapeCore.js"
import {   registerCustomModule, getCustomNodesCategories } from "../js/filters/categories.js";

console.log("[DEBUG] democytodb.js custom is loaded");
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
 It's your module responsibility to register itself with DB names it applies to
*/
registerCustomModule("democytodb", democytodbModule);
registerCustomModule("democytodbV2", democytodbModule);
```

---

##  Create your own Custom Module

1. **Create a `myModule.js` file**  
   Use `democytodb.js` as a reference template.

   Don't forget to link this module to your dbNames.
   For example:

    ```js
    registerCustomModule("myDBtest", myModule);
    registerCustomModule("myDBstaging", myModule);```


2. **put the file in**:  
   `public/custom`

> Remember : this folder is excluded from version control to protect user-specific code.

see  `.gitignore` Rule:

``` bash
# Optional: exclude custom modules except for democytodb.js
/public/custom/*
!/public/custom/democytodb.js
```

---

## Weave Your Module with the App

To activate your module:

**Declare your code in `public/js/customModulesIndex.js`**  

```js
//... add you module here 
const optionalModules = [
  '../custom/democytodb.js',
  '../custom/myModule.js',
  '../custom/fake.js',
];
// the following try to load your module as a module .
// if failed you will have a message in console, but app continue.  

```
**Restart the application**

✅ From now on, whenever you open a DB named `myDBtest` or `myDBstaging`,  
the `myModule` customization will be applied automatically.


## add your custom documentation 

You can set your owwn documentation under ***custom/docs***.

If any ***index\.md*** is found by cytographdb at startup in this directory,  it will add a secondary link on the right of *documentation* :  

![](./img/customLink.png)

This can give custom details and custom examples. 

---



- ⚪️ [Main](./main.md)
