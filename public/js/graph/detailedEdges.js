
import {
    getCy,

} from '../graph/cytoscapeCore.js';
import { showAlert } from '../ui/dialog.js';


let currentFkMode;
let detailedEdgesArray = []; // to be able to reverse, store details here 

// called at startup now as request load details
export function saveDetailedEdges() {
    detailedEdgesArray = getCy().edges();
    currentFkMode = 'detailed';
    document.getElementById('toggle-fk-mode').textContent = 'toggle details n --> 1';
}

/*
 toggle edge presentation 
*/
export function toggleFkMode() {
    const cy = getCy();
    // if called with no graph
    if (cy.edges().length === 0) return;

    switch (currentFkMode) {
        case 'detailed':
            enterFkSynthesisMode()
            break;
        case 'synthesis': enterFkDetailedMode();
            break;
    }
}

/*
 swap the edges synthetic with detailed
 Security for reloaded graph from json 
 as they can have been saved synthetic or detailed
*/

export function enterFkDetailedMode() {
    // verify we are in synthetic  
    const synthEdges = getCy().edges('.fk_synth');
    if (synthEdges.length == 0) return false;

    // then change for stored detailed 

    if (detailedEdgesArray.length != 0) {
        synthEdges.remove();
        getCy().add(detailedEdgesArray)
    } else {
        showAlert("No detailed edges stored with this graph");
        return false;
    }
    currentFkMode = 'detailed';
    document.getElementById('toggle-fk-mode').textContent = 'toggle details n --> 1';
    return true;
}

/*
 swap the edges detailed with synthetic
 Security for reloaded graph from json.
*/


export function enterFkSynthesisMode() {
    let edges = getCy().edges('.fk_detailed');
    // stored graph could be synthetic only 
    if (edges.length == 0) {
        showAlert("no detailed edges to synthetise for this graph" ); 
            return false;
        }

    currentFkMode = 'synthesis';
    document.getElementById('toggle-fk-mode').textContent = 'toggle details 1 --> n';

    const grouped = {};
    // information for synthesis is inside detailed 
    edges.forEach(edge => {
        const label = edge.data('label');
        const constraintName = label.split('\n')[0];

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
