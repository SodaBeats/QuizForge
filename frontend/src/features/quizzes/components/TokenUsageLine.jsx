/* Daily token-budget readout used in the quiz maker headers.
   FileViewer shows the embedding kind, QuestionEditor the generation kind.
   Renders nothing while the usage query is loading or if it failed — the
   header stays usable without the numbers. */

import { useTokenUsage } from "../api/queries.js";

const LABELS = {
  embedding: "Embedding",
  generation: "Generation",
};

export function TokenUsageLine({ kind }) {
  const { data: usage } = useTokenUsage();
  const entry = usage?.[kind];

  if (!entry) return null;

  const over = entry.used >= entry.limit;

  return (
    <p className={`text-xs text-right ${over ? "text-red-400" : "text-muted"}`}>
      {`${LABELS[kind]}: ${entry.used.toLocaleString("en-US")} / ${entry.limit.toLocaleString(
        "en-US",
      )} tokens${over ? " — over daily limit" : ""}`}
    </p>
  );
}
