import { useEffect, useState, useCallback, useRef } from "react";

export default function StudentTimeLimit({timeLimit, onTimeout, attemptCount, maxAttempts}) {

  // 1. Initialize state
  const [startTime] = useState(()=>Date.now());
  const [now, setNow] = useState(() => Date.now());
  const hasTimedOut = useRef(false);

  // Set start time on mount (when question changes, component remounts)

  const finishTime = startTime + timeLimit * 1000;
  const remainingMs = Math.max(0, finishTime - now);
  const remainingSeconds = Math.floor(remainingMs / 1000);

  useEffect(()=>{
    if(timeLimit <= 0) return;

    //set up interval
    const intervalId = setInterval(()=>{
      setNow(Date.now());
    }, 1000);

    //cleanup: stops timer when user leaves page
    return () => clearInterval(intervalId);

  }, [timeLimit]);

  // Auto-advance when time runs out
  const handleTimeout = useCallback(async()=> {
    onTimeout();
  }, [onTimeout]);

  useEffect(()=>{
    if(timeLimit > 0 && remainingSeconds === 0 && !hasTimedOut.current){
      hasTimedOut.current = true;
      handleTimeout();
    }
  }, [timeLimit, handleTimeout, remainingSeconds]);

  //formatting time before display
  const minutes = Math.floor(remainingSeconds/60);
  const seconds = remainingSeconds%60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="w-72 border-l border-gray-700 bg-gray-900 p-6 hidden lg:flex flex-col gap-8">
      {/* Timer Section */}
      <>
        <h2 className="text-m text-white-500 font-bold mb-2">{`Attempt: ${attemptCount} of ${maxAttempts}`}</h2>
      </>
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Time Remaining</p>
        <div className={`text-4xl font-mono font-bold ${remainingSeconds < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          {formattedTime}
        </div>
      </div>

      {/* Quiz Info */}
      <div className="space-y-4">
        <div className="pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 font-semibold mb-2">Instructions</p>
          <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4">
            <li>Answers are saved automatically.</li>
            <li>You can go back to change answers.</li>
            <li>The question auto-advances when time expires.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}