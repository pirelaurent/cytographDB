"use strict";

import { showAlert } from "../ui/dialog.js";
import {warningOutputHtml} from "../util/common.js";
/*
  search and analyze tirggers of a table 
*/

async function mainTriggers() {
  const params = new URLSearchParams(window.location.search);
  const table = params.get("table");
  if (!table) {
    document.getElementById("content").textContent = "Missing table parameter.";
    return;
  }

  document.getElementById("title").innerHTML = `<img
        src="img/closePage.png"
        alt="Return"
        title="Close"
          style="cursor: pointer; vertical-align: middle; width: 25px; height: 25px;"
        onclick="window.tryClose()"
      />
 ${table} ⚡  `;

  document.title = `${table} ⚡ `;
  // PLA where we get the triggers list
  const response = await fetch(`/triggers?table=${table}`);

  const data = await response.json();

  if (!response.ok) {
    document.getElementById(
      "content"
    ).innerHTML = `<p style="color:red;">Error: ${data.error}</p>`;
    return;
  }

  if (!data || data.triggers.length === 0) {
    document.getElementById("content").innerHTML =
      "<p>No triggers defined.</p>";
    return;
  }

  let allWarnings = [];
  const rows = data.triggers
    .map((t) => {
      // where we prepare links to trigger code

      const fnLink =
        t.functionNames && t.functionNames.length > 0
          ? t.functionNames
              .map(
                (fn) =>
                  `<a href="/function.html?table=${encodeURIComponent(
                    table
                  )}&triggerName=${encodeURIComponent(
                    t.name
                  )}&name=${encodeURIComponent(
                    fn
                  )}" target="functionPage">${fn}</a>`
              )
              .join(", ")
          : `<code>${t.definition}</code>`;

      const impacted =
        (t.impactedTables || [])
          .map((tab) => `<code>${tab}</code>`)
          .join(", ") || "-";
      const calls =
        (t.calledFunctions || [])
          .map(
            (fn) =>
              `<a href="/function.html?table=${table}&triggerName=${
                t.name
              }&name=${encodeURIComponent(fn)}" target="functionPage">${fn}</a>`
          )
          .join(", ") || "-";

      if (t.warnings.length > 0) allWarnings.push(...t.warnings);

      return `
          <tr>
            <td>${t.name}</td>
            <td>${t.timing}</td>
            <td>${t.on}</td>
            <td>${fnLink}</td>
            <td>${impacted}</td>
            <td>${calls}</td>
          </tr>`;
    })
    .join("");

  document.getElementById("content").innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Timing</th>
              <th>Event(s)</th>
              <th>Definition</th>
              <th>Impacted Tables 
            </th>
              <th>Called Functions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;

  if (allWarnings.length > 0) {
    showAlert(warningOutputHtml(allWarnings));
  }
}

mainTriggers();
