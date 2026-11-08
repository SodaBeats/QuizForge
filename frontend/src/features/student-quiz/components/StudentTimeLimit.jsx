import { useEffect, useState, useRef } from "react";
import { getTimerStart } from "../lib/attemptStorage.js";

export function StudentTimeLimit({
  timeLimit,
  onTimeout,
  attemptCount,
  maxAttempts,
  attemptId,
  questionId,
  className = "",
}) {
  // 1. Initialize state — validated get-or-create lives in attemptStorage
  const [startTime] = useState(() =>
    getTimerStart({ attemptId, questionId, timeLimit }),
  );
  const [now, setNow] = useState(() => Date.now());
  const hasTimedOut = useRef(false);

  // Set start time on mount (when question changes, component remounts)
  const finishTime = startTime + timeLimit * 1000;
  const remainingMs = Math.max(0, finishTime - now);
  const remainingSeconds = Math.floor(remainingMs / 1000);

  //formatting time before display
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime =
    timeLimit > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : "No limit";

  // changes "now" state pero second to recalculate remaining time
  useEffect(() => {
    if (timeLimit <= 0) return;

    //set up interval
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    //cleanup: stops timer when user leaves page
    return () => clearInterval(intervalId);
  }, [timeLimit]);

  // timeout handler
  useEffect(() => {
    if (timeLimit > 0 && remainingSeconds === 0 && !hasTimedOut.current) {
      hasTimedOut.current = true;
      onTimeout();
    }
  }, [timeLimit, onTimeout, remainingSeconds]);

  return (
    <>
      <div className={`flex items-center justify-between gap-3 border-b border-muted/20 bg-specialsurface px-4 py-2 lg:hidden ${className}`}>
        <span className="text-xs font-semibold text-muted">
          Attempt {attemptCount} of {maxAttempts}
        </span>
        <div className="flex items-center gap-2 rounded-md border border-muted/20 bg-darkslate px-3 py-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted">
            Time
          </span>
          <span
            className={`font-mono text-sm font-bold ${remainingSeconds < 10 && timeLimit > 0 ? "text-red-500 animate-pulse" : "text-inkondark"}`}
            aria-live="polite"
          >
            {formattedTime}
          </span>
        </div>
      </div>
      <div
        className={`hidden w-72 flex-col gap-8 border-l-2 border-accent/50 bg-specialsurface p-6 lg:flex ${className}`}
      >
      {/* Timer Section */}
      <>
        <h2 className="text-inkondark font-bold mb-2">{`Attempt: ${attemptCount} of ${maxAttempts}`}</h2>
      </>
      <div className="bg-darkslate rounded-lg p-6 border border-muted/20 text-center">
        <p className="text-xs text-muted font-bold uppercase tracking-widest mb-2">
          Time Remaining
        </p>
        <div
          className={`text-4xl font-mono font-bold ${remainingSeconds < 10 && timeLimit > 0 ? "text-red-500 animate-pulse" : "text-inkondark"}`}
        >
          {formattedTime}
        </div>
      </div>

      {/* Quiz Info */}
      <div className="space-y-4">
        <div className="pt-4 border-t border-muted/20">
          <p className="text-xs text-muted font-semibold mb-2">Instructions</p>
          <ul className="text-xs text-muted space-y-2 list-disc pl-4">
            <li>Answers are saved automatically.</li>
            <li>The question auto-advances when time expires.</li>
          </ul>
        </div>
      </div>
      </div>
    </>
  );
}
