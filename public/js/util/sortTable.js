// utils/tableSort.js
export function OLDenableTableSorting(tableId, doc = document,options={}) {
  const host = doc.getElementById(tableId);
  if (!host) return;

  const table = host.tagName?.toLowerCase() === "table" ? host : host.closest("table");
  if (!table) return;

  const thead = table.tHead || table.createTHead();
  const headerRow = thead.rows[0] || table.rows[0];
  if (!headerRow) return;

  // enlève un ancien indicateur sur tous les th
  const clearIndicators = () => {
    Array.from(headerRow.cells).forEach(th => {
      th.removeAttribute("aria-sort");
      th.classList.add("sortable");
      const old = th.querySelector(".sort-indicator");
      if (old) old.remove();
    });
  };

  // ajoute / met à jour l’indicateur sur un th cible
  const setIndicator = (th, asc) => {
    th.setAttribute("aria-sort", asc ? "ascending" : "descending");
    // supprime s'il y en a déjà un (sécurité)
    th.querySelector(".sort-indicator")?.remove();
    const span = doc.createElement("span");
    span.className = "sort-indicator";
    span.textContent = asc ? "▲" : "▼";
    th.appendChild(span);
  };

  // mémorise la colonne et le sens actifs
  let activeIndex = -1;
  let activeAsc = true;

  Array.from(headerRow.cells).forEach((th, colIndex) => {
    th.classList.add("sortable");
    th.title ||= "Cliquer pour trier";

    th.addEventListener("click", () => {
      const tbody = table.tBodies[0] || table;
      const rows = Array.from(tbody.rows);

      // même colonne => on inverse le sens ; autre colonne => ascendant
      if (activeIndex === colIndex) {
        activeAsc = !activeAsc;
      } else {
        activeIndex = colIndex;
        activeAsc = true;
      }

      const isNumeric = rows.every(r => {
        const txt = r.cells[colIndex]?.innerText.trim() ?? "";
        return txt === "" || !isNaN(txt.replace(',', '.'));
      });

      rows.sort((a, b) => {
        const A = a.cells[colIndex]?.innerText.trim() ?? "";
        const B = b.cells[colIndex]?.innerText.trim() ?? "";

        if (isNumeric) {
          const nA = parseFloat(A.replace(',', '.')) || 0;
          const nB = parseFloat(B.replace(',', '.')) || 0;
          return activeAsc ? nA - nB : nB - nA;
        }

        return activeAsc
          ? A.localeCompare(B, undefined, { numeric: true, sensitivity: "base" })
          : B.localeCompare(A, undefined, { numeric: true, sensitivity: "base" });
      });

      // réinjection
      rows.forEach(r => tbody.appendChild(r));

      // met à jour les indicateurs
      clearIndicators();
      setIndicator(th, activeAsc);
    });
  });
}
export function enableTableSorting(tableId, doc = document, options = {}) {
  const { columns = null } = options;  
  // columns = [index1, index2] ou null pour tout trier

  const host = doc.getElementById(tableId);
  if (!host) return;

  const table = host.tagName?.toLowerCase() === "table" ? host : host.closest("table");
  if (!table) return;

  const thead = table.tHead || table.createTHead();
  const headerRow = thead.rows[0] || table.rows[0];
  if (!headerRow) return;

  // enlève un ancien indicateur sur tous les th
  const clearIndicators = () => {
    Array.from(headerRow.cells).forEach(th => {
      th.removeAttribute("aria-sort");
      th.classList.add("sortable");
      const old = th.querySelector(".sort-indicator");
      if (old) old.remove();
    });
  };

  const setIndicator = (th, asc) => {
    th.setAttribute("aria-sort", asc ? "ascending" : "descending");
    th.querySelector(".sort-indicator")?.remove();
    const span = doc.createElement("span");
    span.className = "sort-indicator";
    span.textContent = asc ? "▲" : "▼";
    th.appendChild(span);
  };

  let activeIndex = -1;
  let activeAsc = true;

  Array.from(headerRow.cells).forEach((th, colIndex) => {
    const allowed =
      columns === null ||           // pas de restriction → toutes triables
      columns.includes(colIndex);   // liste fournie → seulement celles listées

    if (!allowed) {
      th.classList.add("not-sortable");
      th.style.cursor = "default";
      return;
    }

    th.classList.add("sortable");
    th.title ||= "Cliquer pour trier";

    th.addEventListener("click", () => {
      const tbody = table.tBodies[0] || table;
      const rows = Array.from(tbody.rows);

      if (activeIndex === colIndex) {
        activeAsc = !activeAsc;
      } else {
        activeIndex = colIndex;
        activeAsc = true;
      }

      const isNumeric = rows.every(r => {
        const txt = r.cells[colIndex]?.innerText.trim() ?? "";
        return txt === "" || !isNaN(txt.replace(',', '.'));
      });

      rows.sort((a, b) => {
        const A = a.cells[colIndex]?.innerText.trim() ?? "";
        const B = b.cells[colIndex]?.innerText.trim() ?? "";

        if (isNumeric) {
          const nA = parseFloat(A.replace(',', '.')) || 0;
          const nB = parseFloat(B.replace(',', '.')) || 0;
          return activeAsc ? nA - nB : nB - nA;
        }

        return activeAsc
          ? A.localeCompare(B, undefined, { numeric: true, sensitivity: "base" })
          : B.localeCompare(A, undefined, { numeric: true, sensitivity: "base" });
      });

      rows.forEach(r => tbody.appendChild(r));

      clearIndicators();
      setIndicator(th, activeAsc);
    });
  });
}
