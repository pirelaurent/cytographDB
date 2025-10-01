"use strict";
/*
  loaded at startup
  scan directory public/custom/*.js  to load optional custom modules automatically  
*/


export async function loadCustomModules() {
  let modules = [];
  try {
    const res = await fetch('/api/custom-modules', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    modules = await res.json();
  } catch (e) {
    console.error('[custom] impossible de récupérer la liste', e);
    return;
  }

  await Promise.allSettled(modules.map(async spec => {
    const url = `${spec}?v=${Date.now()}`;
    try {
      const mod = await import(url); // @vite-ignore inutile en natif
      console.info('[custom] loaded :', spec);
      if (typeof mod?.init === 'function') mod.init();
      if (typeof mod?.default === 'function') mod.default();
    } catch (err) {
      console.debug('[custom] ignored :', spec, err?.message || err);
    }
  }));
}



/*
    note to avoid upload of modif in YOUR LOCAL REPO : 
    git update-index --skip-worktree public/customModulesIndex.js
*/