/*
 snapshot(s) connected to undo and ctrl Z
*/

import {
      restoreProportionalSize,
} from "./cytoscapeCore.js";

import { getCy } from "./cytoscapeCore.js"

export let positionStackUndo = [];
const maxUndo = 20;

export function resetSnapshot() {
  positionStackUndo = [];
}

export function pushSnapshot() {
  if (!getCy()) return;

  const json = getCy().json();
  const selectedIds = getCy().elements(":selected").map((ele) => ele.id());
  const hiddenIds = getCy().elements(":hidden").map((ele) => ele.id());

  let snapshot = {
    json,
    selectedIds,
    hiddenIds,
  };

  // add on top
  positionStackUndo.push(snapshot);

  // limit to a max
  if (positionStackUndo.length > maxUndo) {
    positionStackUndo.shift();
  }
}
export function resetPositionStackUndo() {
  positionStackUndo = [];
}

export function popSnapshot() {
  if (positionStackUndo.length === 0) {
    return;
  }

  const snapshot = positionStackUndo.pop();
  if (!snapshot) {
    console.log("No snapshot — reset?");
    return;
  }

  //replace current graph

  if (typeof getCy() !== 'undefined' && getCy()) {
    getCy().elements().remove();
  }
  getCy().json(snapshot.json);

  getCy().elements().unselect();
  snapshot.selectedIds.forEach((id) => {
    const el = getCy().getElementById(id);
    el.select();
  });
  getCy().elements().removeClass("faded");
  getCy().elements().show(); // réinitialise tout
  snapshot.hiddenIds.forEach((id) => getCy().getElementById(id).hide());

  restoreProportionalSize();

  //cy.fit(); // optionnel, pour bien voir le résultat
}