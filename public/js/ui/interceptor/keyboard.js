 import {deleteNodesSelected} from "../../ui/dialog.js";
import { hideNotSelected, selectAllVisibleNodes } from "../../core/nodeOps.js";

import { captureGraphAsPng } from "../../graph/cytoscapeCore.js";


import { popSnapshot,reDoSnapshot } from "../../util/snapshots.js";



export function setKeyboardInterceptors(){


/*
   keyboards shortcut on strike
  */


const ctrlShortcuts = {
  a: selectAllVisibleNodes,
  g: captureGraphAsPng,
  h: hideNotSelected,
  y: reDoSnapshot,
  z: popSnapshot, //undo

  // Ajoute d'autres raccourcis ici
};

document.addEventListener("keydown", (event) => {
  // Vérifie si une touche avec Ctrl correspond à un raccourci connu
  if (event.ctrlKey || event.metaKey) {
    const key = event.key.toLowerCase();
    const action = ctrlShortcuts[key];

    if (action) {
      event.preventDefault(); // ✅ Bloque uniquement si raccourci défini
      event.stopPropagation();
      action();
      return;
    }
  }
  // Del : Avoid del in some places
  if (
    ["INPUT", "TEXTAREA"].includes(event.target.tagName) ||
    event.target.isContentEditable
  ) {
    return;
  }

  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault(); // Bloque suppression navigateur (retour page)
    deleteNodesSelected();
  }
});

}