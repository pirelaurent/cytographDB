"use strict";

/*
 when a graph is created by 'create graph from DB' , 
 a node have an array of "foreignKeys", each one detailed as follow 
  [
  {
    "constraint_name": "fk_prod_comp_fact",
    "source_schema": "public",
    "source_table": "production_line",
    "target_schema": "public",
    "target_table": "factory",
    "comment": null,
    "column_mappings": [
      {
        "source_column": "company_id",
        "source_not_null": true,
        "target_column": "company_id"
      },
      {
        "source_column": "factory_id",
        "source_not_null": true,
        "target_column": "id"
      }
    ],
    "all_source_not_null": true,
    "is_target_unique": false,
    "on_delete": "a",
    "on_update": "a"
  },


At create time, every FK are an edge with label of constraint_name


        "data": {
          "source": "production_line",
          "target": "factory",
          "label": "fk_prod_comp_fact",
          ...
The server added the class .fk_synth to remember this is a synthetic foreign key.




      As every edges of a constraint are the same except for column, 
       the first in the array is used to create a new edge.
       but the nullable is recalculated using the group array

new created edges are added with the class 'fk_synth'
*/

import { getCy } from "../graph/cytoscapeCore.js";
import { perimeterForEdgesAction } from "../core/perimeter.js";
import { ConstantClass, encodeCol2Col } from "../util/common.js";



/*
  when a FK enter datail mode ie one edge per columns corresponance 
  we muas preserve the original to restore it later 
  the map savedSyntheticFkOriginal will be added to JSON export to allow to restore in same views
*/

let savedSyntheticFkOriginal = new Map();


function saveFkOriginal(id, edge) {
  const data = edge.data();

  const clone = {
    id: data.id,
    source: data.source,
    target: data.target,
    constraint_name: data.constraint_name,
    label: data.label,
    fkColumns: JSON.stringify(data.fkColumns), // <<<<<< SERIALISATION
    onDelete: data.onDelete,
    onUpdate: data.onUpdate,
    nullable: data.nullable,
    alias: data.alias,
    label: data.label,
    classes: edge.classes(),
  };
  savedSyntheticFkOriginal.set(id, clone);
}

function searchFkOriginal(someId) {
  return savedSyntheticFkOriginal.get(someId)
}

function deleteFkOrigin(someId) {
  savedSyntheticFkOriginal.delete(someId)
}

/*
 think about clear when changind graph
*/

export function clearSavedSyntheticFkOriginal() {
  savedSyntheticFkOriginal.clear();
}

/*
 swap the edges synthetic with detailed
 initial Fk is saved into savedSyntheticFkOriginal
 global : true/false comes from options in menu 

 some synthEdges comes from a specific selection 
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
  create the detailed edges from the original synthetic
*/
export function enterFkDetailedModeForEdges(synthEdges) {
  const cy = getCy();

  cy.batch(() => {
    synthEdges.forEach(edge => {
      const originalId = edge.id();

      saveFkOriginal(originalId, edge);

      const fkCols = edge.data("fkColumns");
      const showLabel = edge.hasClass(ConstantClass.SHOW_LABEL);

      // 🔥 IMPORTANT : utiliser les data() pour source/target
      const src = edge.data("source");
      const tgt = edge.data("target");
      const sameConstraint = edge.data("constraint_name");
      fkCols.forEach(col => {
        const columnLabel = encodeCol2Col(col.source_column, col.target_column);

        const newEdge = cy.add({
          group: "edges",
          data: {
            originalId,
            label: columnLabel,
            source: src,
            target: tgt,
            constraint_name: sameConstraint,
            // only the synthetic keep fkColumn: Not in detailed
            _display: columnLabel,
          }
        });

        newEdge.addClass(`${ConstantClass.FK_DETAILED}`);
        if (showLabel) newEdge.addClass(`${ConstantClass.SHOW_LABEL}`);
      });
      edge.remove();
    });

  });
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
  if (edges.length == 0) {
    return false;
  }
  enterFkSynthesisModeForEdges(edges);
}



/*
 from a bucket of detailed edges, find those from same origin (via same label)
 Take the first to be root ot the refactored simple edge 
*/

export function enterFkSynthesisModeForEdges(edges) {
  // be sure of detailed selection
  edges = edges.filter(e => e.hasClass(`${ConstantClass.FK_DETAILED}`));
  if (edges.length === 0) {
    console.log('no selection');
    return;
  }
  const cy = getCy();

  const originals = new Map();

  edges.forEach(e => {
    const oid = e.data("originalId");
    if (oid && !originals.has(oid)) {
      originals.set(oid, e);
    }
  });

  originals.forEach((edgeAny, originalId) => {
    const src = edgeAny.data("source");
    const tgt = edgeAny.data("target");

    // 🔥 NE SURTOUT PAS filtrer par constraint_name
    const detailed = cy.edges().filter(e =>
      e.data("originalId") === originalId &&
      e.data("source") === src &&
      e.data("target") === tgt
    );

    const originalData = searchFkOriginal(originalId);
    if (originalData) {
      const clean = {
        id: originalData.id,
        source: originalData.source,
        target: originalData.target,
        constraint_name: originalData.constraint_name,
        label: originalData.label,
        fkColumns: JSON.parse(originalData.fkColumns), // <<<<<< DESERIALISATION
        onDelete: originalData.onDelete,
        onUpdate: originalData.onUpdate,
        nullable: originalData.nullable,
        alias: originalData.alias,
        label: originalData.label,
        _display: originalData._display ?? originalData.label,

      };

      /* create clean edge */
      const restored = cy.add({
        group: 'edges',
        data: clean
      });

      restored.addClass(originalData.classes);
      deleteFkOrigin(originalId);
    }

    detailed.remove();
  });
}




export function logEdge(edge, label = '') {
  const srcId = edge.data('source');
  const tgtId = edge.data('target');
  const srcNodeId = edge.source().id();
  const tgtNodeId = edge.target().id();

  console.log(`=== EDGE ${label} (${edge.id()}) ===`);
  console.log('data =', edge.data());
  console.log('data.source =', srcId, ' | data.target =', tgtId);
  console.log('source().id() =', srcNodeId, ' | target().id() =', tgtNodeId);
  console.log('classes =', edge.classes().join(' '));
  console.log('-----------------------------');
}
