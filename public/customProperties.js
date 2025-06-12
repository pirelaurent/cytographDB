/*
 adaptation to specific database 
*/

import {cy} from "./main.js";

/*
 associated classes to separate nodes into catagories . 
 will be called after initial load of nodes
*/

export function createCustomProperties() {
 createCustomAerowebbProperties();
}
/*
 associated styles . 
 will be added to standard style to create mergedStyles
*/
export function getCustomStyles(){
  return getCustomStylesAeroWebb();
}

/*
 if useful can apply a configuration to nodes after initial loading
 NOT IMPLEMENTED
*/

export function setCustomPosition(){
 setCustomPositionAeroWebb();
}

/*----------------------------------------------
 Arowebb : use beginning of table name to separate domains 
*/

export function createCustomAerowebbProperties(){
  cy.nodes().forEach((node) => {
    // types d'associations
    let nbOut = node.outgoers("edge").length;
    let nbIn = node.incomers("edge").length;
    if (nbOut >= 2 && nbIn == 0) {
      if (nbOut == 2) {
        const allCols = node.data.columns || [];
        const fkCols = node.data.foreignKeys || [];
        // association porteuse de sens ou pas
        const hasOnlyColsForFK = allCols.length === fkCols.length;
        if (hasOnlyColsForFK) node.data("association", "true");
      } else {
        node.data("multiAssociation", "true");
      }
    } else {
      node.data("association", "false");
    }

    if (nbOut == 0 && nbIn == 0) {
      node.data("orphan", "true");
    } else {
      node.data("orphan", "false");
    }
    // type de couleurs spécial Aerowebb

    // spécial AW en se basant sur les noms de tables par domaine

    const match = node.id().match(/^(h_[^_\-]+|[^_\-]+)/);
    if (match) {
      node.data("category", match[1]); // ex : 'h_bidm' ou 'bidm'
    }
    if (node.id().startsWith("h_")) node.data("historic", "true");
  });
}

/*----------------------------------------------
 Arowebb : GUI aspects
*/

function getCustomStylesAeroWebb(){
return [
{
    selector: 'node[category = "bire"],node[category = "h_bire"] ',
    style: {
      "background-color": "#A6D8FF",
      "border-color": "#3A8CC1",
      "border-width": 2,
      color: "black",
    },
  },
  {
    selector: 'node[category = "bido"],node[category = "h_bido"]',
    style: {
      "background-color": "#FFB3A7",
      "border-width": 1,
      "border-color": "#CC7830",//#C65A4C",
      color: "black",
    },
  },
  {
    selector: 'node[category = "bidt"],node[category = "h_bidt"]',
    style: {
      "background-color": "#B4F0A7",
      "border-color": "#4B9444",
      "border-width": 1,
    },
  },
  {
    selector: 'node[category = "bidm"],node[category = "h_bidm"]',
    style: {
      "background-color": "#FFF3A3",
      "border-color": "#C1AD2F",
      "border-width": 1,
    },
  },
  {
    selector: 'node[category = "bsde"],node[category = "h_bsde"]',
    style: {
      "background-color": "#D3C7F9",
      "border-color": "#8066C3",
      color: "black",
      "border-width": 1,
    },
  },
  {
    selector: 'node[category = "qrtz"]',
    style: {
      "background-color": "rgba(223, 112, 112, 0.4)",
      "color": "black",
      "border-width": 1,
    },
  },
  {
    selector: "edge.doubleSelect",
    style: {
      "line-color": "orange",
      "width": 4
    }
  },

  {
    selector: 'node[association = "true"]',
    style: {
      shape: "ellipse",
      color: "#222",
      "border-width": 3,
            'border-style': 'dotted'
    },
  },
  {
    selector: 'node[multiAssociation = "true"]',
    style: {
      shape: "ellipse",
      "border-width": 6,

      'border-style': 'double'
    },
  },

  {
    selector: 'node[orphan = "true"]',
    style: {
      shape: "octagon",
    },
  },
 
  {
    selector: 'node[historic = "true"]',
    style: {
      shape: "triangle",
      color: "black",
      width: "20",
  
    },
  },




  // doublage car doivent arriver après le spécifique pour être actif 
  {
    selector: "node:selected",
    style: {
      "border-width": 10,
      "border-color": "brown",
      "border-style": "dashed",

      //"background-color": "dimgray", //"yellow",
      //"color": "lightgray",
      //"z-index": "9999",
    },
  },
  {
    selector: "node.doubleSelect",
    style: {
      "border-width": 4,
      "border-color": "yellow",
      "border-style": "double",
      "background-color": "chartreuse",
      "color": "black"
    }
  },
];
}

/*
 separate domains for AW to automate ?
*/

function setCustomPositionAeroWebb(){



}