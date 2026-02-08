import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORD_PATH = path.join(__dirname, "..", "words.txt");
const OUTPUT_PATH = path.join(__dirname, "..", "public", "words.json");

const LOG_INTERVAL = 1000;

const makeArr = (words) => {
  const cleaned = words.map((w) => w.trim()).filter(Boolean);
  return cleaned;
};

const main = () => {
  const totalStart = Date.now();
  console.log("=== NanoSearch Words Builder ===\n");

  console.log("[0/3] Reading words.txt...");
  const raw = fs.readFileSync(WORD_PATH, "utf-8").split("\n");
  console.log(`       Loaded ${raw.length} lines\n`);

  console.log(`[1/3] Processing words (logging every ${LOG_INTERVAL} words)...`);
  const start = Date.now();
  const cleaned = makeArr(raw);
  const data = cleaned.reduce((acc, w, i) => {
    if ((i + 1) % LOG_INTERVAL === 0) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const rate = ((i + 1) / (Date.now() - start) * 1000).toFixed(0);
      const pct = (((i + 1) / cleaned.length) * 100).toFixed(1);
      console.log(`       ${i + 1} / ${cleaned.length} (${pct}%) — ${elapsed}s elapsed — ~${rate} words/sec`);
    }
    acc.push({ word: w });
    return acc;
  }, []);
  console.log(`[2/3] Processed ${data.length} words in ${((Date.now() - start) / 1000).toFixed(2)}s\n`);

  console.log("[3/3] Writing words.json...");
  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data), "utf-8");
  const sizeMB = (Buffer.byteLength(JSON.stringify(data)) / 1024 / 1024).toFixed(2);
  console.log(`       Saved ${data.length} words (${sizeMB} MB) to ${OUTPUT_PATH}\n`);

  const totalMs = ((Date.now() - totalStart) / 1000).toFixed(2);
  console.log(`=== Done in ${totalMs}s ===`);
};


main()