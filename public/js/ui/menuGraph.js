"use strict";

import {
    loadGraphState,
    showOverlayWithFiles,
    saveGraphState,
    saveGraphToFile,
} from "../graph/loadSaveGraph.js";

import {
    getCy,
} from "../graph/cytoscapeCore.js";

import {
    resetSnapshot,
} from "../graph/snapshots.js";
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

                // simulate clic on a standard upload zone but hidden
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
            saveGraphToFile();
            break;

        case "pick":
            resetSnapshot();
            showOverlayWithFiles();
            break;

        case "saveToServer":
            saveGraphState();
            break;

        case "loadFromServer":
            resetSnapshot();
            loadGraphState();

            break;
    } //switch
}
