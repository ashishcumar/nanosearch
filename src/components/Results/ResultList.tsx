/**
 * ResultList: Renders search results with query highlighting.
 */
import Highlighter from "../Highlighter/Highlighter";

type Result = { word: string };

export default function ResultList({
  results,
  query = "",
}: Readonly<{
  results: Result[];
  query?: string;
}>) {
  const slice = results.slice(0, 100);

  return (
    <div className="pane-results" aria-live="polite">
      {slice.map((r, i) => (
        <div key={`${r.word}-${i}`} className="pane-results-item">
          <span className="word">
            <Highlighter text={r.word} query={query} />
          </span>
        </div>
      ))}
    </div>
  );
}
