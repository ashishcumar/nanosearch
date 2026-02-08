import { useEffect, useState } from "react";
import "./App.css";
import BackgroundGradient from "./components/Background/BackgroundGradient";
import { IconExternalLink, IconSearch } from "./Svg";
import { TelemetryProvider, useTelemetry } from "./context/TelemetryContext";
import ComparisonCards from "./components/ComparisonCards/ComparisonCards";
import PerformanceMonitor from "./components/Performance/PerformanceMonitor";
import MainThreadNaive from "./components/Results/MainThreadNaive";
import SABSearch from "./components/Results/SABSearch";

function AppContent() {
  const [search, setSearch] = useState<string>("");
  const [mainThreadMode, setMainThreadMode] = useState(false);
  const { setNaiveTelemetry } = useTelemetry();

  useEffect(() => {
    if (!mainThreadMode) setNaiveTelemetry(null);
  }, [mainThreadMode, setNaiveTelemetry]);

  return (
      <div className="app-wrapper">
        <BackgroundGradient />
        <div className="app">
        <PerformanceMonitor />

        <div className="app-header">
          <div className="app-header-title">
            <h1 className="app-project-name">NanoSearch</h1>
            <p className="app-title-sub">Search Benchmark: Main Thread vs Worker (50 Lakh words)</p>
          </div>
          <a
            href="/words.json"
            target="_blank"
            rel="noopener noreferrer"
            className="app-header-link"
            title="Open words JSON in new tab"
          >
            <span>words.json</span>
            <IconExternalLink className="app-header-link-icon" />
          </a>
        </div>

        <ComparisonCards />

        <div className="command-palette">
          <div className="search-bar">
            <IconSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search 50 Lakh words..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="toggle-row">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={mainThreadMode}
                onChange={(e) => setMainThreadMode(e.target.checked)}
              />
              <span>Main Thread (Naive) – blocks UI</span>
            </label>
          </div>

          <div className="panels">
            <div className="panel panel-naive">
              <h3 className="panel-title">
                {mainThreadMode ? "Naive (Main Thread – 50 Lakh)" : "Naive disabled"}
              </h3>
              {mainThreadMode ? (
                <MainThreadNaive searchedWord={search} />
              ) : (
                <div className="pane-loading">Enable above to compare blocking behavior</div>
              )}
            </div>
            <div className="panel panel-optimized">
              <h3 className="panel-title">Optimized (Web Worker SAB – 50 Lakh)</h3>
              <SABSearch searchedWord={search} />
            </div>
          </div>
        </div>
        </div>
      </div>
  );
}

function App() {
  return (
    <TelemetryProvider>
      <AppContent />
    </TelemetryProvider>
  );
}

export default App;
