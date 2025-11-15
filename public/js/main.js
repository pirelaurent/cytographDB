// Copyright (C) 2025 pep-inno.com
// This file is part of CytographDB (https://github.com/pirelaurent/cytographdb)
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

"use strict";

import { loadCustomModules } from "./customModulesIndex.js";

import {linkToUi} from "./core/loadSaveGraph.js";
import { addCustomDocLink} from "./ui/custom.js"
import { setInterceptors } from "./ui/interceptor/core.js";
import {initMenus} from "./ui/menus.js"
import { 
  cytogaphdb_version,
} from "./ui/dialog.js"

import { setCy } from "./graph/cytoscapeCore.js";

/*
 start of app once index.html is loaded 
*/

export function main() {
  console.log("start of application cytographDB");

  // autre layout indépendant
  cytoscape.use(cytoscapeDagre);
  
  setCy(cytoscape({
    container: document.getElementById("cy"),
    elements: [],
    boxSelectionEnabled: true, // ✅ OBLIGATOIRE pour pouvoir draguer
    autounselectify: false, // ✅ Permet sélection multiple
    wheelSensitivity: 0.5, // Valeur par défaut = 1
      minZoom: 0.001,
      maxZoom: 1.2,  // avoid fit to go beyonsd
    //   minZoom :1e-6,  // very small, effectively no lower bound
    //   maxZoom: 1e6,   // very high, effectively no upper bound
  })
);

  setInterceptors();
  initMenus();
  cytogaphdb_version();
  linkToUi();
} // main
/*
 run main once dom is loaded 
*/

  document.addEventListener("DOMContentLoaded", async () => {
  await loadCustomModules();  // on attend avant d'appeler main
  await addCustomDocLink();
  main();
});
 










