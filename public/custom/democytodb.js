import { getCy } from "../js/graph/cytoscapeCore.js";

import {
  registerCustomModule,
  getCustomNodesCategories,
} from "../js/filters/categories.js";

/*----------------------------------------------
  module name
*/
const democytodbModule = {
  /*
    define specfic properties to this DB nodes
  */
  createCustomCategories() {
    // categories for nodes
    getCy()
      .nodes()
      .forEach((node) => {
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
          color: "#b82641",
          "font-size": "30px",
          "font-style": "italic",
        },
      },
    ];
  },

  /*
   by default a node takes the name of the table in its label. 
   This method when exist overwrite the default so you can give a spécific label.
   In this example, label drop the first part like bire_ 
  */

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

     // relations demo aliasing by collection 
    cy.edges().forEach((edge) => {
      const current = edge.data("label");

      // example of collection of relations name to alias

      const DICO_FK = {
        "authorization_company_id_factory_id_production_line_id_fkey": "autorisation d'accès",
        "employee_chief_fk": "supérieur hiérarchique",
        "employee_works_with_fk": "collègue de travail",
        "factory_company_id_fkey": "usine de l'entreprise",
        "intervention_factory_id_fkey": "intervention dans l'usine",
        "line_product_product_id_fkey": "ligne de produit pour",
        "production_line_factory_id_fkey": "ligne de production de l'usine",
      };
      const fr =DICO_FK[current];
      if(fr) edge.data("alias", fr);//:edge.data("alias",edge.data("label")); // set new label

       //console.log(JSON.stringify(edge.data(),0,2));//PLA
    }) 

     

  },
} //module


/* 
 autoregister the module 
 - by exact name between quotes : registerCustomModule("democytodb", democytodbModule);
 - with a regex to match several names with same module 
 */
registerCustomModule(/democyto.*/, democytodbModule);
