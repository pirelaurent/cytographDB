// Detect big files (> threshold lines)
// Compatible ESM / Node >= 14
// node scripts/big-files.mjs 500


import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THRESHOLD = Number(process.argv[2] || 200);
const INCLUDE_EXT = new Set([".js", ".mjs", ".css", ".html", ".ejs"]);
const EXCLUDE_DIRS = new Set(["node_modules", ".git", ".cache", "dist", "build"]);

const files = [];

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!EXCLUDE_DIRS.has(e.name)) walk(full);
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (INCLUDE_EXT.has(ext)) files.push(full);
    }
  }
}

walk(process.cwd());

const results = [];
for (const f of files) {
  let text;
  try {
    text = fs.readFileSync(f, "utf8");
  } catch {
    continue;
  }
  const lines = text.split(/\r?\n/).length;
  if (lines > THRESHOLD) results.push({ file: f, lines });
}

results.sort((a, b) => b.lines - a.lines);

console.log(`\nFiles longer than ${THRESHOLD} lines:\n`);
if (results.length === 0) {
  console.log("(none found)");
} else {
  for (const r of results) {
    console.log(String(r.lines).padStart(6), " ", r.file);
  }
}

const csv = ["lines,file", ...results.map(r => `${r.lines},${r.file}`)].join("\n");
fs.writeFileSync(path.join(__dirname, "../big-files.csv"), csv);
console.log(`\n→ Report saved to big-files.csv (${results.length} file(s) over threshold)\n`);
