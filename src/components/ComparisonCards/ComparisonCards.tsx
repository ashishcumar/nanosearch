import { useTelemetry } from "../../context/TelemetryContext";
import "./ComparisonCards.css";

export default function ComparisonCards() {
  const { telemetry } = useTelemetry();
  const { naive, sab } = telemetry;

  return (
    <div className="comparison-cards">
      <h4 className="comparison-cards-title">Visual Comparison</h4>
      <div className="comparison-cards-grid">
        <div className="comparison-card comparison-card-naive">
          <div className="comparison-card-header">Naive (Main Thread)</div>
          <dl className="comparison-card-metrics">
            <div>
              <dt>Search Latency</dt>
              <dd>{naive ? `${naive.searchLatencyMs.toFixed(2)} ms` : "—"}</dd>
            </div>
            <div>
              <dt>Nodes scanned</dt>
              <dd>{naive ? naive.scanned.toLocaleString() : "—"}</dd>
            </div>
            <div>
              <dt>Last search block time</dt>
              <dd className={naive && naive.uiBlockTimeMs > 0 ? "comparison-warn" : ""}>
                {naive ? `${naive.uiBlockTimeMs.toFixed(2)} ms` : "—"}
              </dd>
            </div>
            <div>
              <dt>Matches</dt>
              <dd>{naive ? naive.matchCount : "—"}</dd>
            </div>
          </dl>
        </div>
        <div className="comparison-card comparison-card-sab">
          <div className="comparison-card-header">Optimized (SAB Worker)</div>
          <dl className="comparison-card-metrics">
            <div>
              <dt>Search Latency</dt>
              <dd>{sab ? `${sab.searchLatencyMs.toFixed(2)} ms` : "—"}</dd>
            </div>
            <div>
              <dt>Nodes scanned</dt>
              <dd>{sab ? sab.scanned.toLocaleString() : "—"}</dd>
            </div>
            <div>
              <dt>Last search block time</dt>
              <dd className="comparison-ok">{sab ? `${sab.uiBlockTimeMs.toFixed(2)} ms` : "—"}</dd>
            </div>
            <div>
              <dt>Matches</dt>
              <dd>{sab ? sab.matchCount : "—"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
