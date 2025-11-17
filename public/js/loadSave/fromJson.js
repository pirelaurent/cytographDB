/*
 download and upload JSON from local disk 

*/

export function saveGraphToJson() {
  let filenameInput = document.getElementById("graphName");
  let filename = filenameInput.value.trim();

  if (!filename) {
    showAlert("please, enter a file name.");
    return;
  }

  // add extension .json if none
  if (!filename.toLowerCase().endsWith(".json")) {
    filename += ".json";
  }

  let cy = getCy();
  // cytoscape don't store visible/hide in json. Set an explicit data for further upload
  cy.batch(() => {
    cy.elements().forEach((ele) => {
      if (ele.hidden()) ele.data("hidden", true);
      else ele.removeData("hidden");
    });
  });

  /*
   temporarily switch to detail mode to save graph with full info
  */

  pushSnapshot("saveGraphToJson");

  enterFkDetailedMode(true);
  // then save graph on file
  const json = {
    ...getCy().json(),
    originalDBName: getLocalDBName(),
  };

  const blob = new Blob([JSON.stringify(json, null, 2)], {
    type: "application/json",
  });

  popSnapshot("saveGraphToJson-exit");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  // restore
  //enterFkSynthesisMode(true);
}

/*
 once loaded , recreate the graph saved 
*/

function createGraphFromJson(json) {
  const cyData = { ...json };

  let cy = getCy();
  cy.json(cyData);

  cy.batch(() => {
    cy.elements("[hidden]").hide(); // data(hidden)=true → hide()
    cy.elements().not("[hidden]").show(); // le reste → show()
  });

  restoreProportionalSize();
  resetSnapshot();
  restoreCustomNodesCategories();
  setNativeNodesCategories(); // redo categories due to leaf/root change

  enforceLabelToAlias(cyData.originalDBName); // despite alias could have been saved in new

  /*

ne change pas les roots et leaf malgré le change dans les classes

cy.style().clear();
  let moreStyles = getCustomStyles(getLocalDBName());
  cy.style().fromJson(getCyStyles());
cy.nodes().forEach(node => {
  node.style(); // forces style recalculation on that node
});
*/
  delete cyData.originalDBName;
  metrologie();
  cy.fit();
  //getCy().layout({ name: 'cose'}).run();
}

/*

 load file when user had chosen an element from navigator to upload 
*/

export function loadGraphFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  trace?.(`loadGraphFromJsonFile: ${file.name}`);
  // GUI position show asked graphname
  document.getElementById("graphName").value = file.name;

  const reader = new FileReader();
  let json;

  reader.onload = function (e) {
    json = JSON.parse(e.target.result);
    const originalDBName = json.originalDBName || null;
    let currentDBName = getLocalDBName();

    trace?.(`original: ${originalDBName} current: ${currentDBName}`);

    // same DB as the current one : ok continue

    if (originalDBName && originalDBName === currentDBName) {
      trace?.(`case same DB: ${currentDBName}`);
      createGraphFromJson(json);
      return;
    }

    // not the same , try to open the right one from json

    if (originalDBName) {
      connectToDbByNameWithoutLoading(originalDBName).then((result) => {
        // ok to connect right DB
        if (result.ok) {
          trace?.(`DB found and connected : ${originalDBName}`);
          setPostgresConnected();
          setLocalDBName(originalDBName);
          createGraphFromJson(json);
          return;
        }
        // either no original db name, either cannot be able to connect to original
        // try compatible
        else {
          showAlert(
            `unable to connect <b>${originalDBName}</b><br/>` +
            `Details: ${result.message}`
          );
          // try to connect had failed
          if (currentDBName != null) {
            {
              let original =
                originalDBName == null ? " not defined" : originalDBName;
              let current = currentDBName;

              showMultiChoiceDialog(
                ` <i>${file.name}</i> was created from <i>${original}</i>`,
                `is current <b>${current}</b> compatible ?`,
                [
                  {
                    label: "✅ Yes",
                    onClick: () => {
                      // must reconnect as try to connect had failed
                      connectToDbByNameWithoutLoading(currentDBName).then(
                        (result) => {
                          if (result.ok) {
                            trace?.(
                              `DB not found: ${originalDBName} Current reconnected : ${currentDBName}`
                            );
                            setPostgresConnected();
                            setLocalDBName(currentDBName);
                            createGraphFromJson(json);
                          } else {
                            showAlert(
                              `unable to connect <b>${currentDBName}</b><br/>` +
                              `Details: ${result.message}`
                            );
                          }
                        }
                      );
                    },
                  },
                  {
                    label: "❌ No",
                    onClick: () => {
                      resetPoolFromFront();
                      trace?.("not compatible. refused  ");
                      showAlert(
                        `All details would not be available as no DB is connected<br/>`
                      );
                      createGraphFromJson(json);
                    },
                  },
                ]
              );
            }
          }
        }
      });
    } else {
      showAlert("The json has no information on its original DB");
      createGraphFromJson(json);
    }
  };
  reader.readAsText(file);
}
