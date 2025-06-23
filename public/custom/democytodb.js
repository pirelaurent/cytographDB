
import { cy } from "../main.js";
import { addCustomCategories, registerCustomModule } from "../customCategories.js";

console.log("[DEBUG] democytodb.js chargé");

/*----------------------------------------------
  module name
*/
 const democytodbModule = {
  /*
    define specfic properties to this DB nodes
  */
  createCustomCategories() {
    cy.nodes().forEach((node) => {
      /* 
        add class for visual effect and set the style in getCustomStyles
      */

      let nbOut = node.outgoers("edge").length;
      let nbIn = node.incomers("edge").length;

      //  search associations = only fk, not referenced
      if (nbOut > 0 && nbIn == 0) {
        // add class for gui purpose . declare it in getCustomStyles
        node.addClass("association");
      }

      /*
        add optional property to facilitate filter in GUI through
        nodes > filter by > custom categories > 
      */
      // search for root tables : no output
      if (nbOut == 0 && nbIn > 0) {
        addCustomCategories(node, ["root table"]);
        // add also a class for visual 
        node.addClass("root");
      }
    });
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
          "border-width": 3,
         
        },
      },
      {
        selector: "node.root",
        style: {
          shape: "triangle",
          color: "#222",
          "background-color": "lime",

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
