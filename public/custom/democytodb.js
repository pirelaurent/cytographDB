


import {
  getCy,
} from "../js/graph/cytoscapeCore.js"


import { registerCustomModule, getCustomNodesCategories } from "../js/filters/categories.js";

console.log("[DEBUG] democytodb.js chargé");

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
        add class for visual effect and set the style in getCustomStyles
      */

      if (node.data("label").includes("product")) node.addClass("product");

    });
    /*
     more than simple visual effect through class 
     adding the class in customNodesCategories will propose it to filter in gui 
    */

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
          "color": "#6D071A",
          "font-size": "25px",
          "font-style": "italic"

        },
      },


    ];
  },
};
/* 
 autoregister this module 
 as soon as the module is in the code visibility 
 => add the import into 

 */
registerCustomModule("democytodb", democytodbModule);
registerCustomModule("democytodbV2", democytodbModule);
