"use strict";
/*
    quick code for debug
    to use : enableTrace(); 
        trace?.("Connexion DB", dbName); 


*/

export let trace = null; // sera soit une fonction, soit null
export function traceMessage(...args) {
  const ts =
    typeof performance !== "undefined"
      ? new Date(performance.timeOrigin + performance.now()).toISOString()
      : new Date().toISOString();
  console.log(`[TRACE ${ts}]`, ...args);
}

export function enableTrace() {
  trace = traceMessage;
}

export function disableTrace() {
  trace = null;
}

/* ----------------------- quick set  -----------------------*/
// enableTrace();
