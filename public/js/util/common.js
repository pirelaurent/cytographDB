"use strict";

export const NativeCategories = {
  ASSOCIATION: "association",
  MULTI_ASSOCIATION: "multiAssociation",
  HAS_TRIGGERS: "hasTriggers",
  TRIGGER_IMPACT: "trigger_impact",
  ORPHAN: "orphan",
  ROOT: "root",
  LEAF: "leaf",
  SIMPLIFIED: "simplified",
};

export const ConstantClass = {
  FK_DETAILED: "fk_detailed", //Shown as 1/Col
  FK_SYNTH: "fk_synth", //Shown as 1/FK
  SHOW_LABEL: "showLabel",
  SHOW_COLUMNS: "showColumns",
};

/*
    some function to share betwwen back and front to avoid distorsion
*/

export function warningOutputHtml(allWarnings) {
  return allWarnings
    .map(
      (w) =>
        `<b>${w.table || "(table?)"} : ${w.function || "(fn?)"}</b> — ${w.warn}`
    )
    .join("<br/>");
}

// some info are concatenated in back and in front.
const col2colSeparator = " → ";
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

/*
 codes for action on update or on delete 
 describe the referential action you choose for the whole foreign key 
 on a given event (typically ON DELETE and ON UPDATE). 
 You can pick different actions for delete vs update, 
  but you can’t set a different action per column inside a composite FK.

*/

// const actionMap = { a: "NO ACTION", r: "RESTRICT", c: "CASCADE", n: "SET NULL", d: "SET DEFAULT" };
export const actionMap = {
  a: "-", //"NO ACTION",
  r: "RESTRICT",
  c: "CASCADE",
  n: "SET NULL",
  d: "SET DEFAULT",
};

export const actionTitle = {
  // 'a' = NO ACTION: delete/update is refused if any child row currently references the parent.
  // Rows with NULL FK do not count as referencing (MATCH SIMPLE).
  a: "NO ACTION — delete refused if any child references the parent; NULL FKs don’t block",

  // 'r' = RESTRICT: same effect as NO ACTION but always checked immediately (not deferrable).
  r: "RESTRICT —  delete refused if any child references the parent; NULL FKs don’t block .(not deferrable)",

  // 'c' = CASCADE: delete/update propagates to children automatically.
  c: "CASCADE — deleting the parent deletes child rows (or updates cascade)",

  // 'n' = SET NULL: child FK set to NULL; requires FK columns to be nullable.
  n: "SET NULL — delete parent and set child FK to NULL (FK columns must be nullable)",

  // 'd' = SET DEFAULT: child FK set to its column default; default must satisfy the FK.
  d: "SET DEFAULT — delete parent and set child FK to its DEFAULT (must satisfy FK / nullability)",
};
