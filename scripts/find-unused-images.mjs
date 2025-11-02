// Find unused images (ESM / Node >=14)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = process.argv[2] || "public";
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp"]);
const CODE_EXT  = new Set([".js", ".mjs", ".html", ".ejs", ".css", ".json", ".md"]);
const EXCLUDE_DIRS = new Set(["node_modules", ".git", ".cache", "dist", "build"]);

function listFiles(root, filterExtSet) {
  const out = [];
  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!EXCLUDE_DIRS.has(e.name)) walk(full);
      } else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (!filterExtSet || filterExtSet.has(ext)) out.push(full);
      }
    }
  }
  walk(root);
  return out;
}

const repoRoot = process.cwd();
const publicPath = path.join(repoRoot, PUBLIC_DIR);

const images = listFiles(publicPath, IMAGE_EXT);
const codeFiles = listFiles(repoRoot).filter(f => CODE_EXT.has(path.extname(f).toLowerCase()));

let allText = "";
for (const f of codeFiles) {
  try {
    allText += fs.readFileSync(f, "utf8") + "\n";
  } catch {}
}

const rows = [["image","bytes","used_by_path","used_by_basename"]];
let unusedCount = 0;

for (const img of images) {
  const rel = path.relative(publicPath, img).replace(/\\/g, "/");
  const base = path.basename(img);
  let stat = { size: 0 };
  try { stat = fs.statSync(img); } catch {}

  const usedByPath = allText.includes(rel);
  const usedByBase = usedByPath ? true : allText.includes(base);

  if (!usedByPath && !usedByBase) unusedCount++;

  rows.push([
    path.relative(repoRoot, img).replace(/\\/g, "/"),
    stat.size,
    usedByPath ? "yes" : "no",
    usedByBase ? "yes" : "no"
  ]);
}

const csv = rows.map(r => r.map(s => `"${String(s).replace(/"/g, '""')}"`).join(",")).join("\n");
fs.writeFileSync(path.join(__dirname, "../unused-images.csv"), csv);

console.log(`\nScanned ${images.length} image(s) in "${PUBLIC_DIR}" and ${codeFiles.length} code/text file(s).`);
console.log(`→ Report saved to unused-images.csv`);
console.log(`→ Potentially unused images: ${unusedCount}\n`);
if (unusedCount > 0) {
  console.log('Hint: images with both "used_by_path" = no and "used_by_basename" = no are probably safe to delete.');
}
