"use strict";


/*
    some function to share betwwen back and front to avoid distorsion
*/


export function warningOutputHtml(allWarnings){
      return allWarnings
      .map(
        (w) =>
          `<b>${w.table || "(table?)"} : ${w.function || "(fn?)"}</b> — ${w.warn}`
      )
      .join("<br/>");
}






// some info are concatenated in back and in front. 
const col2colSeparator = " --> ";
/*
 as a cytograph edge has only one label, encode columns correspondance
*/
export function encodeCol2Col(sourceName, destName) {
  return `${sourceName}${col2colSeparator}${destName}`;
}

/*
 reverse to be used in table that list columns correspondance
*/
export function decodeCol2Col(edgeLabel) {
  let twoCol = edgeLabel.split(col2colSeparator);
  return twoCol;
}
