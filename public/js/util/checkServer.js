// Vérifie rapidement qu'un serveur répond, avec timeout court
async function isServerUp(url = '/healthz', timeoutMs = 1500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
    return res.ok; // 2xx
  } catch {
    return false; // timeout, refus de connexion, CORS, etc.
  } finally {
    clearTimeout(t);
  }
}

/* Exemple 
document.addEventListener('DOMContentLoaded', async () => {
  const up = await isServerUp('/healthz');
  console.log('server up?', up);
});
*/