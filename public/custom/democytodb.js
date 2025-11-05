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
        "fk_auth_comp_emp_fact_prod_line": "autorisation d'accès",
        "fk_emp_chief": "supérieur hiérarchique",
        "fk_emp_works_with": "collègue de travail",
        "fk_fact_comp": "usine de l'entreprise",
        "fk_line_prod_prod": "intervention dans l'usine",
        "fk_prod_comp_fact": "ligne de produit pour",
        "fk_prod_comp_fact": "ligne de production de l'usine",
        "fk_skills_comp_emp": "a pour compétences"
      };
      const fr =DICO_FK[current];
      if(fr) edge.data("alias", fr);//:edge.data("alias",edge.data("label")); // set new label

      // console.log(JSON.stringify(edge.data(),0,2));//PLA
    }) 

     

  },
} //module


/* 
 autoregister the module 
 - by exact name between quotes : registerCustomModule("democytodb", democytodbModule);
 - with a regex to match several names with same module 
 */
registerCustomModule(/democyto.*/, democytodbModule);
