import { useEffect, useState, useRef } from "react";

export default function StudentTimeLimit({
  timeLimit,
  onTimeout,
  attemptCount,
  maxAttempts,
  attemptId,
  questionId,
}) {
  const timerStorageKey =
    attemptId && questionId ? `quiz_timer_${attemptId}_${questionId}` : null;

  // get stored start time in session storage
  // create new one if none
  const getStoredStartTime = () => {
    if (!timerStorageKey) return Date.now();

    try {
      const savedValue = sessionStorage.getItem(timerStorageKey);
      const parsedValue = Number(savedValue);
      const now = Date.now();
      const maxReasonableAge = timeLimit * 2 * 1000;

      if (
        !savedValue ||
        Number.isNaN(parsedValue) ||
        parsedValue <= 0 ||
        parsedValue > now ||
        now - parsedValue > maxReasonableAge
      ) {
        const now = Date.now();
        sessionStorage.setItem(timerStorageKey, String(now));
        return now;
      }

      return parsedValue;
    } catch (err) {
      console.error(
        "Session Storage access failed, using current time instead: ",
        err,
      );
      return Date.now();
    }
  };

  // 1. Initialize state
  const [startTime] = useState(() => getStoredStartTime());
  const [now, setNow] = useState(() => Date.now());
  const hasTimedOut = useRef(false);

  // Set start time on mount (when question changes, component remounts)
  const finishTime = startTime + timeLimit * 1000;
  const remainingMs = Math.max(0, finishTime - now);
  const remainingSeconds = Math.floor(remainingMs / 1000);

  //formatting time before display
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

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
    <div className="w-72 border-l border-gray-700 bg-gray-900 p-6 hidden lg:flex flex-col gap-8">
      {/* Timer Section */}
      <>
        <h2 className="text-m text-white-500 font-bold mb-2">{`Attempt: ${attemptCount} of ${maxAttempts}`}</h2>
      </>
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">
          Time Remaining
        </p>
        <div
          className={`text-4xl font-mono font-bold ${remainingSeconds < 10 ? "text-red-500 animate-pulse" : "text-white"}`}
        >
          {formattedTime}
        </div>
      </div>

      {/* Quiz Info */}
      <div className="space-y-4">
        <div className="pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 font-semibold mb-2">
            Instructions
          </p>
          <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4">
            <li>Answers are saved automatically.</li>
            <li>The question auto-advances when time expires.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
