/*
  basic style for the graph 
  extended specifically later
  https://manual.cytoscape.org/en/3.9.1/Styles.html
*/

export function getCyStyles() {
  return cyStyles;
}


const cyStyles = [
  {
    selector: "node",
    style: {
      shape: "roundrectangle",
      label: "data(label)",
      "text-wrap": "wrap",
      "text-valign": "center",
      "text-halign": "center",
      "font-size": "18px",
      padding: "5px",

      "text-wrap": "wrap",
      "text-max-width": 200,
      height: "16px",
      width: "label",
      "min-width": 40,
      "min-height": 20,
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
    selector: "edge",
    style: {
      width: 2,
      "line-color": "#aaa",
      "target-arrow-color": "#888",
      "target-arrow-shape": "vee",
      "arrow-scale": 1.2,
      "curve-style": "straight",
      label: "",
      "font-size": "12px",
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
    selector: "edge.showLabel",
    style: {
      label: "data(label)",
      "line-style": "dotted",
      "line-color": "#aaa",
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
    selector: "edge.internal",
    style: {
      "line-color": "gold",
      "line-style": "dotted",
    },
  },

  {
    selector: "edge:selected",
    style: {
      "line-color": "DarkSlateGray",
      "target-arrow-color": "black",
      "line-style": "dashed",
      "z-index": 1002, // higher than not selected
      width: 2,
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
      "target-arrow-shape": "circle",
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

  // must enforce the color otherwise cytoscape don't fade colored edges
  {
    selector: "edge.faded",
    style: {
      opacity: 0.40,
      "line-color": "#ccc",
      "target-arrow-color": "#ccc",
      "source-arrow-color": "#ccc",
      "text-opacity": 0.1,
    },
  },

  {
    selector: "node:selected",
    style: {
      "border-width": 10,
      "border-color": "orangered",
      "border-style": "dashed",
    },
  },

  {
    selector: ".hidden",
    style: {
      display: "none",
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
    selector: "node.root",
    style: {
      shape: "triangle",
      color: "#222",
      "background-color": "lime",
    },
  },
 
];
