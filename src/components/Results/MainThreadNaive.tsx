import { useEffect, useState } from "react";
import { useTelemetry } from "../../context/TelemetryContext";
import ResultList from "./ResultList";
import "../Search/SearchPane.css";

type Word = { word: string };

const MainThreadNaive = ({ searchedWord }: { searchedWord: string }) => {
  const [words, setWords] = useState<Word[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [results, setResults] = useState<Word[]>([]);
  const { setNaiveTelemetry } = useTelemetry();

  useEffect(() => {
    fetch("/words-5m.json")
      .then((r) => r.json())
      .then((data: Word[]) => {
        setWords(data);
        setLoaded(true);
      })
      .catch((e) => console.error("Failed to load words-5m.json", e));
  }, []);

  useEffect(() => {
    if (!loaded || !words.length) return;
    const q = searchedWord.trim().toLowerCase();
    if (q === "") {
      setResults([]);
      setNaiveTelemetry(null);
      return;
    }
    const t0 = performance.now();
    const matches = words.filter((w) => w.word.toLowerCase().startsWith(q));
    const t1 = performance.now();
    const blockTime = t1 - t0;
    setResults(matches.slice(0, 100));
    setNaiveTelemetry({
      searchLatencyMs: blockTime,
      uiBlockTimeMs: blockTime,
      scanned: words.length,
      matchCount: matches.length,
    });
  }, [loaded, words, searchedWord, setNaiveTelemetry]);

  useEffect(() => {
    return () => setNaiveTelemetry(null);
  }, [setNaiveTelemetry]);

  if (!loaded) {
    return <div className="pane-loading">Loading 50 Lakh words (main thread)...</div>;
  }

  return (
    <>
      <div className="pane-section-header">Results</div>
      <ResultList results={results} query={searchedWord.trim()} />
    </>
  );
};

export default MainThreadNaive;
