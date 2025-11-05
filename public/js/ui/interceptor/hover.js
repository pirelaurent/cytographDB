
import { getCy, captureGraphAsPng } from "../../graph/cytoscapeCore.js";
import { internalCategories } from "../../filters/categories.js";
import { NativeCategories, ConstantClass } from "../../util/common.js";

 /*
   information on mouse over on nodes and edges 
  */

export function  setHoverInterceptors(){


  getCy().on("mouseover", "node", (evt) => evt.target.addClass("hovered"));
  getCy().on("mouseout", "node", (evt) => evt.target.removeClass("hovered"));


  getCy().on("mouseover", "node, edge", function (evt) {
    const hoverEnabled = document.getElementById("hoverInfoToggle").checked;
    if (!hoverEnabled) return;

    const ele = evt.target;
    const renderedPos = evt.renderedPosition;

    const panel = document.getElementById("info-panel");
    panel.style.left = renderedPos.x + 20 + "px";
    panel.style.top = renderedPos.y + 20 + "px";
    panel.style.display = "block";

    let output;
    if (ele.isNode()) {
      let node = ele;

      const classArray = Array.from(node.classes()).filter(
        (c) => c !== "hovered"
      );

      //const internalCategories = ['fk_detailed', 'fk_synth', 'showLabel','showColumns'];
      const filteredClasses = classArray.filter(
        (cls) => !internalCategories.has(cls)
      );

      let allInfos = [];
      let classInfo = "";
      if (filteredClasses.length > 0) {
        filteredClasses.forEach((cls) => {
          switch (cls) {
            case NativeCategories.HAS_TRIGGERS:
              allInfos.push(`${cls}(${node.data().triggers.length})`);
              break;
            default:
              allInfos.push(`${cls}`);
          }
        });
        classInfo = `<small>[${allInfos.join(" ")} ]</small>`;
      }

      const data = node.data();

      /*    can be added to hover for debug   
     let dataInfo = "";
  
  
        if (Object.keys(data).length > 0) {
          dataInfo = `
          <ul>
            ${Object.entries(data)
              .map(([key, value]) => `<li><small>${key}</small>: ${value}</li>`)
              .join("")}
          </ul>
    `;
        } */

      let incomers = node.incomers("edge").length;
      let outgoers = node.outgoers("edge").length;
      if (incomers == 0) incomers = " ";
      else incomers = " <- " + incomers;
      if (outgoers == 0) outgoers = " ";
      else outgoers = outgoers + " <- ";

      output = `${data.id} <br\>`;
      if (node.selected()) output += "    "; // trick to verify selected
      output += `<small>${outgoers} □ ${incomers} </small><br\>`;

      if (classInfo) output += ` ${classInfo}<br/> `;
      // ${dataInfo}  can be added to hover for debug
    }
    // ele is edge
    else {
      let edge = ele;
      let labelToShow = ele.data("label");

      if (edge.hasClass(`${ConstantClass.FK_DETAILED}`)) {
        labelToShow += "<BR/>" + ele.data("columnsLabel");
      }

      const label = labelToShow;
      const classList = edge.classes(); // c'est une cytoscape collection

      // Convertir en tableau de chaînes
      const classArray = Array.from(classList);
      let libelArray = "";

      const filteredClasses = classArray.filter(
        (cls) => !internalCategories.has(cls)
      );

      let classInfo;

      if (filteredClasses.length > 0) {
        let allInfos = [];
        filteredClasses.forEach((cls) => {
          // simplify visual edge mode
          switch (cls) {
            case `${ConstantClass.FK_DETAILED}`:
              allInfos.push(`1/Col`);
              break;
            case `${ConstantClass.FK_SYNTH}`:
              allInfos.push(`1/FK`);
              break;
            default:
              allInfos.push(cls);
          }
        });
        classInfo = `<small>[${allInfos.join(" ")}]</small>`;
      }

      output = `
          ${edge.source().id()}  >   
          ${edge.target().id()}
          <br/><small>
          ${label} ${libelArray}
          </small>
        `;
      if (classInfo) output += `<br/> ${classInfo} `;
      // debug  output+= Array.from(edge.classes()).join(' ');
    }

    document.getElementById("nodeDetails").innerHTML = output;
    //${node.data('category')} <br>
  });

  getCy().on("mouseout", "node, edge", function () {
    document.getElementById("info-panel").style.display = "none";
  });

    // show colored link automatically
  getCy().on("mouseover", "node", function (evt) {
    const node = evt.target;
    // Réinitialise les styles
    getCy().edges().removeClass("incoming outgoing faded internal");

    getCy().nodes().addClass("faded");
    node.removeClass("faded");

    const cy = getCy();

    cy.batch(() => {
      cy.edges().forEach((edge) => {
        // Toujours repartir propre
        edge.removeClass("outgoing incoming faded");

        if (edge.source().id() === node.id()) {
          edge.addClass("outgoing");
          // si tu veux aussi dé-fader les nœuds connectés :
          edge.target().removeClass("faded");
          edge.source().removeClass("faded");
        } else if (edge.target().id() === node.id()) {
          edge.addClass("incoming");
          edge.source().removeClass("faded");
          edge.target().removeClass("faded");
        } else {
          edge.addClass("faded");
        }
      });
    });
  });

  getCy().on("mouseout", "node", function () {
    getCy().edges().removeClass("incoming outgoing faded ");
    getCy().nodes().removeClass("faded start-node"); // due to long path
    clicNodeMenu.style.display = "none";
  });

  getCy().on("mouseout", "edge", function () {
    clicEdgeMenu.style.display = "none";
  });



} //setInterceptors