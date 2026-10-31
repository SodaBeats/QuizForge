import React, { useEffect, useState } from "react";

const SLOW_AFTER_SECONDS = 25;

// The inner component only exists while generating, so its timer state
// starts fresh at 0 every time and no manual reset is needed.
function GenerationStatusBody({ amount, topic }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);

    // warn the teacher if they try to close/refresh the tab mid-generation
    const warnBeforeLeave = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeave);

    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", warnBeforeLeave);
    };
  }, []);

  const count = Number(amount) || 1;
  const isSlow = seconds >= SLOW_AFTER_SECONDS;

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative mx-3 mt-3 overflow-hidden rounded-md border border-accept/50 bg-darkslate px-3 py-2 font-body"
    >
      <style>{`
        @keyframes gs-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        .gs-bar { animation: gs-slide 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .gs-bar { animation: none; width: 100%; }
        }
      `}</style>

      <div className="flex items-center gap-2.5">
        <span className="flex items-center gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-accept motion-reduce:animate-none"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </span>

        <p className="min-w-0 flex-1 truncate text-xs text-inkondark">
          {isSlow ? (
            "Taking longer than usual. Hang tight."
          ) : (
            <>
              Generating {count} question{count > 1 ? "s" : ""}
              {topic ? ` about "${topic}"` : ""}
              <span className="text-muted"> · </span>
            </>
          )}
        </p>

        <span className="text-xs tabular-nums text-muted">{seconds}s</span>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-muted/20">
        <div className="gs-bar h-full w-2/5 bg-accept" />
      </div>
    </div>
  );
}

export function GenerationStatus({
  isGenerating,
  amount = 5,
  topic = "",
}) {
  if (!isGenerating) return null;
  return <GenerationStatusBody amount={amount} topic={topic} />;
}
