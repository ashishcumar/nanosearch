import { Fragment } from "react";
import "./Highlighter.css";

const Highlighter = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) {
    return <span>{text}</span>;
  }

  const escaped = query.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={`${part}-${i}`} className="highlighter-mark">
            {part}
          </mark>
        ) : (
          <Fragment key={`${part}-${i}`}>{part}</Fragment>
        )
      )}
    </span>
  );
};

export default Highlighter;
