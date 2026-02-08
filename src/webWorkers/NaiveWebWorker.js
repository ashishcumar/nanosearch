let words = [];

async function loadWords() {
  const res = await fetch("/words.json");
  const data = await res.json();
  words = data;
  postMessage({ type: "READY" });
}

function search(query) {
  const t0 = performance.now();
  const q = query.trim().toLowerCase();

  const results = words.filter((item) => item.word.toLowerCase().startsWith(q));

  const t1 = performance.now();
  const latencyUs = (t1 - t0) * 1000;
  const throughput = words.length / (t1 - t0);

  return {
    results,
    telemetry: {
      latencyUs,
      throughput,
      scanned: words.length,
      matchCount: results.length,
    },
  };
}

onmessage = (e) => {
  const { type, query } = e.data;

  if (type === "INIT") {
    loadWords();
    return;
  }
  if (type === "SEARCH") {
    const payload = search(query);
    postMessage({ type: "RESULTS", ...payload });
  }
};
