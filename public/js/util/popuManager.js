// popupManager.js
// Gère les onglets ouverts depuis une page principale + auto-fermeture

const PopupManager = (() => {
  // ---- Config par défaut ----
  const tabStack = [];
  const MAX_TABS = 5;
  const CLOSE_DELAY_MS = 60000; // 1 min sans focus

  // ---- Fonctions pour le parent ----

  function openPopup(url, name) {
    const win = window.open(url, name || "_blank");
    if (!win) return null;

    tabStack.push(win);

    // Si on dépasse la limite, fermer les plus anciens
    while (tabStack.length > MAX_TABS) {
      const oldWin = tabStack.shift();
      try {
        oldWin.close();
      } catch (e) {
        console.warn("Impossible de fermer un onglet", e);
      }
    }

    // Nettoyage automatique quand un onglet est fermé manuellement
    const interval = setInterval(() => {
      if (win.closed) {
        clearInterval(interval);
        const idx = tabStack.indexOf(win);
        if (idx !== -1) tabStack.splice(idx, 1);
      }
    }, 1000);

    return win;
  }

  function getOpenTabs() {
    return [...tabStack];
  }

  function closeAllPopups() {
    for (const win of tabStack) {
      try {
        win.close();
      } catch (e) {
        console.warn("Erreur lors de la fermeture d’un onglet :", e);
      }
    }
    tabStack.length = 0;
  }

  function notifyClosed(name) {
    console.log(`L’onglet "${name}" s’est fermé`);
  }

  // ---- Fonctions pour les onglets enfants ----

  function autoCloseOnBlur(delayMs = CLOSE_DELAY_MS) {
    let timeout;
    window.addEventListener("blur", () => {
      timeout = setTimeout(() => {
        try {
          window.opener?.notifyClosed?.(window.name);
        } catch {}
        window.close();
      }, delayMs);
    });
    window.addEventListener("focus", () => clearTimeout(timeout));
  }

  // ---- Export public ----
  return {
    openPopup,
    getOpenTabs,
    closeAllPopups,
    notifyClosed,
    autoCloseOnBlur
  };
})();

// Export si tu utilises des modules ES6
export default PopupManager;
