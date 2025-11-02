"use strict"


/*
 ----------------------------------  main menu on display actions 
*/


import {
    getCy,
    labelAlias,
    labelNodeHide,
    setAndRunLayoutOptions,
    perimeterForEdgesAction,
    metrologie,
    distributeNodesHorizontally,
    distributeNodesVertically,
    alignNodesVertically,
    alignNodesHorizontally,
    rotateGraphByDegrees,
    noProportionalSize,
    setProportionalNodeSizeByLinks,
    changeFontSizeEdge,
    changeFontSizeNode,
    changePosRelative,
    labelId,
} from "../graph/cytoscapeCore.js";

import {
    pushSnapshot,
} from "../graph/snapshots.js";

import { ConstantClass } from "../util/common.js";



export function menuDisplay(option, item, whichClic = "left") {
    if (whichClic == "right") return;
    if (!cy) return;
    switch (option) {
        // -------------------------- fitscreen / selected

        case "fitScreen":
            pushSnapshot();
            getCy().fit();
            break;

        case "fitSelected":
            pushSnapshot();
            getCy().fit(
                getCy()
                    .nodes(":selected")
                    .union(getCy().nodes(":selected").connectedEdges()),
                50
            );
            break;

        /*
      -------------------------- layout options 
    */

        case "cose":
        case "cose-bilkent":
        case "grid":
        case "circle":
        case "breadthfirst":
        case "concentric":
        case "dagre":
        case "elk":
            pushSnapshot();
            setAndRunLayoutOptions(option);
            break;

        /*
        
      -------------------------- move resize 
    */
        case "H+":
            horizMore();
            break;

        case "H-":
            horizLess();
            break;

        case "V+":
            vertiMore();
            break;

        case "V-":
            vertiLess();
            break;

        case "B+":
            horizMore();
            vertiMore();
            break;

        case "B-":
            horizLess();
            vertiLess();
            break;
        /*
      -------------------------- move distribute & align
    */
        case "distH":
            pushSnapshot();
            distributeNodesHorizontally();
            break;

        case "distV":
            pushSnapshot();
            distributeNodesVertically();
            break;

        case "alignH":
            pushSnapshot();
            alignNodesHorizontally();
            break;

        case "alignV":
            pushSnapshot();
            alignNodesVertically();
            break;

        case "rotateL":
            rotateGraphByDegrees(-7.5);
            break;

        case "rotateR":
            rotateGraphByDegrees(7.5);
            break;

        case "rotate90":
            rotateGraphByDegrees(90);
            break;

        case "rotate180":
            rotateGraphByDegrees(180);
            break;

        // not linked to menu.
        case "separateH":
            separateCloseNodesHorizontal();
            break;
        case "separateV":
            separateCloseNodesVertical();
            break;

        //-------------- shape
        case "proportionalSize":
            setProportionalNodeSizeByLinks();
            break;
        case "noProportionalSize":
            noProportionalSize();
            break;
        //-------------------------------------------------------- Label

        case "labelAlias":
            labelAlias();
            break;

        case "labelNodeHide":
            labelNodeHide();
            break;

        case "labelId":
            labelId();
            break;

        case "increase-font":
            changeFontSizeNode(5);
            break;
        case "decrease-font":
            changeFontSizeNode(-1);
            break;
        case "restore-font":
            changeFontSizeNode(24, false);
            break;

        case "labelShow":
            // Show visible edges, or selected ones if any are selected
            let edgesToShow = perimeterForEdgesAction();

            for (let edge of edgesToShow) {
                if (edge.hasClass(ConstantClass.FK_DETAILED)) {
                    edge.addClass(`${ConstantClass.SHOW_COLUMNS}`);
                    //labelToShow = ele.data('columnsLabel').replace('\n', "<BR/>");
                } else {
                    // FK_SYNTH
                    edge.addClass(`${ConstantClass.SHOW_LABEL}`);
                }
            }
            break;

        case "labelHide":
            let edgesToHide = perimeterForEdgesAction();
            edgesToHide.removeClass(
                `${ConstantClass.SHOW_COLUMNS} ${ConstantClass.SHOW_LABEL}`
            );
            break;

        case "increase-font-edge":
            changeFontSizeEdge(5);
            break;
        case "decrease-font-edge":
            changeFontSizeEdge(-1);
            break;
        case "restore-font-edge":
            changeFontSizeEdge(18, false);
            break;
    }
    // refresh info bar
    metrologie();
}

/*
 used to resize node layout in any way horizontal or vertical or both 
*/

function horizMore() {
    changePosRelative(1.3, 1);
}
function horizLess() {
    changePosRelative(1 / 1.3, 1);
}
function vertiMore() {
    changePosRelative(1, 1.3);
}
function vertiLess() {
    changePosRelative(1, 1 / 1.3);
}

/*
 this is not yet used
*/
export function visibility(option) {
  if (!cy) return;
  switch (option) {
    case "front":
      bringSelectedToFront();
      break;
    case "back":
      bringSelectedToBack();
      break;
  }
}
