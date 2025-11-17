"use strict";

import {loadGraphNamedFromServer, saveGraphNamedToServer,showFilesListInOverlay} from "../loadSave/fromServer.js";
import { saveGraphToJson} from "../loadSave/fromJson.js"


import {
    getCy,
} from "../graph/cytoscapeCore.js";

import {
    resetSnapshot,
} from "../util/snapshots.js";
/*
  ---------------------------------- Files menu on top line 
*/
export function menuGraph(option, item, whichClic = "left") {
    if (whichClic == "right") return;
    switch (option) {
        case "localUpload":
            {
                if (typeof getCy() !== "undefined" && getCy()) {
                    getCy().elements().remove();
                }

                resetSnapshot();
                document.getElementById("graphName").value = "";

                // simulate click on a standard upload zone but hidden
                //document.getElementById("graphUpload").click();
                const input = document.getElementById("graphUpload");
                if (input) {
                    input.click();
                } else {
                    console.warn(
                        "graphUpload input not found when trying to trigger click"
                    );
                }

                document.getElementById("graphUpload").value = "";
            }

            break;
        case "localDownload":
            saveGraphToJson();
            break;

        case "pick":
            resetSnapshot();
            showFilesListInOverlay();
            break;

        case "saveToServer":
            saveGraphNamedToServer();
            break;

        case "loadFromServer":
            resetSnapshot();
            loadGraphNamedFromServer();

            break;
    } //switch
}
