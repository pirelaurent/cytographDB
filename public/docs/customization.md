# Customization

## Customization options

You can customize cytographDB for your databases on the following aspects: 

- Establish **custom categories** for your tables 
  - Allow to extend filter options in cytographDB 
  - **Custom styles** can be associated with your categories ( colors, shape,..)
- Establish **Alias name for labelling tables**  
- Establish **Alias name for labelling relations**

---

## Principles

cytographDB scan the directory *custom*, searching for js files and load them as an extension of cytographDB if they match the following constraints:

Such a source code must 
- declare an internal *module*  `const democytodbModule = { ...}`
- Register it with a pattern for matching Database names :
  - either exact name: `registerCustomModule("democytodb", democytodbModule);` 
  - either a regex  : `registerCustomModule(/demo.*/, democytodbModule)` 
   
Optionnaly declare and expose any of the three recognized services by cytographDB :  

```js
  createCustomCategories(){...}; // add classes to the nodes
  getCustomStyles(){...}; // return a style 
  setLabelAlias(){...}; // add alias on nodes or/and on edges
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

 setLabelAlias() {

    // Demo example using a dictionary for english to french aliasing

    const EN_FR = {
      authorization: "autorisation",
      company: "entreprise",
      employee: "employé",
      factory: "usine",
      intervention: "intervention",
      line_product: "gamme de produits", // ou "ligne de produit" selon ton contexte
      parameters: "paramètres",
      product: "produit",
      production_line: "ligne de production",
      skills: "compétences",
    }; 

    //act on whole graph
    const cy = getCy();

    // tables demo aliasing EN->FR
    cy.nodes().forEach((node) => {
      const current = node.id();
      let fr = EN_FR[current];
      if (fr) {
        node.data("alias", fr); // set new label
      }
    });

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

## Add your custom documentation 

You can set your owwn documentation under ***custom/docs***.

If any ***index\.md*** is found by cytographdb at startup in this directory,  it will add a secondary link on the right of *documentation* :  

<img src ="./img/customLink.png" width ="200px"/>

You can give custom details and custom examples. 

For the day, this custom documentation is not related to any dbName; It depends only of the file in custom/docs (which is excluded in standard cytographDB gitignore)

---

- ⚪️ [return to Main](./main.md)
