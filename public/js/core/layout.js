import { getCy } from "../graph/cytoscapeCore.js";
import {perimeterForNodesAction} from "../core/perimeter.js";
import { NativeCategories } from "../util/common.js";
import { showAlert } from "../ui/dialog.js";





export function changePosRelative(xFactor, yFactor) {
  // si au moins deux sélectionnés, on les écartent

  let nodesToMove = getCy().nodes(":selected:visible");
  if (nodesToMove.length < 2) nodesToMove = getCy().nodes(":visible");
  if (nodesToMove.length === 0) return;
  // 1. Calculer le centre des nœuds
  let sumX = 0,
    sumY = 0;
  nodesToMove.forEach((node) => {
    const pos = node.position();
    sumX += pos.x;
    sumY += pos.y;
  });

  const centerX = sumX / nodesToMove.length;
  const centerY = sumY / nodesToMove.length;

  nodesToMove.positions((node) => {
    const pos = node.position(); // position actuelle
    return {
      x: centerX + (pos.x - centerX) * xFactor,
      y: centerY + (pos.y - centerY) * yFactor,
    };
  });
}

export function distributeNodesHorizontally() {
  let nodes = getCy().nodes(":selected:visible");
  if (nodes.length < 2) nodes = getCy().nodes(":visible");
  if (nodes.length < 2) return;

  const sorted = nodes.sort((a, b) => a.position().x - b.position().x);

  const minX = sorted[0].position().x;
  const maxX = sorted[sorted.length - 1].position().x;
  const step = (maxX - minX) / (nodes.length - 1);

  sorted.forEach((node, index) => {
    node.position({
      x: minX + step * index,
      y: node.position().y,
    });
  });

  getCy().nodes(":visible").length === 0 ? getCy().fit() : null;
}

export function distributeNodesVertically() {
  let nodes = getCy().nodes(":selected:visible");
  if (nodes.length < 2) nodes = getCy().nodes(":visible");
  if (nodes.length < 2) return;

  const sorted = nodes.sort((a, b) => a.position().y - b.position().y);

  const minY = sorted[0].position().y;
  const maxY = sorted[sorted.length - 1].position().y;
  const step = (maxY - minY) / (nodes.length - 1);

  sorted.forEach((node, index) => {
    node.position({
      x: node.position().x,
      y: minY + step * index,
    });
  });

  getCy().nodes(":visible").length === 0 ? getCy().fit() : null;
}

export function alignNodesVertically() {
  let nodes = getCy().nodes(":selected:visible");
  if (nodes.length < 2) nodes = getCy().nodes(":visible");
  if (nodes.length < 2) return;

  // middleX comme moyenne des x
  let middleX = 0;
  nodes.forEach((node) => {
    middleX += node.position().x;
  });
  middleX = middleX / nodes.length;

  const sorted = nodes.sort((a, b) => a.position().x - b.position().x);
  /* middleX comme le milieu des plus éloignés 
  const minX = sorted[0].position().x;
  const maxX = sorted[sorted.length - 1].position().x;
  const middleX = (maxX - minX) / 2;
*/
  sorted.forEach((node) => {
    node.position({
      x: middleX,
      y: node.position().y,
    });
  });

  getCy().nodes(":visible").length === 0 ? getCy().fit() : null;
}

export function alignNodesHorizontally() {
  let nodes = getCy().nodes(":selected:visible");
  if (nodes.length < 2) nodes = getCy().nodes(":visible");
  if (nodes.length < 2) return;

  let middleY = 0;
  nodes.forEach((node) => {
    middleY += node.position().y;
  });
  middleY = middleY / nodes.length;

  nodes.forEach((node) => {
    node.position({
      x: node.position().x,
      y: middleY,
    });
  });

  getCy().nodes(":visible").length === 0 ? getCy().fit() : null;
}


//-----------------------
export function rotateGraphByDegrees(deg) {
  const angle = (deg * Math.PI) / 180;

  let nodes = getCy().nodes(":selected:visible");
  if (nodes.length < 2) nodes = getCy().nodes(":visible");
  if (nodes.length === 0) return;

  // Get center of graph (optional: you can also use a fixed point)
  const bb = nodes.boundingBox();
  const cx = (bb.x1 + bb.x2) / 2;
  const cy_ = (bb.y1 + bb.y2) / 2;

  nodes.forEach((node) => {
    const pos = node.position();
    const x = pos.x - cx;
    const y = pos.y - cy_;

    const xNew = Math.cos(angle) * x - Math.sin(angle) * y + cx;
    const yNew = Math.sin(angle) * x + Math.cos(angle) * y + cy_;

    node.position({ x: xNew, y: yNew });
  });
}

