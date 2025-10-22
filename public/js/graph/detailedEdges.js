"use strict";

/*
 when a graph is created by 'create graph from DB' , 
 it has the detailed edges 'FK per column'. 
 in the array of FK of a node table ( "foreignKeys" ) a fk constraint has details in its array column_mappings: 
 {
              "constraint_name": "line_product_product_id_fkey",
              "source_table": "line_product",
              "target_table": "product",
              "comment": null,
              "column_mappings": [
                {
                  "source_column": "product_id",
                  "source_not_null": true,
                  "target_column": "id"
                }
              ],
              "all_source_not_null": true,
              "is_target_unique": true,
              "on_delete": "c",
              "on_update": "a"
            }
}
At create time, every FK-colmun had created an edge 
with label and columnsLabel

        "data": {
          "source": "line_product",
          "target": "product",
          "label": "line_product_product_id_fkey",
          "columnsLabel": "product_id --> id",
          ...
More, the server has added the class .fk_detailed to every edge

For presentation purpose, 
At startup, the graph is reduced to simple FK by calling 
      saveDetailedEdges();  that store current details 
      enterFkSynthesisMode(); that reduce the graph to simple edges

      it creates an dict of constraints and for each constraint an array of edges.
      As every edges of a constraint are the same except for column, 
       the first in the array is used to create a new edge.
       but the nullable is recalculated using the group array

previous edges are deleted 
new created edges are added with the class 'fk_synth'
*/

import { getCy, perimeterForEdgesAction } from "../graph/cytoscapeCore.js";
import { NativeCategories, ConstantClass } from "../util/common.js";

let detailedEdgesArray; // to be able to reverse, store details here

// called at startup now as request load details
export function saveDetailedEdges() {
  detailedEdgesArray = getCy().edges(); // cytoscape collection, not array

  //document.getElementById('toggle-fk-mode').textContent = 'toggle details n --> 1';
}

/*
 swap the edges synthetic with detailed
 Security for reloaded graph from json 
 as they can have been saved synthetic or detailed
 global act on the full edges, otherwise in perimeter

 global : false from menu 
*/

export function enterFkDetailedModeForEdges(synthEdges) {
  const originalArray = [];
  synthEdges.forEach((synth) => {
    detailedEdgesArray
      .filter((e) => e.data("label") === synth.data("label"))
      .forEach((e) => {
        if (synth.hasClass(NativeCategories.TRIGGER_IMPACT)) return;
        if (synth.selected()) e.select();
        else e.unselect();
        if (synth.hasClass("showLabel"))
          e.addClass(`${ConstantClass.SHOW_COLUMNS}`);
        else e.removeClass(`${ConstantClass.SHOW_COLUMNS}`);
        originalArray.push(e);
      });
  });
  // must change an array in a cy collection
  const original = getCy().collection(originalArray); // <- conversion Array -> collection
  getCy().batch(() => {
    synthEdges.remove();
    getCy().add(original);
  });
}

/*
    restore details from a synth edge 
*/

export function enterFkDetailedMode(global = true) {
  let synthEdges;

  if (global) {
    synthEdges = getCy().edges(".fk_synth");
  } else {
    synthEdges = perimeterForEdgesAction().filter(".fk_synth");
  }

  // if no edge to restore
  if (synthEdges.length == 0) return false;

  enterFkDetailedModeForEdges(synthEdges);
}

/*
 when nodes are deleted in mode 1 per FK, the stored details are not aware of. 
 We can clean obsolete details here .
*/

export function cleanDetailedEdgesArray() {
  // note all valid ids

  const cy = getCy();
  const nodeSet = new Set(cy.nodes().map((n) => n.id()));

  // to note detailed on the flow

  let toDrop = cy.collection();

  // as some nodes could have been deleted in fk mode, detailed are not more valid

  detailedEdgesArray.forEach((aDetailedEdge) => {
    /*
    console.log('edge id:', edge.id());
    console.log('source node id:', edge.source().id());
    console.log('target node id:', edge.target().id());
    // ou via data :
    console.log('source id (data):', edge.data('source'));
    console.log('target id (data):', edge.data('target'));
    */
    const sourceId = aDetailedEdge.source().id();
    const destId = aDetailedEdge.target().id();

    if (nodeSet.has(sourceId) && nodeSet.has(destId)) {
      cy.add(aDetailedEdge);
    } else {
      toDrop = toDrop.union(aDetailedEdge);
      console.log(`missing nodes to restore details ${sourceId} or ${destId}`);
    }
  });

  detailedEdgesArray = detailedEdgesArray.difference(toDrop);
}

/*
 swap the edges detailed with synthetic
 global: false when coming from menu , true for load/save
*/

export function enterFkSynthesisMode(global = true) {
  let edges;
  if (global) {
    edges = getCy().edges(`.${ConstantClass.FK_DETAILED}`);
  } else {
    edges = perimeterForEdgesAction().filter(`.${ConstantClass.FK_DETAILED}`);
  }

  // stored graph could be synthetic only
  if (edges.length == 0) {
    // showInfo("already in mode 1 per FK");
    return false;
  }

  //document.getElementById('toggle-fk-mode').textContent = 'toggle details 1 --> n';

  enterFkSynthesisModeForEdges(edges);
}

/*
 from a bucket of detailed edges, find those from same origin (via same label)
 Take the first to be root ot the refactored simple edge 
*/

export function enterFkSynthesisModeForEdges(edges) {
  const grouped = {};
  // information for synthesis is inside detailed
  edges.forEach((edge) => {
    const constraintName = edge.data("label");
    if (!grouped[constraintName]) {
      grouped[constraintName] = [];
    }
    grouped[constraintName].push(edge);
  });

  // here a dict of groups by fk label

  // remove detailed from cy but they are stored in a global collection
  edges.remove();

  // add a synthetic edge for a group of detailed
  Object.entries(grouped).forEach(([constraintName, edgeGroup]) => {
    const first = edgeGroup[0];
    const source = first.data("source");
    const target = first.data("target");
    const onDelete = first.data("onDelete");
    const onUpdate = first.data("onUpdate");

    // synthétique FK nullable if at leeast one element is nullable
    const nullable = edgeGroup.some((e) => e.data("nullable"));
    const labeled = edgeGroup.some((e) =>
      e.hasClass(`${ConstantClass.SHOW_COLUMNS}`)
    );

    getCy().add({
      group: "edges",
      data: {
        source,
        target,
        label: constraintName,
        onDelete,
        onUpdate,
        nullable,
      },
      classes: [
        "fk_synth",
        onDelete === "c" ? "delete_cascade" : "",
        nullable ? "nullable" : "",
        labeled ? "showLabel" : "",
      ]
        .filter(Boolean)
        .join(" "),
    });
  });
}
