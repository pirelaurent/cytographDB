"use strict";


//-------------------
/*
 cy defined in a module cannot be accessed directly
 use methods from outside
*/
let cy;
let detachBlockers = null;

export function setCy(instance) {
  cy = instance;

  // not enough for windows event interceptor
  //const container = cy.container();

  if (detachBlockers) {
    detachBlockers();
    detachBlockers = null;
  }

  document.addEventListener("contextmenu", (e) => {
    //  console.log("contextmenu global bloqué");
    e.preventDefault();
  });

  // instance but not execute until a new call to setCy
  detachBlockers = () => {
    document.removeEventListener("contextmenu", onContextMenu, true);
    document.removeEventListener("mousedown", onMouseDownRight, true);
  };
}

export function getCy() {
  return cy;
}


/*
 create a png image by button or ctrl g like graphic
*/
export function captureGraphAsPng() {
  const png = getCy().png({ full: false, scale: 2, bg: "white" });
  getCy().edges().addClass("forPNG");
  const link = document.createElement("a");
  link.href = png;
  link.download = "graph-capture.png";
  link.click();
  getCy().edges().removeClass("forPNG");
}


