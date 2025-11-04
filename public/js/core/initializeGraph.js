import { getCy } from "../graph/cytoscapeCore.js";
import {
  createCustomCategories,
  getCustomStyles,
} from "../filters/categories.js";
import { fillInGuiNodesCustomCategories } from "../ui/custom.js";
import { getLocalDBName } from "../dbFront/tables.js";
import {setAndRunLayoutOptions} from "./layout.js";
import { ConstantClass } from "../util/common.js";
import { metrologie } from "./metrology.js";

//--------------------------
export function initializeGraph(data, fromDisk = false) {
    const cy=getCy();
  // cy a été créé avec des data vides , mais si on s'en est servi, faut nettoyer
  if (typeof cy !== "undefined" && cy) {
    cy.elements().remove();
  }
  cy.add(data);

  //console.log(cy.edges()); // on a bien columnsLabel dans data

  let current_db = getLocalDBName();

  // customize nodes**to be moved after reduction
  //setNativeNodesCategories();

  createCustomCategories(current_db);

  // here ok for alias
  let moreStyles = getCustomStyles(current_db);
  let mergedStyles = getCyStyles().concat(moreStyles);
  cy.style(mergedStyles).update();

  fillInGuiNodesCustomCategories();
  cy.once("layoutstop", () => { });

  //avoid layout when come from disk
  if (!fromDisk) {
    setAndRunLayoutOptions();
  }
  metrologie();
}

export function getCyStyles() {
  return cyStyles;
}

