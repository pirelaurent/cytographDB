"use stricts";

/*
 replace alert, warning, confirm with modal window
*/

import { setPostgresConnected } from "../dbFront/tables.js";

import {
  getCy,
  perimeterForNodesSelection,
  metrologie,
  perimeterForEdgesSelection,
} from "../graph/cytoscapeCore.js";

import { pushSnapshot } from "../graph/snapshots.js";

export function showMultiChoiceDialog(title, message, choices) {
  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const dialog = document.createElement("div");
  dialog.style.background = "white";
  dialog.style.padding = "20px";
  dialog.style.borderRadius = "8px";
  dialog.style.minWidth = "300px";
  dialog.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";

  const titleElem = document.createElement("h3");
  titleElem.innerHTML = title;
  dialog.appendChild(titleElem);

  const msgElem = document.createElement("p");

  msgElem.innerHTML = message;

  dialog.appendChild(msgElem);

  const btnContainer = document.createElement("div");
  btnContainer.style.marginTop = "15px";
  btnContainer.style.display = "flex";
  btnContainer.style.gap = "10px";
  btnContainer.style.justifyContent = "flex-end";
  const buttons = [];
  choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.innerHTML = choice.label;
    btn.onclick = () => {
      overlay.remove();
      choice.onClick();
    };
    btn.style.padding = "6px 12px";
    btn.style.borderRadius = "4px";
    btn.style.border = "1px solid #ccc";
    btn.style.background = "#eee";
    btn.style.cursor = "pointer";
    btnContainer.appendChild(btn);
    buttons.push({ btn, choice });
  });

  dialog.appendChild(btnContainer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // --- Ici, on cherche le bouton 'par défaut'
  const defaultBtn =
    buttons.find((b) => b.choice.isDefault)?.btn || buttons[0].btn;
  defaultBtn.focus();
  function cleanup() {
    document.body.removeChild(overlay);
    document.removeEventListener("keydown", onDialogKeydown);
  }

  function onDialogKeydown(e) {
    if (e.key === "Enter") {
      defaultBtn.click();
      e.preventDefault();
    } else if (e.key === "Escape") {
      cleanup();
    }
  }
  document.addEventListener("keydown", onDialogKeydown);
}

/*
 more friendly alert 
*/

export function showAlert(textAlert) {
  showMultiChoiceDialog("⚠️  Warning", textAlert, [
    {
      label: "OK",
      onClick: () => {},
      isDefault: true,
    },
  ]);
}

export function showInfo(textInfo) {
  showMultiChoiceDialog("ℹ️  Information", textInfo, [
    {
      label: "OK",
      onClick: () => {},
      isDefault: true,
    },
  ]);
}

export function showError(textAlert) {
  showMultiChoiceDialog("🚫 Error", textAlert, [
    {
      label: "OK",
      onClick: () => {},
      isDefault: true,
    },
  ]);
}

// default const OR_SELECTED = " or_selected";
export const AND_SELECTED = "AND";

export function modeSelect() {
  return document.getElementById("modeSelect").value;
}

export function cytogaphdb_version() {
  fetch("/api/version")
    .then((response) => response.json())
    .then((data) => {
      const versionElement = document.getElementById("versionInfo");
      if (versionElement && data.version) {
        versionElement.textContent = `cytographdb V${data.version}`;
      } else {
        versionElement.textContent = "unknown version";
      }
    })
    .catch((error) => {
      console.error("Erreur de récupération de la version :", error);
      const versionElement = document.getElementById("versionInfo");
      if (versionElement) {
        versionElement.textContent = "Error on version";
      }
    });
}

/*
 modal to enter the regex search by name
 hiddenType store 'nodes' or 'edges' for further filter. 
*/
export function openNameFilterModal(event, type) {
  document.getElementById("nameFilterModal").style.display = "flex";
  const title = document.getElementById("nameFilterTitle");
  document.getElementById("modalNameFilterInput").value = "";
  const hiddenType = document.getElementById("modalNameFilterType");

  // Mets à jour le titre + le champ caché
  const isNode =
    type === "node" || event?.currentTarget?.dataset.category === "nodesName";
  title.textContent = `Filter ${isNode ? "nodes" : "edges"} by name (regex)`;
  hiddenType.value = isNode ? "nodes" : "edges";

  document.getElementById("modalNameFilterInput").focus();
}

export function closeNameFilterModal() {
  document.getElementById("nameFilterModal").style.display = "none";
}

export function modalSelectByName() {
  const val = document.getElementById("modalNameFilterInput").value;

  const hiddenType = document.getElementById("modalNameFilterType").value;
  const ok = selectByName(val, hiddenType);
  if (ok) closeNameFilterModal();
}

