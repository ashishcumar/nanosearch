import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(__dirname, "..", "public", "words-5m.txt");
const OUTPUT = path.join(__dirname, "..", "public", "sab-data.bin");
const MAGIC = 0x4e414e4f; 
const LOG_INTERVAL = 500_000;

const main = () => {
  const start = Date.now();
  console.log("=== SAB Data Builder ===\n");

  const lines = fs.readFileSync(INPUT, "utf-8").split("\n").filter(Boolean);
  lines.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const wordCount = lines.length;
  console.log(`Words: ${wordCount.toLocaleString()} (sorted)\n`);

  const encoder = new TextEncoder();
  const heapChunks = [];
  let heapOffset = 0;
  const index = new Uint32Array(wordCount * 2);

  for (let i = 0; i < wordCount; i++) {
    const bytes = encoder.encode(lines[i]);
    index[i * 2] = heapOffset;
    index[i * 2 + 1] = bytes.length;
    heapChunks.push(bytes);
    heapOffset += bytes.length;

    if ((i + 1) % LOG_INTERVAL === 0) {
      console.log(`   Processed ${(i + 1).toLocaleString()} / ${wordCount.toLocaleString()}`);
    }
  }

  const heapLength = heapOffset;
  const indexBytes = index.byteLength;
  const headerBytes = 8;
  const totalBytes = headerBytes + indexBytes + heapLength;

  console.log(`\nHeap: ${(heapLength / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Index: ${(indexBytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Total: ${(totalBytes / 1024 / 1024).toFixed(1)} MB\n`);

  const buffer = new ArrayBuffer(totalBytes);
  const view = new DataView(buffer);
  view.setUint32(0, MAGIC, true);
  view.setUint32(4, wordCount, true);

  new Uint8Array(buffer, headerBytes, indexBytes).set(new Uint8Array(index.buffer));

  let written = headerBytes + indexBytes;
  for (const chunk of heapChunks) {
    new Uint8Array(buffer, written, chunk.length).set(chunk);
    written += chunk.length;
  }

  const dir = path.dirname(OUTPUT);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT, Buffer.from(buffer));

  console.log(`Wrote ${OUTPUT}`);
  console.log(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
};

main();
