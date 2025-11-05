import { getCy } from "../../../graph/cytoscapeCore.js";

//-----------------------------------
export function setQuickAccessMenu(){

  const quickAccessMenu = document.getElementById("quickAccessMenu");

  // Optionnel: empêcher qu’un clic dans le menu le ferme si  des boutons dedans
quickAccessMenu.addEventListener("mousedown", (e) => e.stopPropagation());
  
//  masquer dès qu’on clique hors du container :
  document.addEventListener("mousedown", (e) => {
    if (
      !getCy().container().contains(e.target) &&
      !quickAccessMenu.contains(e.target)
    )
      hideQuickMenu();
  });

  // 4) Cacher le menu quand on clique ailleurs, on scrolle/pan/zoom, ou touche Échap
  function hideQuickMenu() {
    quickAccessMenu.style.display = "none";
  }

  getCy().on("pan zoom drag", hideQuickMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideQuickMenu();
  });

  getCy().on("tap", (e) => {
    // si on a cliqué ailleurs que le menu, on masque
    // (tap catchera aussi le clic gauche; c’est voulu)
    if (e.target === cy || e.target.isNode?.() || e.target.isEdge?.())
      hideQuickMenu();
  });


  document.addEventListener("click", () => {
    quickAccessMenu.style.display = "none";
  });
  getCy().on("cxttap", (e) => {
    // si on a cliqué un node/edge, on ne montre pas ce menu-là
    if (e.target !== getCy()) return;

    // coordonnées souris écran
    const oe = e.originalEvent; // MouseEvent / PointerEvent
    const { clientX, clientY } = oe;

    // positionner le menu en tenant compte du conteneur

    let left = clientX;
    let top = clientY;

    // 3) Ajuster pour éviter que le menu sorte du conteneur
    // (attendre display pour mesurer)

    quickAccessMenu.style.display = "block";

    quickAccessMenu.style.left = `${left}px`;
    quickAccessMenu.style.top = `${top}px`;
  });


}