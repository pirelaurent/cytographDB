/*
 load from a stored file on server (not yet used)
*/
export function loadGraphNamedFromServer() {

  // from ui in list of files
const filename = document.getElementById("graphName").value.trim();
  if (!filename) {
    showAlert("Please enter a filename in the 'Graph name' box.");
    return;
  }

/*
  read a file on the server in the adhoc repository : to be added in parameters. 
*/

  if (typeof cy !== "undefined" && cy) {
    getCy().elements().remove();
  }
  waitLoading("⏳ Loading saved graph");

  //document.getElementById("current-graph").textContent = "";

  fetch(`/load-graph/${filename}`)
    .then((res) => {
      if (!res.ok) {
        hideWaitLoading();
        if (res.status === 404) {
          throw new Error("file-not-found");
        }
        throw new Error("fetch-failed");
      }
      return res.json();
    })
    .then((graphState) => {
      if (cy) {
        getCy().json(graphState); // Restore the graph state
        getCy()
          .elements()
          .forEach((ele) => {
            if (ele.data("hidden")) {
              ele.style("display", "none");
            } else {
              ele.removeStyle("display");
            }
          });
      } else {
        setCy(
          cytoscape({
            container: document.getElementById("cy"),
            ...graphState,
          })
        );
        initializeGraph(null, true);
        metrologie();
      }
      //document.getElementById("current-graph").textContent = filename;
      document.getElementById("graphName").value = filename;
      restoreProportionalSize();
      resetSnapshot();

      restoreCustomNodesCategories();

      hideWaitLoading();
      metrologie();
    })
    .catch((error) => {
      showError(error);
      console.error("Error loading graph state:", error);
    });
}

/*
 window on top to choose un the list of availbale files on server
*/
export function showFilesListInOverlay() {
  fetch("/list-saves")
    .then((res) => res.json())
    .then((files) => {
      const list = document.getElementById("files");
      list.innerHTML = "";
      files.forEach((file) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#";
        a.textContent = file;
        a.onclick = () => {
          document.getElementById("overlay").style.display = "none";
          loadGraphNamedFromServer(file);
        };
        li.appendChild(a);
        list.appendChild(li);
      });
      document.getElementById("overlay").style.display = "block";
    })
    .catch((err) => {
      showError("Error while loading saved file");
      console.error(err);
    });
}

/*
 write on the server disk directly. To be changed later 
*/

export function saveGraphNamedToServer() {
  const filename = document.getElementById("graphName").value.trim();
  if (!filename) {
    showAlert("Please enter a filename.");
    return;
  }
  if (!cy) {
    showAlert("No graph to save.");
    return;
  }

  fetch(`/check-file?filename=${encodeURIComponent(filename)}`)
    .then((response) => response.json())
    .then(({ exists }) => {
      if (exists) {
        const confirmOverwrite = confirm(
          `The file "${filename}" already exists. Overwrite?`
        );
        if (!confirmOverwrite) return;

        // Continuer vers la sauvegarde
        sendGraphState(filename);
      } else {
        sendGraphState(filename);
      }
      document.getElementById("graphName").value = "";
    })
    .catch((err) => {
      console.error("Error checking file:", err);
    });
}

/*
 store a grph on file 
*/

function sendGraphState(filename) {
  // preserve hidden status
  const cy = getCy();

  cy.batch(() => {
    cy.$(':hidden').data('hidden', true);     // copy hidden dans une data
    cy.$(':visible').removeData('hidden');    // remove on visible if any
  });

  const graphState = getCy().json(); // Capture the current graph state

  fetch("/save-graph", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filename, data: graphState }),
  })
    .then((response) => {
      if (response.ok) {
        showAlert(`graph "${filename}" saved successfully.`);
        //document.getElementById("current-graph").textContent = filename;
        document.getElementById("graphName").value = filename;
      } else {
        showError("Failed to save graph state.");
      }
    })
    .catch((error) => {
      console.error("Error saving graph state:", error);
    });
}