// hiddentType is node or edges
export function selectByName(pattern, hiddenType) {
  let regex;
  try {
    regex = new RegExp(pattern.trimEnd(),'i');
  } catch (e) {
    showAlert("unvalid regex:",e.message);
    return false;
  }

  if (hiddenType === "nodes") {
    /*
 by name will search in visible and hidden. 
 If found in hidden, bring back these nodes
*/

    // perimeter special
    const withHidden = document.getElementById("searchOnHidden").checked;
    let nodes = withHidden ? getCy().nodes() : perimeterForNodesSelection();
    if (nodes == null) return;

    // un select residual hidden selecteed nodes if any
    if (withHidden) getCy().$("node:hidden").unselect();

    nodes.forEach((node) => {
      if (regex.test(node.id())) {
        node.select(); //add
      } else {
        if (modeSelect() == AND_SELECTED) node.unselect();
      }

      getCy().$("node:selected").show(); //$ for elements( )
      // show also edges
      getCy().$("node:selected").connectedEdges().show();
      // (future compound nodes, show montrer les parents
      getCy().$("node:selected").ancestors().show();
    });
  }

  //
  if (hiddenType === "edges") {
    // perimeter
    const withHidden = document.getElementById("searchOnHidden").checked;
    let edges = withHidden ? getCy().edges() : perimeterForEdgesSelection();
    if (edges == null) return;

    // un select residual hidden selecteed nodes if any
    if (withHidden) getCy().$("edge:hidden").unselect();

    edges.forEach((edge) => {
      if (regex.test(edge.data("label"))) {
        edge.select(); //add
      } else {
        if (modeSelect() == AND_SELECTED) edge.unselect();
      }
    });
  }
  getCy().$("edge:selected").show(); //$ for elements( )
  return true;
}

/*
 create a window to choose a database
*/

export function promptDatabaseSelectionNear(targetElement) {
  //console.log("[prompt] started");
  return new Promise(async (resolve) => {
    // console.log("[prompt] inside Promise");
    document.querySelectorAll(".db-prompt-box").forEach((e) => e.remove());

    const box = document.createElement("div");
    box.className = "db-prompt-box";

    const select = document.createElement("select");
    select.className = "db-prompt-select";
    const button = document.createElement("button");
    button.class = "db-prompt-box";
    button.textContent = "OK";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.class = "db-prompt-box";

    box.appendChild(select);
    box.appendChild(button);
    box.appendChild(cancelBtn);

    const container = document.querySelector(".db-box-container");
    container.innerHTML = ""; // nettoie les anciennes boîtes
    container.style.position = "relative";

    container.appendChild(box);

    // document.body.appendChild(box);

    // Position
    const rect = targetElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    box.style.left = `${rect.left - containerRect.left}px`;
    box.style.top = `${rect.bottom - containerRect.top}px`;

    try {
      const res = await fetch("/api/databases");
      const dbs = await res.json();

      dbs.forEach((name) => {
        // avoid interna default DB of postgres
        if (!(name == "postgres")) {
          const opt = document.createElement("option");
          opt.value = name;
          opt.textContent = name;
          select.appendChild(opt);
        }
      });
    } catch {
      showError("Error loading databases");
      box.remove();
      resolve(null);
      return;
    }
    setPostgresConnected();
    select.focus();

    const cleanup = () => {
      box.remove();
      document.removeEventListener("click", outsideClickHandler);
    };

    const submit = () => {
      const value = select.value;
      cleanup();
      resolve(value);
    };

    button.addEventListener("click", submit);
    select.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });

    cancelBtn.addEventListener("click", () => {
      cleanup();
      resolve(null);
    });

    function outsideClickHandler(e) {
      if (!box.contains(e.target) && !targetElement.contains(e.target)) {
        cleanup();
        resolve(null);
      }
    }

    document.addEventListener("click", outsideClickHandler);
  });
}

/*
 map used to apply a comparison against the symbol in gui 
*/
const opMap = {
  ">": (a, b) => a > b,
  ">=": (a, b) => a >= b,
  "<": (a, b) => a < b,
  "<=": (a, b) => a <= b,
  "=": (a, b) => a === b,
};
/*
 after a choice of values in menu, apply operations 
*/

export function menuSelectSizeOutgoing() {
  const op = document.getElementById("filter-op").value;
  const val = parseInt(document.getElementById("filter-value").value);
  const test = opMap[op];
  let nodes = perimeterForNodesSelection();
  if (nodes.length === 0) return;

  pushSnapshot();
  nodes.forEach((n) => {
    const visibleEdges = n.outgoers("edge:visible");
    const count = visibleEdges.length;
    const keep = test(count, val);
    if (modeSelect() == AND_SELECTED) n.unselect();
    if (keep) n.select();
  });
}

export function menuSelectSizeIncoming() {
  const op = document.getElementById("filter-op-in").value;
  const val = parseInt(document.getElementById("filter-value-in").value);
  const test = opMap[op];

  let nodes = perimeterForNodesSelection();
  if (nodes.length === 0) return;

  pushSnapshot();
  nodes.forEach((n) => {
    const visibleEdges = n.incomers("edge:visible");
    const count = visibleEdges.length;
    const keep = test(count, val);
    if (modeSelect() == AND_SELECTED) n.unselect();
    if (keep) n.select();
  });
}

export function deleteNodesSelected() {
  let nodesToKill = getCy().nodes(":selected:visible");
  if (nodesToKill.length == 0) {
  }

  if (nodesToKill.length > 1) {
    // confirm title, messagge
    showMultiChoiceDialog(`delete ${nodesToKill.length} nodes`, `Confirm ?`, [
      {
        label: "✅ Yes",
        onClick: () => {
          pushSnapshot();
          nodesToKill.remove();
          metrologie();
        },
      },

      {
        label: "❌ No",
        onClick: () => {}, // rien
      },
    ]);
  } else {
    pushSnapshot();
    nodesToKill.remove();
    metrologie();
  }
}
