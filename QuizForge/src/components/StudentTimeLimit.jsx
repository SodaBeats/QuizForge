import { useEffect, useState, useCallback } from "react";

export default function StudentTimeLimit({quiz, handleAutoSubmit, attemptCount, maxAttempts, attemptStart}) {

  // 1. Initialize state with total seconds
  // Using a fallback of 0 if time_limit isn't provided
  const timeLimitSeconds = (quiz.timeLimit || 0) * 60;
  const [now, setNow] = useState(() => Date.now());
  const finishTime = new Date(attemptStart).getTime() + timeLimitSeconds * 1000;
  const remainingMs = Math.max(0, finishTime - now);
  const remainingSeconds = Math.floor(remainingMs / 1000);


  useEffect(()=>{
    if(timeLimitSeconds<=0) return;

    //set up interval
    const intervalId = setInterval(()=>{
      setNow(Date.now());
    }, 1000);

    //cleanup: stops timer when user leaves page
    return () => clearInterval(intervalId);

  }, [timeLimitSeconds]);

  // Auto-submit when time runs out
  const onQuizTimeLimit = useCallback(async()=> {

    await handleAutoSubmit();

  }, [handleAutoSubmit]);

  useEffect(()=>{
    if(timeLimitSeconds > 0 && remainingSeconds === 0){
      onQuizTimeLimit();
    }
  }, [timeLimitSeconds, onQuizTimeLimit, remainingSeconds]);

  //formatting time before display
  const minutes = Math.floor(remainingSeconds/60);
  const seconds = remainingSeconds%60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="w-72 border-l border-gray-700 bg-gray-900 p-6 hidden lg:flex flex-col gap-8">
      {/* Timer Section */}
      <>
        <h2 className="text-m text-white-500 font-bold mb-2">{`Attempt: ${attemptCount + 1} of ${maxAttempts}`}</h2>
      </>
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Time Remaining</p>
        <div className={`text-4xl font-mono font-bold ${remainingSeconds < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
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
            <li>The quiz auto-submits when time expires.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}