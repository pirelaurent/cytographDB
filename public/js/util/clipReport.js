/*
Due to browser limits for our use, an internal clipReport is available to view last results deposit here 


*/
let clipReport;
let clipReport_title;

export function setClipReport(title, somethingToView) {
  clipReport = somethingToView;
  clipReport_title = title ? title : "no name";
}

/*
 change aspect of button when report is available or not 
*/
export function adjustClipReportBtn(){
if (clipReport!=null) deployClipBtn(); else retractClipBtn();
}

/*
 change the icon of clipboard in main menu
*/
 function deployClipBtn() {
  let btnImg = document.getElementById("clip-img");
  btnImg.src = "./img/clipFull.png";
}

/*
 lower icon for clipboard
*/

 function retractClipBtn() {
  let btnImg = document.getElementById("clip-img");
  btnImg.src = "./img/clipShort.png";
}

/*
 create a page to view clipboard content 
*/

// Garde un handle réutilisable sur l'onglet "Presse-papier"
let clipWin = null;

export function showClipReport() {

  if (clipWin && !clipWin.closed) {
    try { clipWin.close(); } catch { /* cross-origin: ignore */ }
  }

  clipWin =
    clipWin && !clipWin.closed ? clipWin : window.open("", "app-clipboard");
  if (!clipWin) {
    alert("Popup blocked by browser.");
    return null;
  }
  clipWin.focus?.();
  const d = clipWin.document;

  // Squelette minimal (sans <script>)
  d.open();
  d.write(
    '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Presse-papier</title></head><body></body></html>'
  );
  d.close();

  // ---- STYLE
  const style = d.createElement("style");
  style.textContent = `
    :root{color-scheme:dark light}
    body{font:14px/1.45 system-ui,sans-serif;padding:16px;margin:0;background:#111;color:#eee}
    header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
    h1{font-size:16px;margin:0}

    pre{white-space:pre-wrap;word-break:break-word;background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:12px;min-height:140px;margin:0}
    small{opacity:.75}
  `;
  d.head.appendChild(style);

  // ---- UI
  const header = d.createElement("header");
  
  const title = d.createElement("h1");
  header.append(title);

  // --- Titre + bouton de fermeture
  const h2 = d.createElement("h2");
  const h2Title = clipReport_title?clipReport_title:" <no report> "
  h2.appendChild(d.createTextNode(`Last report : ${h2Title}`));


  //const btns = d.createElement("div");
  const btnClose = d.createElement("button");
  btnClose.id = "btn-close";
  btnClose.textContent = "Close ";
  //btns.append(btnClose);
 const separator = d.createElement("text");
 separator.innerText=' ';
  const btnClear = d.createElement("button");
  btnClear.id = "btn-clear";
  btnClear.textContent = "Clear";

  const pre = d.createElement("pre");
  pre.id = "out";
  pre.textContent = clipReport || "— (last Report content is empty) —";
  d.body.append(header,btnClose,separator, btnClear,  h2, pre);

  async function clearClipReport() {
    clipReport = null;
    adjustClipReportBtn();
    clipWin.close();
  }

  async function closeClipReport(){
clipWin.close();
  }
  btnClear.addEventListener("click", clearClipReport);
  btnClose.addEventListener("click", closeClipReport);

  // cannot do that here, not on main document if (!clipReport)retractClipBtn();

  return clipWin;
}


//http://localhost:3000/img/closePage.png