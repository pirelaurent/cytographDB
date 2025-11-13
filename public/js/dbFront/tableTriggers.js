"use strict";

import { showAlert } from "../ui/dialog.js";
import { warningOutputHtml } from "../util/common.js";
// (optionnel si tu veux le tri, comme dans tabledetails.js)
import { enableTableSorting } from "../util/sortTable.js";

/*
  search and analyze triggers of a table
*/
async function mainTriggers() {
  const params = new URLSearchParams(window.location.search);
  const fullName = params.get("fullName");
  const content = document.getElementById("content");

  if (!fullName) {
    content.textContent = "Missing table parameter.";
    return;
  }

  document.getElementById("title").innerHTML = `
    <img src="img/closePage.png" alt="Return" title="Close"
         style="cursor:pointer;vertical-align:middle;width:25px;height:25px;"
         onclick="window.tryClose()" />
    ${fullName} ⚡
  `;
  document.title = `${fullName} ⚡`;

  // fetch data
  const response = await fetch(`/triggers?fullName=${encodeURIComponent(fullName)}`);
  const data = await response.json();

  if (!response.ok) {
    content.innerHTML = `<p style="color:red;">Error: ${data.error}</p>`;
    return;
  }
  if (!data || !Array.isArray(data.triggers) || data.triggers.length === 0) {
    content.innerHTML = "<p>No triggers defined.</p>";
    return;
  }

  // --- structure standardisée comme tabledetails.js ---
  content.innerHTML = `
    <div class="section">
      <h3 class="section-header">
        <span id="triggersTitle">Triggers <small>(${data.triggers.length})</small></span>
        <div class="section-actions" id="triggersActions"></div>
      </h3>

      <div class="table-container">
        <table id="triggersTable" class="data-table-triggers">
          <thead>
            <tr>
              <th data-type="text">Name</th>
              <th data-type="text">Timing</th>
              <th data-type="text">Event(s)</th>
              <th data-type="text">Definition</th>
              <th data-type="text">Impacted Tables</th>
              <th data-type="text">Called Functions</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  `;

  const tbody = content.querySelector("#triggersTable tbody");

  const rowsHtml = data.triggers.map((t) => {
    // liens vers fonctions
    const fnLink =
      t.functionNames && t.functionNames.length
        ? t.functionNames
            .map((fn) => {
              const url = `/function.html?fullName=${encodeURIComponent(fullName)}&triggerName=${encodeURIComponent(t.name)}&name=${encodeURIComponent(fn)}`;
              return `<a href="${url}" target="_blank">${fn}</a>`;
            })
            .join(", ")
        : `<code>${t.definition ?? ""}</code>`;

    const impacted =
      (t.impactedTables || []).map((tab) => `<code>${tab}</code>`).join(", ") || "-";

    const calls =
      (t.calledFunctions || [])
        .map((fn) => {
          const url = `/function.html?fullName=${encodeURIComponent(fullName)}&triggerName=${encodeURIComponent(t.name)}&name=${encodeURIComponent(fn)}`;
          return `<a href="${url}" target="_blank">${fn}</a>`;
        })
        .join(", ") || "-";

    return `
      <tr>
        <td class="nowrap">${t.name}</td>
        <td>${t.timing}</td>
        <td>${t.on}</td>
        <td>${fnLink}</td>
        <td>${impacted}</td>
        <td>${calls}</td>
      </tr>
    `;
  }).join("");

  tbody.innerHTML = rowsHtml;

  // warnings
  const allWarnings = data.triggers.flatMap(t => t.warnings || []);
  if (allWarnings.length > 0) {
    showAlert(warningOutputHtml(allWarnings));
  }

  // (optionnel) activer le tri si présent dans ton projet
  if (typeof enableTableSorting === "function") {
    enableTableSorting("triggersTable");
  }
}

mainTriggers();
