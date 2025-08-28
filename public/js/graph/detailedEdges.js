"use stricts"

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



import {
    getCy,
    perimeterForEdgesAction,
} from '../graph/cytoscapeCore.js';
import { showInfo } from '../ui/dialog.js';

let currentFkMode;

export function getCurrentFKMode() { return currentFkMode };
export function setCurrentFKMode(fkMode) { currentFkMode = fkMode };

let detailedEdgesArray; // to be able to reverse, store details here 

// called at startup now as request load details
export function saveDetailedEdges() {
    //console.log('on save les detailed Array')//PLA
    detailedEdgesArray = getCy().edges(); // cytoscape collection, not array
    currentFkMode = 'detailed';
    //document.getElementById('toggle-fk-mode').textContent = 'toggle details n --> 1';
}


/*
 swap the edges synthetic with detailed
 Security for reloaded graph from json 
 as they can have been saved synthetic or detailed
 global act on the full edges, otherwise in perimeter
*/

export function enterFkDetailedMode(global) {
    let synthEdges;
    if (global) {
        synthEdges = getCy().edges('.fk_synth');
    } else {
        synthEdges = perimeterForEdgesAction().filter('.fk_synth')
    }

//synthEdges.forEach(e => console.log(e.data('label'))); //PLA toutes les fk sont la 



    // verify we are in synthetic  
    if (synthEdges.length == 0) return false;

    // then change for stored detailed 




    //detailedEdgesArray.forEach(e => console.log(e.data('label')));//PLA les fk nullable n'ont qu'un élément 

    if (detailedEdgesArray.length != 0) {
        if (global) {
            getCy().batch(() => {
                synthEdges.remove();
                getCy().add(detailedEdgesArray)
            });
        }
        else {
            const originalArray = [];
            synthEdges.forEach(synth => {
                detailedEdgesArray.filter(
                    e => e.data('label') === synth.data('label')
                ).forEach(e => { 
                    if (synth.selected()) e.select();else e.unselect();
                    originalArray.push(e) 
                
                })
            })
            // must change an array in a cy collection 
            const original = getCy().collection(originalArray); // <- conversion Array -> collection
            getCy().batch(() => {
                synthEdges.remove();
                getCy().add(original);
            });
        }
    } else {
        showInfo("No detailed edges for this graph");
        return false;
    }
    currentFkMode = 'detailed';
    //document.getElementById('toggle-fk-mode').textContent = 'toggle details n --> 1';
    return true;
}

/*
 swap the edges detailed with synthetic
global: false when commin from menu , true for load/save
*/


export function enterFkSynthesisMode(global) {

    let edges;
    if (global) {
        edges =  getCy().edges('.fk_detailed');
    } else {
        edges = perimeterForEdgesAction().filter('.fk_detailed')
    }

    // stored graph could be synthetic only 
    if (edges.length == 0) {
        showInfo("no detailed edges to reduce for this graph");
        return false;
    }

    currentFkMode = 'synthesis';
    //document.getElementById('toggle-fk-mode').textContent = 'toggle details 1 --> n';

    const grouped = {};
    // information for synthesis is inside detailed 
    edges.forEach(edge => {
        const constraintName = edge.data('label')
        if (!grouped[constraintName]) {
            grouped[constraintName] = [];
        }
        grouped[constraintName].push(edge);
    });

    // Supprime les détaillées
    edges.remove();

    // Ajoute les synthétiques
    Object.entries(grouped).forEach(([constraintName, edgeGroup]) => {
        const first = edgeGroup[0];
        const source = first.data('source');
        const target = first.data('target');
        const onDelete = first.data('onDelete');
        const onUpdate = first.data('onUpdate');

        const nullable = edgeGroup.some(e => e.data('nullable'));

        getCy().add({
            group: 'edges',
            data: {
                source,
                target,
                label: constraintName,
                onDelete,
                onUpdate,
                nullable
            },
            classes: [
                'fk_synth',
                onDelete === 'c' ? 'delete_cascade' : '',
                nullable ? 'nullable' : ''
            ].filter(Boolean).join(' ')
        });
    });
}
