// utils/time.js (optional helper)
export function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const msRem = Math.floor(ms % 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${m}m ${sec}s ${msRem}ms`;
  if (m) return `${m}m ${sec}s ${msRem}ms`;
  if (sec) return `${sec}s ${msRem}ms`;
  return `${msRem}ms`;
}

// formatBytes(123456789, { base: 1024, decimals: 1 }) -> "117.7 MiB"
export function formatBytes(bytes, {
  base = 1024,       // 1000 pour SI (kB, MB, ...), 1024 pour IEC (KiB, MiB, ...)
  decimals = 1,      // nombre de décimales
  space = true,      // espace entre la valeur et l’unité
  iecUnits = true,   // true => KiB/MiB/GiB ; false => KB/MB/GB
} = {}) {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes === 0) return "0 B";

  const k = base;
  const units = iecUnits
    ? ["B", "KiB", "MiB", "GiB", "TiB", "PiB"]
    : ["B", "KB", "MB", "GB", "TB", "PB"];

  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    units.length - 1
  );

  const value = bytes / Math.pow(k, i);
  const sep = space ? " " : "";
  return `${value.toFixed(i === 0 ? 0 : decimals)}${sep}${units[i]}`;
}


export function  escapeHtml(s) {
        return String(s).replace(
          /[&<>"']/g,
          (m) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            }[m])
        );

        }