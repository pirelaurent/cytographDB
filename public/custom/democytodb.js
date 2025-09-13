


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