// utilitaire pour calculer le centre d’un groupe de nœuds
export function getCenter(nodes) {
  const sum = nodes.reduce(
    (acc, n) => {
      const p = n.position();
      acc.x += p.x;
      acc.y += p.y;
      return acc;
    },
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / nodes.length,
    y: sum.y / nodes.length,
  };
}

/*
 avoid far node wheh unhidden by limiting distance 
*/
export function revealNeighbor(edge, maxDist = 1000) {
  const src = edge.source();
  const tgt = edge.target();

  // which one is hidden in the pair
  const hiddenNode = tgt.hidden() ? tgt : src.hidden() ? src : null;
  const visibleNode = hiddenNode === tgt ? src : tgt;

  // none : no matter
  if (hiddenNode) {
    // base : the previously visible
    const pos = visibleNode.position();

    // a small move to avoid superposition
    const angle = Math.random() * 2 * Math.PI;
    const dx = maxDist * Math.cos(angle);
    const dy = maxDist * Math.sin(angle);

    //  show in new position
    hiddenNode.position({ x: pos.x + dx, y: pos.y + dy });
    hiddenNode.show();
  }
}

export function setAndRunLayoutOptions(option) {
    const cy=getCy();
  let layoutName = option ?? "cose-bilkent";
  // choix du périmètre

  let selectedNodes = perimeterForNodesAction();
  /*   if (selectedNodes.length < 3) {
    showAlert(
      "not enough nodes to calculate layout (>3).<br/> Check your selection"
    );
    return;
  } 
*/

  const maxCircle = 50;
  if (selectedNodes.length > maxCircle && option === "circle") {
    showAlert(
      `too much nodes for a visible circle layout (<${maxCircle})<br/> Choose another layout`
    );
    return;
  }

  // add edges to selection to see them after reorg
  const connectedEdges = selectedNodes
    .connectedEdges()
    .filter(
      (edge) =>
        selectedNodes.contains(edge.source()) &&
        selectedNodes.contains(edge.target())
    );

  const selection = selectedNodes.union(connectedEdges);

  //console.log("setAndRunLayoutOptions:" + layoutName);
  //common
  let layoutOptions = {
    name: layoutName,
    animate: true,
    nodeDimensionsIncludeLabels: true,
    fit: true,
  };

  switch (layoutName) {
    case "dagre":
      Object.assign(layoutOptions, {
        name: "dagre",
        rankDir: "LR", // 'TB' (haut→bas), 'LR' (gauche→droite)
        nodeSep: 50, // espace entre nœuds d’un même rang
        edgeSep: 10, // espace entre arêtes d’un même rang
        rankSep: 80, // espace entre rangs
        //align: "DL", // alignement dans un rang: 'UL', 'UR', 'DL', 'DR'
        //acyclicer: "greedy", // casse les cycles par heuristique si ton graphe n’est pas DAG
        ranker: "tight-tree", //"network-simplex", // (ou 'tight-tree', 'longest-path')
        //nodeDimensionsIncludeLabels: true,
        //fit: true,
        padding: 30,
        numIter: 1100,
      });
      break;

    case "cose":
      Object.assign(layoutOptions, {
        nodeRepulsion: 1000000,
        gravity: 10,
        // idealEdgeLength: 100,
        // edgeElasticity: 0.4,
        // numIter: 1000,
        fit: false,
      });
      break;

    case "cose-bilkent":
      Object.assign(layoutOptions, {
        name: "cose-bilkent", // redéclaré explicitement si nécessaire
        nodeRepulsion: 1000000,
        idealEdgeLength: 160,
        edgeElasticity: 0.1,
        gravity: 0.25,
        numIter: 1000,
      });
      break;

    case "circle":
      selectedNodes
        .layout({
          name: "circle",
          fit: false,
        })
        .run();

      cy.fit(cy.elements(), 40);

      return; //
      break;

    /*
        take all visible 
      */
    case "breadthfirst":
      const rootNodes = selectedNodes.filter(`.${NativeCategories.ROOT}`);

      Object.assign(layoutOptions, {
        direction: "upward",
        //orientation: "vertical",
        circle: true,
        //grid: true,
        avoidOverlap: true,
        directed: true,
        spacingFactor: 1.2,
        roots: rootNodes,
      });
      // if user had selected only roots enlarge to all nodes , otherwise apply to selection
      if (rootNodes.length == selectedNodes.length)
        selectedNodes = getCy().nodes(":visible");
      selectedNodes.layout(layoutOptions).run();
      return; //

      break;

    case "elk":
      Object.assign(layoutOptions, {
        algorithm: "layered",
        direction: "RIGHT",
        spacing: 50,
        nodePlacement: "BRANDES_KOEPF",
      });
      break;
  }

  try {
    selection.layout(layoutOptions).run();
  } catch (error) {
    showAlert("unable to apply this layout:" + error.message);
  }

  cy.fit();
}

