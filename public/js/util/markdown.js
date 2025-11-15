// Export to Markdown

import { showError, showToast } from "../ui/dialog.js";
import { setClipReport } from "./clipReport.js";
import { exportXlsx } from "./excel.js";

/*
 create a document part to set in place the icons for download and copy/paste in markdown
 The result must be appended in place by the caller 
 icon_id is used to distinguish several Md Icons on the same page 
 */

export const ICON_MARKDOWN = "mkDownload";
export const ICON_COPY = "mkCopy";
export const ICON_EXCEL = "xlsDownload";

/*
 create a line with icons for output 
 To rely events to right icon (can have several on same page) give an identifier 
 Default options : all icons
*/

export function bandeauMarkdown(doc, icon_id = "", opts) {

  if (!opts) opts = {
    ICON_COPY: true,
    ICON_MARKDOWN: true,
    ICON_EXCEL: true
  }

  const base = doc.baseURI; // base de la nouvelle fenêtre
  const url = (p) => new URL(p, base).href;

  const actions = doc.createElement("span");
  actions.className = "md-actions";
  actions.setAttribute("role", "group");
  actions.setAttribute("aria-label", "Actions Markdown");

  // markdown Download
  if (opts.ICON_MARKDOWN) {
    const imgDl = doc.createElement("img");
    imgDl.id = icon_id + ICON_MARKDOWN;
    imgDl.src = url("./img/mkDownload.png");
    imgDl.alt = "Download Markdown";
    imgDl.title = "ownload Markdown";
    imgDl.height = 20;
    imgDl.width = 28;
    imgDl.setAttribute("aria-hidden", "true");
    imgDl.style.cursor = "pointer";
    actions.appendChild(imgDl);
  }

  // csv Download
  if (opts.ICON_EXCEL==true) {
    const imgXls = doc.createElement("img");
    imgXls.id = icon_id + ICON_EXCEL;
    imgXls.src = url("./img/xlsDownload.png");
    imgXls.alt = "Download XLS";
    imgXls.title = "download XLS";
    imgXls.height = 20;
    imgXls.width = 28;
    imgXls.setAttribute("aria-hidden", "true");
    imgXls.style.cursor = "pointer";
    actions.appendChild(imgXls);
  }

  // Copy
  if (opts.ICON_COPY) {
    const imgCp = doc.createElement("img");
    imgCp.id = icon_id + ICON_COPY;
    imgCp.src = url("./img/clipboardCopy.png");
    imgCp.alt = "Copy markdown to clipboard";
    imgCp.title = "Copy markdown to clipboard";
    imgCp.height = 20;
    imgCp.width = 20;
    imgCp.setAttribute("aria-hidden", "true");
    imgCp.style.cursor = "pointer";
    actions.appendChild(imgCp);
  }
  return actions;
}

/*
  weave the event with markdown icons for any named table .
  Use same icon_id as the one used in bandeau

*/

export function setEventMarkdown(doc, tableName, title, icon_id = "") {

  doc.getElementById(icon_id + ICON_COPY)?.addEventListener("click", async () => {
    htmlTableToMarkdown(
      tableName,
      {
        ICON_COPY: true,
      },
      title,
      doc
    );
  });

  doc.getElementById(icon_id + ICON_EXCEL)?.addEventListener("click", async () => {
    htmlTableToMarkdown(
      tableName,
      {
        ICON_EXCEL: true,
        filename: `columns_${tableName || "table"}.xlsx`,
      },
      title,
      doc
    );
  });


  doc.getElementById(icon_id + ICON_MARKDOWN)?.addEventListener("click", () => {
    htmlTableToMarkdown(
      tableName,
      {
        ICON_MARKDOWN: true,
        filename: `columns_${tableName || "table"}.md`,
      },
      title,
      doc
    );
  });
}

/*
 general output  Html to markdown
note: tableId is the identifier of the table in html not a js table
 fileName : the future .md downloaded file 
 tableId : a tag in the html <table id = 'my Id'>
*/

