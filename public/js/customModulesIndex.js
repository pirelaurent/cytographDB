"use strict";
/*
  loaded at startup
  scan directory public/custom/*.js  to load optional custom modules automatically  
*/


(async () => {
  let modules = [];
  try {
    const res = await fetch('/api/custom-modules', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    modules = await res.json(); // ex: ['/custom/a.js', '/custom/b.js', ...]
  } catch (e) {
    console.error('[custom] impossible de récupérer la liste', e);
    return;
  }

  // Fire-and-forget //
  modules.forEach(spec => {
    // (optionnel) bust cache si tu changes souvent les fichiers
    const url = `${spec}?v=${Date.now()}`;

    import(/* @vite-ignore */ url)
      .then(mod => {
        console.info('[custom] loaded :', spec);
        // Si un module exporte une init() par convention :
        if (typeof mod?.init === 'function') mod.init();
        // ou si default est une fonction :
        if (typeof mod?.default === 'function') mod.default();
      })
      .catch(err => {
        console.debug('[custom] ignored :', spec, err?.message || err);
      });
  });
})();


/*
    note to avoid upload of modif in YOUR LOCAL REPO : 
    git update-index --skip-worktree public/customModulesIndex.js
*/