import { useEffect, useState, useRef } from "react";
import { useTelemetry } from "../../context/TelemetryContext";
import ResultList from "./ResultList";
import "../Search/SearchPane.css";

const SABSearch = ({ searchedWord }: { searchedWord: string }) => {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ word: string }[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const { setSabTelemetry } = useTelemetry();

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        if (typeof SharedArrayBuffer === "undefined") {
          throw new Error("SharedArrayBuffer not available. Use Chrome/Edge and ensure COOP/COEP headers.");
        }
        const res = await fetch("/sab-data.bin");
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const ab = await res.arrayBuffer();
        const sab = new SharedArrayBuffer(ab.byteLength);
        new Uint8Array(sab).set(new Uint8Array(ab));

        const w = new Worker(
          new URL("../../webWorkers/SABSearchWorker.js", import.meta.url)
        );
        workerRef.current = w;

        w.onmessage = (e) => {
          if (cancelled) return;
          if (e.data.type === "READY") setReady(true);
          if (e.data.type === "ERROR") setError(e.data.message);
          if (e.data.type === "RESULTS") {
            setResults(e.data.results || []);
            if ((e.data.query || "").trim() === "") {
              setSabTelemetry(null);
            } else {
              const t = e.data.telemetry || {};
              const searchMs = (t.latencyUs ?? 0) / 1000;
              setSabTelemetry({
                searchLatencyMs: searchMs,
                uiBlockTimeMs: 0,
                scanned: t.scanned ?? 0,
                matchCount: t.matchCount ?? 0,
              });
            }
          }
        };

        w.onerror = () => setError("Worker error");

        w.postMessage({ type: "INIT", sab });
      } catch (err) {
        setError(err instanceof Error ? err.message : "SAB init failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (ready && workerRef.current) {
      workerRef.current.postMessage({ type: "SEARCH", query: searchedWord });
    }
    if (searchedWord.trim() === "") setSabTelemetry(null);
  }, [ready, searchedWord, setSabTelemetry]);

  if (loading) return <div className="pane-loading">Loading SAB data (92MB)...</div>;
  if (error)
    return (
      <div className="pane-error">
        {error}
        <br />
        <small>Run: npm run dev (Vite sends COOP/COEP). Use Chrome/Edge.</small>
      </div>
    );
  if (!ready) return <div className="pane-loading">Initializing...</div>;

  return (
    <>
      <div className="pane-section-header">Results</div>
      <ResultList results={results} query={searchedWord.trim()} />
    </>
  );
};

export default SABSearch;
