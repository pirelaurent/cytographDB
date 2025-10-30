// Export to Markdown

import { showError, showToast } from "../ui/dialog.js";
import { setClipReport } from "./clipReport.js";
import { exportXlsx } from "./excel.js";




/*
 create a document part to set in place the icons for download and copy/paste in markdown
 The result must be appended in place by the caller 

 RootMd is used when several Md Icons are on the same page 
 */

export function bandeauMarkdown(doc, rootMd = "") {
  const base = doc.baseURI; // base de la nouvelle fenêtre
  const url = (p) => new URL(p, base).href;

  const actions = doc.createElement("span");
  actions.className = "md-actions";
  actions.setAttribute("role", "group");
  actions.setAttribute("aria-label", "Actions Markdown");

  // markdown Download
  const imgDl = doc.createElement("img");
  imgDl.id = rootMd + "mkDownload";
  imgDl.src = url("./img/mkDownload.png");
  imgDl.alt = "Download Markdown";
  imgDl.title = "download Markdown";
  imgDl.height = 23;
  imgDl.setAttribute("aria-hidden", "true");
  imgDl.style.cursor = "pointer";
  actions.appendChild(imgDl);

  // csv Download
  const imgCsv = doc.createElement("img");
  imgCsv.id = rootMd + "xlsDownload";
  imgCsv.src = url("./img/xlsDownload.png");
  imgCsv.alt = "Download CSV";
  imgCsv.title = "download CSV";
  imgCsv.height = 25;
  imgCsv.width = 27;
  imgCsv.setAttribute("aria-hidden", "true");
  imgCsv.style.cursor = "pointer";
  actions.appendChild(imgCsv);


  // Copy
  const imgCp = doc.createElement("img");
  imgCp.id = rootMd + "mdCopy";
  imgCp.src = url("./img/clipboardCopy.png");
  imgCp.alt = "Copy markdown to clipboard";
  imgCp.title = "Copy markdown to clipboard";
  imgCp.height = 25;
  imgCp.width = 25;
  imgCp.setAttribute("aria-hidden", "true");
  imgCp.style.cursor = "pointer";
  actions.appendChild(imgCp);

  return actions;
}

/*
  weave the event with markdown icons for any named table .
  Use same rootMd as the one used in bandeau

*/

export function setEventMarkdown(doc, tableName, title, rootMd = "") {

  doc.getElementById(rootMd + "mdCopy")?.addEventListener("click", async () => {
    htmlTableToMarkdown(
      tableName,
      {
        download: false,
        xlsDownload: false,
        copyToClipboard: true,
      },
      title,
      doc
    );
  });

  doc.getElementById(rootMd + "xlsDownload")?.addEventListener("click", async () => {
    htmlTableToMarkdown(
      tableName,
      {
        download: false,
        xlsDownload: true,
        copyToClipboard: false,
        filename: `columns_${tableName || "table"}.xlsx`,
      },
      title,
      doc
    );
  });


  doc.getElementById(rootMd + "mkDownload")?.addEventListener("click", () => {
    htmlTableToMarkdown(
      tableName,
      {
        download: true,
        xlsDownload: false,
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

export function htmlTableToMarkdown(

  tableId,
  opts = {},
  title,
  root = document
) {
  //console.log("htmlTableToMarkdown", tableId, opts);
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


  if (opts.xlsDownload) {
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

  if (opts.copyToClipboard) {
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
  if (opts.download === true) {
    blob = new Blob([tableText], { type: "text/markdown" });
    startDownload();
  }


  // common . simulate a clic on a href for download
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

