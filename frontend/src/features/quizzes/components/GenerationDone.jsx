import React, { useEffect, useState } from "react";

const SHOW_MS = 2500;

export default function GenerationDone({
  isGenerating,
  failed = false,
  amount = 5,
  className = "",
}) {
  const [prevGenerating, setPrevGenerating] = useState(isGenerating);
  const [show, setShow] = useState(false);

  // Adjust state during render (not in an effect) to avoid cascading renders
  if (prevGenerating !== isGenerating) {
    setPrevGenerating(isGenerating);
    if (prevGenerating && !isGenerating && !failed) {
      setShow(true); // true -> false means generation just finished
    } else if (isGenerating) {
      setShow(false); // generating again, hide immediately
    }
  }

  // Effect handles the timer only. setState lives inside the callback, so the lint rule is satisfied
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setShow(false), SHOW_MS);
    return () => clearTimeout(timer);
  }, [show]);

  if (!show) return null;

  const count = Number(amount) || 1;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`gd-flash flex items-center gap-2.5 rounded-md border border-accept/50 bg-darkslate px-3 py-2 font-body ${className}`}
    >
      <style>{`
        @keyframes gd-blink {
          0%, 100% {
            background-color: var(--darkslate);
            color: var(--inkondark);
            border-color: var(--accept);
          }
          50% {
            background-color: var(--accept);
            color: var(--ink);
            border-color: var(--accept);
          }
        }
        .gd-flash { animation: gd-blink 0.6s ease-in-out 3; }
        @media (prefers-reduced-motion: reduce) {
          .gd-flash {
            animation: none;
            background-color: var(--accept);
            color: var(--ink);
          }
        }
      `}</style>

      <svg
        className="h-4 w-4 shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
          clipRule="evenodd"
        />
      </svg>

      <p className="min-w-0 flex-1 truncate text-xs">
        {count} question{count > 1 ? "s" : ""} generated!
      </p>
    </div>
  );
}
