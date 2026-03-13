import { useEffect, useState, useCallback } from "react";
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function StudentTimeLimit({quiz, handleAutoSubmit}) {

  // 1. Initialize state with total seconds
  // Using a fallback of 0 if time_limit isn't provided
  const [secondsLeft, setSecondsLeft] = useState((quiz.timeLimit || 0) * 60);
  const navigate = useNavigate();

  useEffect(()=>{
    if(secondsLeft<=0) return;

    //set up interval
    const intervalId = setInterval(()=>{
      setSecondsLeft((prev)=>{
        if(prev<=1){
          clearInterval(intervalId); // stop at zero
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    //cleanup: stops timer when user leaves page
    return () => clearInterval(intervalId);

  }, []);

  //calls the submit function when the time runs out
  const onQuizTimeLimit = useCallback(async()=> {

    await handleAutoSubmit();
    toast.error('Time is Up!');
    navigate('/student', { replace: true });

  }, [navigate, handleAutoSubmit]);

  useEffect(()=>{
    if(secondsLeft === 0){
      onQuizTimeLimit();
    }
  }, [secondsLeft, onQuizTimeLimit]);

  //formatting time before display
  const minutes = Math.floor(secondsLeft/60);
  const seconds = secondsLeft%60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;


  return (
    <div className="w-72 border-l border-gray-700 bg-gray-900 p-6 hidden lg:flex flex-col gap-8">
      {/* Timer Section */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Time Remaining</p>
        <div className={`text-4xl font-mono font-bold ${secondsLeft < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          {formattedTime}
        </div>
      </div>

      {/* Quiz Info */}
      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500 font-semibold mb-1">Current Score Potential</p>
          <p className="text-sm text-gray-300">100 Points</p>
        </div>
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