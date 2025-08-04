
import {
    getCy,

} from '../graph/cytoscapeCore.js';

let savedDetailedEdges = []; // to be able to reverse, store details here 

let currentFkMode = 'synthesis'; // set on in loadInitialGraph
/*
 change edge presentation 
*/
export function toggleFkMode() {
    //console.log('toggle'+currentFkMode)//PLA
    const cy = getCy();
    if (cy.edges().length === 0) return;
    if (currentFkMode === 'detailed') {
        enterFkSynthesisMode(cy);
        currentFkMode = 'synthesis';
        document.getElementById('toggle-fk-mode').textContent = 'toggle details 1 --> n';
    } else {
        enterFkDetailedMode(cy);
        currentFkMode = 'detailed';
        document.getElementById('toggle-fk-mode').textContent = 'toggle details n --> 1';
    }
}


export function enterFkDetailedMode() {
    // Supprimer les synthétiques
    const synthEdges = getCy().edges('.fk_synth');
    synthEdges.remove();

    // Restaurer les détaillées
    if (savedDetailedEdges) getCy().add(savedDetailedEdges);
}




export function enterFkSynthesisMode() {
    savedDetailedEdges = getCy().edges('.fk_detailed');
    const edges = savedDetailedEdges;
    const grouped = {};

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
                nullable ? 'nullable' : 'required'
            ].filter(Boolean).join(' ')
        });
    });
}
