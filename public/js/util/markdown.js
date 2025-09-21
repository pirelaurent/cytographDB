// Export to Markdown

import { showError , showInfo} from "../ui/dialog.js";


/* export function bandeauMarkdown(doc){
    
  const actions = doc.createElement("div");
  actions.className = "md-actions";
  actions.setAttribute("role", "group");
  actions.setAttribute("aria-label", "Actions Markdown");

  // Download
  const imgDl = doc.createElement("img");
  imgDl.id = "mdDownload";
  imgDl.src = new URL("./img/download.png", location.href).href;
  imgDl.alt = "Download Markdown";
  imgDl.title = "download Markdown";
  imgDl.height = 25;
  imgDl.setAttribute("aria-hidden", "true");
  imgDl.style.cursor = "pointer";
  actions.appendChild(imgDl);

  // Copy
  const imgCp = doc.createElement("img");
  imgCp.id = "mdCopy";
  imgCp.src = new URL("./img/clipboardCopy.png", location.href).href;
  imgCp.alt = "Copy markdown to clipboard";
  imgCp.title = "Copy markdown to clipboard";
  imgCp.height = 22;
  imgCp.setAttribute("aria-hidden", "true");
  imgCp.style.cursor = "pointer";
  actions.appendChild(imgCp);
 return actions 
}
 */


export function bandeauMarkdown(doc){
  const base = doc.baseURI;               // base de la nouvelle fenêtre
  const url = (p) => new URL(p, base).href;

  const actions = doc.createElement("div");
  actions.className = "md-actions";
  actions.setAttribute("role", "group");
  actions.setAttribute("aria-label", "Actions Markdown");

  // Download
  const imgDl = doc.createElement("img");
  imgDl.id = "mdDownload";
  imgDl.src = url("./img/download.png");
  imgDl.alt = "Download Markdown";
  imgDl.title = "download Markdown";
  imgDl.height = 25;
  imgDl.setAttribute("aria-hidden", "true");
  imgDl.style.cursor = "pointer";
  actions.appendChild(imgDl);

  // Copy
  const imgCp = doc.createElement("img");
  imgCp.id = "mdCopy";
  imgCp.src = url("./img/clipboardCopy.png");
  imgCp.alt = "Copy markdown to clipboard";
  imgCp.title = "Copy markdown to clipboard";
  imgCp.height = 22;
  imgCp.setAttribute("aria-hidden", "true");
  imgCp.style.cursor = "pointer";
  actions.appendChild(imgCp);

  return actions;
}


export function setEventMarkdown(doc,tableName,title){

  doc.getElementById("mdCopy")?.addEventListener("click", async () => {
     htmlTableToMarkdown(
        tableName,
        {
          download: false,
          copyToClipboard: true,
        },
        title,
        doc
      );
    });

    doc.getElementById("mdDownload")?.addEventListener("click", () => {
      htmlTableToMarkdown(
        tableName,
        {
          download: true,
          copyToClipboard: false,
          filename: `columns_${tableName || "table"}.md`,
        },
        title,
        doc
      );
    });
}
/*
 general output  Html to markdown

 fileName : the futur .md downloaded file 
 tableId : a tag in the html <table id = 'my Id'>
*/

// utils/tableExport.js
export function htmlTableToMarkdown(tableId, opts = {}, title, root = document) {
  const tableWin = root.defaultView || window;

  const el = root.getElementById(tableId);
  if (!el) {
    showError(`Table with id="${tableId}" not found`);
    return;
  }
  // <table> direct
  const table = el.tagName?.toLowerCase() === "table" ? el : el.closest("table");
  if (!table) {
    showError(`Element "${tableId}" is not (or inside) a <table>`);
    return;
  }

  // fonction utilitaire pour extraire le contenu d’une cellule
  function getCellContent(cell) {
    const checkboxes = cell.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length > 0) {
      // si plusieurs checkboxes, on concatène
      return Array.from(checkboxes)
        .map(cb => cb.checked ? "[x]" : "[ ]")
        .join(" ");
    }
    // fallback sur le texte normal
    return cell.innerText;
  }

  const escapeCell = (txt) =>
    String(txt)
      .replace(/\r?\n+/g, " ")   // pas de retours ligne dans les cellules
      .replace(/\|/g, "\\|")     // échapper les pipes pour Markdown
      .trim();

  const headRows = table.tHead
    ? Array.from(table.tHead.rows)
    : [table.rows[0]]; // fallback si pas de thead

  const bodyRows = table.tBodies?.length
    ? Array.from(table.tBodies).flatMap(tb => Array.from(tb.rows))
    : Array.from(table.rows).slice(headRows.length); // fallback si pas de tbody

  // ligne d’en-tête
  const headerCells = Array.from(headRows[0].cells).map(c => escapeCell(getCellContent(c)));
  const headerLine = `| ${headerCells.join(" | ")} |`;
  const separatorLine = `| ${headerCells.map(() => "---").join(" | ")} |`;

  // lignes du corps
  const bodyLines = bodyRows.map(tr => {
    const cells = Array.from(tr.cells).map(c => escapeCell(getCellContent(c)));
    return `| ${cells.join(" | ")} |`;
  });

  const titleMd = title ? `\n## ${title}\n\n` : "";
  const markdownTable = titleMd + [headerLine, separatorLine, ...bodyLines].join("\n");

  // output .md : file or clipboard
  const filename = opts.filename ?? `${tableId}.md`;

  if (opts.copyToClipboard) {
    tableWin.navigator.clipboard?.writeText(markdownTable).catch((err) => {
      console.error("Clipboard copy failed:", err);
    });
    showInfo('table content (markdown) in clipboard !', root);
  }

  if (opts.download !== false) {
    const blob = new Blob([markdownTable], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000); // leave time to nav and release
  }
}