export function htmlTableToMarkdown(

  tableId,
  opts = {},
  title,
  root = document
) {

  const el = root.getElementById(tableId);
  if (!el) {
    showError(`Table with id="${tableId}" not found`);
    return;
  }
  // <table> direct
  const table =
    el.tagName?.toLowerCase() === "table" ? el : el.closest("table");
  if (!table) {
    showError(`Element "${tableId}" is not (or inside) a <table>`);
    return;
  }

  // helper to extract from a cell

  function getCellContent(cell) {
    const checkboxes = cell.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length > 0) {
      // si plusieurs checkboxes, on concatène
      return Array.from(checkboxes)
        .map((cb) => (cb.checked ? "[x]" : "[ ]"))
        .join(" ");
    }
    // fallback sur le texte normal
    return cell.innerText;
  }

  const escapeCellMk = (txt) => {
    let s = String(txt).trim();
    s = s
      .replace(/\r?\n+/g, " ") // pas de retours ligne dans les cellules
      .replace(/\|/g, "\\|") // échapper les pipes pour Markdown
      .trim();
    return s;
  }

  const escapeCellXls = (txt) => {
    let s = String(txt).trim();
    // neutraliser l’injection de formules Excel
    // (=, +, -, @ en 1er caractère) en préfixant d'un apostrophe sauf si un seul char
    if ((s.length > 1) && (/^[=+\-@]/.test(s))) s = "'" + s;
    return s;
  }
  // excel needs an array of arrays 
  let allXlsRows = [];

  const headRows = table.tHead ? Array.from(table.tHead.rows) : [table.rows[0]]; // fallback if no thead

  const bodyRows = table.tBodies?.length
    ? Array.from(table.tBodies).flatMap((tb) => Array.from(tb.rows))
    : Array.from(table.rows).slice(headRows.length); // fallback if no tbody

  // clear header 

  let headerCells;
  let headerLine;
  let bodyLines;
  let separatorLine;
  let cells;


  if (opts.ICON_EXCEL) {
    headerCells = Array.from(headRows[0].cells).map((c) =>
      escapeCellXls(getCellContent(c))
    );
    allXlsRows.push(headerCells);

    // lines corps
    bodyLines = bodyRows.map((tr) => {
      cells = Array.from(tr.cells).map((c) =>
        escapeCellXls(getCellContent(c)))
      return cells;
    });
    allXlsRows.push(...bodyLines);
    let filename = opts.filename ?? `exportCyto.xlsx`;
    exportXlsx(allXlsRows, filename)
  }
  else {
    headerCells = Array.from(headRows[0].cells).map((c) =>
      escapeCellMk(getCellContent(c))
    );
    headerLine = `| ${headerCells.join(" | ")} |`;
    separatorLine = `| ${headerCells.map(() => "---").join(" | ")} |`;
    // lines corps
    bodyLines = bodyRows.map((tr) => {
      cells = Array.from(tr.cells).map((c) =>
        escapeCellMk(getCellContent(c))
      );
      return `| ${cells.join(" | ")} |`;
    });

    let tableText
    const titleMd = title ? `\n## ${title}\n\n` : "";
    tableText = titleMd + [headerLine, separatorLine, ...bodyLines].join("\n");
    outputMarkdown(opts, tableText, root);
  }
}

/*
more general output for markdown
*/
export function outputMarkdown(opts = {}, tableText, root) {
  // output .md : file or clipboard
  let filename = opts.filename ?? `default.md`;

  if (opts.ICON_COPY) {
    const tableWin = root.defaultView || window;
    tableWin.navigator.clipboard?.writeText(tableText).catch((err) => {
      console.error("Clipboard copy failed:", err);
    });
    //showInfo(" content copied in clipboard !", root);
    // also set in internal report 
    const title = opts.title ? opts.title : "no title";
    setClipReport(title, tableText);
    showToast(`content copied in clipboard and clipReport! (${title})`, root);
  }
  let blob;
  if (opts.ICON_MARKDOWN) {
    blob = new Blob([tableText], { type: "text/markdown" });
    startDownload();
  }


  // common . simulate a click on a href for download
  function startDownload() {
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
/*
  create a header for markdown tables with icons by code
*/
export function createHeaderMarkdown(doc) {
  // --- Header (H2 + 3 imgs) ---
  const header = doc.createElement("div");
  header.className = "section-header";

  const h3 = doc.createElement("h3");
  h3.id = "columnNumber";
  h3.className = "section-title";
  h3.textContent = ""; // Columns in table details, no name here
  const wrap = doc.createElement("div");
  wrap.className = "section-actions";
  h3.appendChild(wrap);
  header.appendChild(h3);

  let bandeau = bandeauMarkdown(doc);
  wrap.appendChild(bandeau);
  //header.appendChild(bandeau);
  return header;
}
