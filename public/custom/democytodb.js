


import {
  getCy,
} from "../js/graph/cytoscapeCore.js"


import {   registerCustomModule, getCustomNodesCategories } from "../js/filters/categories.js";

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

      /*
        same as orphan in native category. 
        set here for an example how to 
      */
      let nbOut = node.outgoers("edge").length;
      let nbIn = node.incomers("edge").length;
      if (nbOut == 0 && nbIn > 0) {
        node.addClass("root");
      }
    });
    /*
     more than simple visual effect through class 
     adding the class in customNodesCategories will propose it to filter in gui 
    */

    getCustomNodesCategories().add("root");
  },

  /*----------------------------------------------
  GUI aspects
  method returns a json defining new style for the 'myClass' set in createCustomCategories  

  */

  getCustomStyles() {
    return [
      {
        selector: "node.association",
        style: {
          shape: "ellipse",
          color: "#222",
          "background-color": "#FFB3A7",
          "border-style": "dotted",
        },
      },

      {
        selector: "node.association.start-node",
        style: {
          "border-width": "10px",
          "border-style": "solid",
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
