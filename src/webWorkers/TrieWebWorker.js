const HEADER = 3;
const NODE_SIZE = 5;

let trie = null; 

function getNode(arr, idx) {
  const base = HEADER + idx * NODE_SIZE;
  return {
    char: arr[base],
    left: arr[base + 1],
    right: arr[base + 2],
    next: arr[base + 3],
    isEnd: arr[base + 4],
  };
}

function findPrefixNode(arr, prefix) {
  if (!prefix) return { nodeIdx: 0, prefix: "" };
  let idx = 0;
  const q = prefix.toLowerCase();
  let i = 0;
  while (i < q.length) {
    const ch = q.charCodeAt(i);
    const n = getNode(arr, idx);
    if (ch < n.char) {
      idx = n.left;
      if (idx === -1) return { nodeIdx: -1, prefix: "" };
    } else if (ch > n.char) {
      idx = n.right;
      if (idx === -1) return { nodeIdx: -1, prefix: "" };
    } else {
      i++;
      if (i === q.length) return { nodeIdx: idx, prefix: q.slice(0, -1) };
      idx = n.next;
      if (idx === -1) return { nodeIdx: -1, prefix: "" };
    }
  }
  return { nodeIdx: 0, prefix: "" };
}

function collectWords(arr, nodeIdx, prefix, results, stats, limit = 10000, atPrefixRoot = false) {
  if (nodeIdx === -1 || results.length >= limit) return;
  stats.nodesVisited++;
  const n = getNode(arr, nodeIdx);
  if (n.char < 0) return;
  const currentWord = prefix + String.fromCharCode(n.char);
  if (n.isEnd === 1) results.push({ word: currentWord });
  if (!atPrefixRoot) {
    collectWords(arr, n.left, prefix, results, stats, limit, false);
    collectWords(arr, n.right, prefix, results, stats, limit, false);
  }
  collectWords(arr, n.next, currentWord, results, stats, limit, false);
}

async function loadTrie() {
  try {
    const res = await fetch("/trie.bin");
    if (!res.ok) throw new Error(`Failed to load trie: ${res.status}`);
    const buf = await res.arrayBuffer();
    trie = new Int32Array(buf);
    postMessage({ type: "READY" });
  } catch (err) {
    postMessage({ type: "ERROR", message: err.message });
  }
}

function search(query) {
  const t0 = performance.now();
  const q = query.trim().toLowerCase();
  const results = [];
  const stats = { nodesVisited: 0 };

  if (!trie) {
    return { results: [], telemetry: { latencyUs: 0, throughput: 0, scanned: 0, matchCount: 0 } };
  }

  const { nodeIdx, prefix } = findPrefixNode(trie, q);

  if (nodeIdx !== -1) {
    collectWords(trie, nodeIdx, prefix, results, stats, 10000, q.length > 0);
  }

  const t1 = performance.now();
  const latencyUs = (t1 - t0) * 1000;
  const throughput = stats.nodesVisited > 0 ? stats.nodesVisited / (t1 - t0) : 0;

  return {
    results,
    telemetry: {
      latencyUs,
      throughput,
      scanned: stats.nodesVisited,
      matchCount: results.length,
      complexity: `O(L) where L=${q.length}`,
    },
  };
}

onmessage = (e) => {
  const { type, query } = e.data;

  if (type === "INIT") {
    loadTrie();
    return;
  }

  if (type === "SEARCH") {
    const payload = search(query);
    postMessage({ type: "RESULTS", ...payload });
  }
};
