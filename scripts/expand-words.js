import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORD_PATH = path.join(__dirname, "..", "words.txt");
const OUTPUT_JSON = path.join(__dirname, "..", "public", "words-5m.json");
const OUTPUT_TXT = path.join(__dirname, "..", "public", "words-5m.txt");
const TARGET_COUNT = 5_000_000;
const LOG_INTERVAL = 200_000;

const main = () => {
  const start = Date.now();
  console.log("=== Word Expansion: 466k → 50 Lakh ===\n");

  const raw = fs.readFileSync(WORD_PATH, "utf-8").split("\n");
  const base = raw.map((w) => w.trim()).filter(Boolean);
  const baseLen = base.length;

  const copies = Math.ceil(TARGET_COUNT / baseLen);
  console.log(`Base words: ${baseLen}, copies needed: ${copies}\n`);

  const expanded = [];
  for (let c = 0; c < copies; c++) {
    const suffix = c === 0 ? "" : `_${c}`;
    for (let i = 0; i < baseLen && expanded.length < TARGET_COUNT; i++) {
      expanded.push(base[i] + suffix);
    }
    if ((c + 1) % 2 === 0 || c === copies - 1) {
      console.log(`   Copy ${c + 1}/${copies} — ${expanded.length.toLocaleString()} words`);
    }
  }

  console.log(`\nTotal: ${expanded.length.toLocaleString()} words\n`);

  const dir = path.dirname(OUTPUT_JSON);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log("Writing words-5m.txt...");
  fs.writeFileSync(OUTPUT_TXT, expanded.join("\n"), "utf-8");

  console.log("Writing words-5m.json...");
  const data = expanded.map((w) => ({ word: w }));
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(data), "utf-8");

  const jsonMB = (fs.statSync(OUTPUT_JSON).size / 1024 / 1024).toFixed(1);
  const txtMB = (fs.statSync(OUTPUT_TXT).size / 1024 / 1024).toFixed(1);
  console.log(`\nDone in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  console.log(`  words-5m.txt: ${txtMB} MB`);
  console.log(`  words-5m.json: ${jsonMB} MB`);
};

main();