const cyStyles = [
  // ------------ global helper
  {
    selector: ".hidden",
    style: {
      display: "none",
    },
  },

  /*
  -------------------- nodes 
*/
  {
    selector: "node",
    style: {
      shape: "roundrectangle",
      label: "data(label)",

      // Position du texte
      "text-halign": "center", // centré horizontalement
      "text-valign": "center", // bottom aligné en bas du nœud

      // Décalage vers l’extérieur (positif = plus bas quand 'bottom')
      //x'text-margin-y': 20,

      "text-wrap": "wrap",
      /* to have back white under label 
    'text-background-color': '#fff',
    'text-background-opacity': 0.5,
    'text-background-shape': 'roundrectangle',
    'text-background-padding': 0,
*/

      "font-size": "24px",
      padding: "2px",
      "text-max-width": 200,
      width: "40px", //PLA ne change rien
      height: "40px",
      width: "label",
      /* overwritten into proportionalSizeNodeSizeByLinks 
      "min-width": 40,
      "min-height": 20,
   */
      "border-color": "#111111",
      "background-color": "#A6D8FF",
      color: "black",
      "border-width": 1,
    },
  },

  {
    selector: "node.faded",
    style: {
      opacity: 0.35,
    },
  },

  {
    selector: "node.hovered",
    style: {
      "overlay-color": "#ffcc00",
      "overlay-opacity": 0.3,
    },
  },

  {
    selector: "node.no-links-hidden",
    style: {
      display: "none",
    },
  },

  {
    selector: "node.start-node",
    style: {
      "border-width": "10px",
      "border-color": "chartreuse",
      "border-style": "solid",
    },
  },
  {
    // leaf is modified in setProportionalNodeSizeByLinks
    selector: "node.leaf",
    style: {
      shape: "triangle",
      color: "#222",
      width: 40,
      height: 34, // equilateral (Math.sqrt(3) / 2) * L;
      "background-color": "lime",
    },
  },
  {
    // root is modified in setProportionalNodeSizeByLinks
    selector: "node.root",
    style: {
      shape: "round-triangle",
      color: "#000000",
      //width: 20,
      //height: 45,
      //"border-color": "DarkTurquoise",
      "background-color": "red",
    },
  },
  {
    selector: "node.association",
    style: {
      shape: "ellipse",
      color: "#222",
      //width:40,
      //height:40,
      "border-color": "#8a615a",
      "background-color": "#FFB3A7",
      // "border-style": "dotted",
    },
  },
  {
    selector: "node.multiAssociation",
    style: {
      shape: "ellipse",
      "border-color": "#8a615a",
      "background-color": "#ffb3a7",
      "border-width": 6,
      "border-style": "double",
    },
  },

  {
    selector: "node.orphan",
    style: {
      shape: "pentagon",
      color: "#222",
      "background-color": "#bbca9a", // ou une couleur par défaut
      "border-style": "solid", // pour éviter l'écrasement du style sélectionné
      "border-width": 1,
    },
  },

  {
    selector: "node:selected",
    style: {
      "border-width": 10,
      "border-color": "chartreuse",
      "border-style": "dashed",
      "border-width": 20,

      color: "black",
      "font-weight": "bold",
      //'text-outline-width': 2,
      //'text-outline-color': '#ffeb3b',   // halo autour du texte
      //'text-background-color': '#ffeb3b',
      //'text-background-opacity': 1,
      //'text-background-shape': 'roundrectangle',
      //'text-border-width': 1,
      "text-border-opacity": 1,
      "text-wrap": "wrap",
      "text-margin-y": -2,
    },
  },

  {
    selector: "node.hasTriggers",
    style: {
      "background-image": "/img/trigger2.png", // center is anchor
      "background-width": "22px",
      "background-height": "22px",
      "background-position-x": "50%", // anchor x relative to horizontal x of node
      "background-position-y": "96%", // anchor y relative to vertical y of node
      //'background-offset-x': '-7px',
      //'background-offset-y': '+3px',
      "background-repeat": "no-repeat",
    },
  },

  /*
  --------------- edges
*/

  {
    selector: "edge",
    style: {
      "width": 2,
      "line-color": "#aaa",
      "target-arrow-color": "#888",
      "target-arrow-shape": "vee",
      "arrow-scale": 1.2,
      "curve-style": "straight",
      label: "",
      "font-size": "18px",
      "text-rotation": "autorotate",
      "target-arrow-shape": "triangle",
    },
  },
  {
    // en fait il joue sur tous mais évite l'erreur cyto quand source = dest
    // il faut le placer avant les autres coloriages
    selector: "edge", //ex [selfLoop = true]',
    style: {
      "curve-style": "bezier", // Pour que l'arc soit incurvé
      "control-point-step-size": 60, // Distance du loop
      "loop-direction": "0deg", // Angle du loop
      "loop-sweep": "60deg", // Largeur de l'arc
      "target-arrow-shape": "triangle",
      "arrow-scale": 1.5,
      "z-index": 1000, // plus haut que le nœud
    },
  },
  // when creating a PNG, edge line is not enough deep to be printed later.

  {
    selector: "edge.forPNG",
    style: {
      width: 8,
      "line-color": "black",
      "target-arrow-color": "black",
    },
  },

  {
    selector: "edge.delete_cascade",
    style: {
      //'line-color': '#e74c3c',
      //'target-arrow-color': 'crimson',
      //'target-arrow-shape': 'vee',
      "arrow-scale": 1.2,
      "source-arrow-shape": "circle",
      "source-arrow-color": "#888",
      //'line-style': 'dashed',
      //'width': 4
    },
  },

  {
    selector: "edge.nullable",
    style: {
      //'line-style': 'dotted',
      "line-color": "#77B5FE", // bleu ciel
      //
      "target-arrow-color": "#77B5FE",
      width: 2,
    },
  },

  {
    selector: "edge.showLabel",
    style: {
      label: "data(label)",
      "line-style": "dotted",
      //"line-color": "#aaa",
      "text-rotation": "none", // keep horizontal
      "text-margin-y": -10, // move vertically
      width: 2,

      "target-arrow-shape": "triangle", // ✅ requis
      "target-arrow-color": "#aaa",
      "source-arrow-color": "#aaa",
      //'target-arrow-width': 6, // doesn't work
      //'target-arrow-height': 8,
    },
  },
  {
    selector: "edge.showColumns",
    style: {
      label: "data(columnsLabel)",
      "line-style": "dotted",
  
      "text-rotation": "none", // keep horizontal
      "text-margin-y": -10, // move vertically
      width: 2,

      "target-arrow-shape": "triangle", // ✅ required
      "target-arrow-color": "#aaa",
      "source-arrow-color": "#aaa",
      //'target-arrow-width': 6, // doesn't work
      //'target-arrow-height': 8,
    },
  },

  {
    selector: "edge.internal",
    style: {
      "line-color": "#9A7B4F",
      "line-style": "dotted",
    },
  },

  // surlignage sélection (pas de couleur ici)
  {
    selector: "edge:selected",
    style: {
      "line-style": "dashed",
      "z-index": 1002,
      "width": 6,
    },
  },

  {
    selector: "edge.trigger_impact",
    style: {
      "line-color": "darkOrchid",
      "target-arrow-color": "darkOrchid",
      "target-arrow-shape": "triangle",
      "line-style": "dashed",
      width: 2,
    },
  },

  {
    selector: "edge.trigger_impact:selected",
    style: {
      width: 4,
    },
  },

  {
    selector: "edge.simplified",
    style: {
      "curve-style": "bezier",
      "line-style": "dotted",
      "target-arrow-shape": "triangle",
      "source-arrow-shape": "circle",
      "line-color": "orange",
      "target-arrow-color": "orange",
      "source-arrow-color": "orange",
      width: 2,
    },
  },

  {
    selector: "edge.simplified:selected",
    style: {
      "line-color": "red",
      "target-arrow-color": "black",
      "line-style": "dashed",
      width: 2,
    },
  },

  {
    selector: "edge.outgoing",
    style: {
      "line-color": "green",
      "target-arrow-color": "rgb(66, 128, 5)",
    },
  },
  {
    selector: "edge.incoming",
    style: {
      "line-color": "red",
      "target-arrow-color": "red",
    },
  },

  {
    selector: "edge.outgoing:selected",
    style: {
      "line-color": "green",
      "target-arrow-color": "rgb(66, 128, 5)",
    },
  },
  {
    selector: "edge.incoming:selected",
    style: {
      "line-color": "red",
      "target-arrow-color": "red",
    },
  },

  {
    selector: "edge.fk_detailed",
    style: {
      "line-color": "#9683EC",
      "target-arrow-shape": "triangle",
      "target-arrow-color": "#6952cf",
      "source-arrow-color": "#6952cf",
      color: "#3317ad",
    },
  },

  // Variante quand l’edge est aussi "nullable"
  {
    selector: "edge.fk_detailed.nullable",
    style: {
      "line-color": "#c770e9", // bleu ciel
      "target-arrow-color": "#c770e9",
    },
  },
  /* 
    // must enforce the color otherwise cytoscape don't fade colored edges
    {
      selector: "edge.faded",
      style: {
        opacity: 0.4,
        "line-color": "#ccc",
        "target-arrow-color": "#ccc",
        "source-arrow-color": "#ccc",
        "text-opacity": 0.1,
      },
    },
  
  {
        selector: '.hidden-edge',
        style: {
          'opacity': 0,
          'events': 'no'
        }
      },
  
      // --- Arêtes normales ---
      {
        selector: 'edge',
        style: {
          'width': 1,
          'line-color': '#aaa',
          'target-arrow-shape': 'triangle',
          'target-arrow-color': '#aaa',
          'curve-style': 'bezier'
        }
      },
    
  
    {
        selector: 'node',
        style: {
          'label': 'data(id)',
          'text-valign': 'center',
          'text-halign': 'center',
          'text-wrap': 'wrap',
          'text-max-width': 100,
          'text-background-color': '#fff',
          'text-background-opacity': 0.8,
          'text-background-padding': 2,
          'font-size': 10
        }
      }, */

  // --- Parents en mode expanded ---
  {
    selector: 'node:parent.expanded',
    style: {
      'background-color': '#eaf3ff',
      'border-width': 2,
      'border-color': '#0077cc',
      'padding': 20,
      'compound-sizing-wrt-labels': 'exclude',
      'text-valign': 'top',
      'text-halign': 'center',
      'text-margin-y': -10
    }
  },

  // --- Parents en mode collapsed ---
  {
    selector: 'node:parent.collapsed',
    style: {
      'background-color': '#eaf3ff',
      'border-width': 2,
      'border-color': '#0077cc',
      'width': 90,
      'height': 60,
      'padding': 5,
      'text-valign': 'center',
      'text-halign': 'center',
      'compound-sizing-wrt-labels': 'exclude' // 👈 important

    }
  },

  // --- Enfants cachés mais existants ---
  {
    selector: '.hidden-child',
    style: {
      'opacity': 0,
      'text-opacity': 0,
      'background-opacity': 0,
      'border-width': 0,
      'events': 'no'
    }
  },

  // --- Arêtes cachées ---
  {
    selector: '.hidden-edge',
    style: {
      'opacity': 0,
      'events': 'no'
    }
  },

  {
    selector: `edge.${ConstantClass.SHOW_LABEL}`,
    style: {
      "label": "data(_display)",
      /* future enhancement
      "source-label": "data(_display)",
    'text-rotation': 'autorotate',
    'source-text-offset': 14,               // along the edge from the source
    'text-margin-y': 8,                     // perpendicular offset
    'text-outline-width': 2,
    'text-outline-color': '#fff'  
    */
    },
  },
];
