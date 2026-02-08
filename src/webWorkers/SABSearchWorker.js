const MAGIC = 0x4e414e4f;
const MAX_RESULTS = 100;

let index = null;
let heap = null;
let wordCount = 0;

function getWordBytes(wordIdx) {
  const start = index[wordIdx * 2];
  const len = index[wordIdx * 2 + 1];
  return { start, len };
}

function bytePrefixMatch(heapStart, heapLen, queryBytes) {
  if (queryBytes.length > heapLen) return false;
  for (let i = 0; i < queryBytes.length; i++) {
    let h = heap[heapStart + i];
    const q = queryBytes[i];
    if (h >= 65 && h <= 90) h += 32;
    if (h !== q) return false;
  }
  return true;
}

function compareWordToQuery(wordIdx, queryBytes) {
  const start = index[wordIdx * 2];
  const len = index[wordIdx * 2 + 1];
  const qLen = queryBytes.length;
  for (let i = 0; i < qLen; i++) {
    if (i >= len) return -1;
    let h = heap[start + i];
    if (h >= 65 && h <= 90) h += 32;
    const q = queryBytes[i];
    if (h < q) return -1;
    if (h > q) return 1;
  }
  return 0;
}

function search(queryBytes) {
  if (queryBytes.length === 0) {
    return { results: [], visited: 0 };
  }

  let lo = 0;
  let hi = wordCount;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    const cmp = compareWordToQuery(mid, queryBytes);
    if (cmp < 0) lo = mid + 1;
    else hi = mid;
  }

  const results = [];
  let visited = 0;
  for (let w = lo; w < wordCount && results.length < MAX_RESULTS; w++) {
    visited++;
    if (!bytePrefixMatch(index[w * 2], index[w * 2 + 1], queryBytes)) break;
    results.push(w);
  }
  return { results, visited };
}

function decodeWord(wordIdx) {
  const { start, len } = getWordBytes(wordIdx);
  const copy = new Uint8Array(len);
  copy.set(heap.subarray(start, start + len));
  return new TextDecoder().decode(copy);
}

onmessage = async (e) => {
  const { type, query } = e.data;

  if (type === "INIT" && e.data.sab) {
    const sab = e.data.sab;
    const view = new DataView(sab);
    if (view.getUint32(0, true) !== MAGIC) {
      postMessage({ type: "ERROR", message: "Invalid SAB format" });
      return;
    }
    wordCount = view.getUint32(4, true);
    const indexLen = wordCount * 2 * 4;
    index = new Uint32Array(sab, 8, wordCount * 2);
    heap = new Uint8Array(sab, 8 + indexLen, sab.byteLength - 8 - indexLen);
    postMessage({ type: "READY", wordCount });
    return;
  }

  if (type === "SEARCH" && index && heap) {
    const t0 = performance.now();
    const q = (query || "").trim().toLowerCase();
    const queryBytes = new TextEncoder().encode(q);

    const { results, visited } = search(queryBytes);
    const words = results.map((idx) => ({ word: decodeWord(idx) }));
    const t1 = performance.now();

    postMessage({
      type: "RESULTS",
      query: q,
      results: words,
      telemetry: {
        latencyUs: (t1 - t0) * 1000,
        throughput: visited / (t1 - t0 || 0.001),
        scanned: visited,
        matchCount: words.length,
        complexity: "O(log n) SAB",
      },
    });
  }
};
