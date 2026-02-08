import { useEffect, useState } from "react";
import "./SearchPane.css";

const NaiveSearch = ({ searchedWord }: { searchedWord: string }) => {
  const [isWordsLoaded, setIsWordsLoaded] = useState(false);
  const [results, setResults] = useState<{ word: string }[]>([]);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [telemetry, setTelemetry] = useState<{
    nodesVisited: number;
    searchTime: number;
    throughput: number;
    memoryFootprint: number;
    algorithmDetails: string;
  }>({
    nodesVisited: 0,
    searchTime: 0,
    throughput: 0,
    memoryFootprint: 0,
    algorithmDetails: "",
  });
  console.log("telemetry -->", telemetry);
  useEffect(() => {
    const initWorker = async () => {
      try {
        const w = new Worker(
          new URL("../../webWorkers/NaiveWebWorker.js", import.meta.url),
        );
        setWorker(w);
        w.postMessage({ type: "INIT" });
        w.onmessage = (e) => {
          if (e.data.type === "READY") {
            setIsWordsLoaded(true);
          }
          if (e.data.type === "RESULTS") {
            setResults(e.data.results || []);
            const t = e.data.telemetry || {};
            setTelemetry({
              nodesVisited: t.scanned ?? 0,
              searchTime: (t.latencyUs ?? 0) / 1000,
              throughput: t.throughput ?? 0,
              memoryFootprint: t.memoryFootprint ?? 0,
              algorithmDetails: t.algorithmDetails ?? "O(n) linear scan",
            });
          }
        };
      } catch (error) {
        console.error("Error initializing worker:", error);
      }
    };
    initWorker().catch(console.error);
    return () => {
      worker?.terminate();
      setWorker(null);
      setResults([]);
      setIsWordsLoaded(false);
    };
  }, []);

  useEffect(() => {
    if (isWordsLoaded) {
      worker?.postMessage({ type: "SEARCH", query: searchedWord });
    }
  }, [searchedWord, isWordsLoaded, worker]);

  return (
    <div>
      {isWordsLoaded ? (
        <>
          <div className="pane-section-header">Telemetry</div>
          <div className="pane-telemetry">
            <div className="pane-telemetry-pill">
              <span>Scanned</span>
              <strong>{telemetry.nodesVisited.toLocaleString()}</strong>
            </div>
            <div className="pane-telemetry-pill">
              <span>Latency</span>
              <strong>{(telemetry.searchTime ?? 0).toFixed(2)} ms</strong>
            </div>
            <div className="pane-telemetry-pill">
              <span>Throughput</span>
              <strong>{(telemetry.throughput ?? 0).toFixed(0)}/ms</strong>
            </div>
            <div className="pane-telemetry-pill">
              <span>Matches</span>
              <strong>{results.length}</strong>
            </div>
            <div className="pane-telemetry-pill">
              <span className="pane-badge">O(n)</span>
            </div>
          </div>
          <div className="pane-section-header">Results</div>
          <div className="pane-results">
            {results.slice(0, 100).map((result) => (
              <div key={result.word} className="pane-results-item">
                <span className="word">{result.word}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="pane-loading">Loading words...</div>
      )}
    </div>
  );
};
export default NaiveSearch;
