import { useContext, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../../../app/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useRequestQuizAccess } from "../api/mutations.js";
import { StudentTokenEntry } from "../components/StudentTokenEntry";

export function StudentTokenPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const requestQuizAccess = useRequestQuizAccess();
  const inputRefs = useRef([]);

  const handleSubmitToken = async (token) => {
    try {
      const quizAndQuestions = await requestQuizAccess.mutateAsync(token);

      if (quizAndQuestions.totalAttempts >= quizAndQuestions.maxAttempts) {
        throw new Error(
          `You have used up all ${quizAndQuestions.maxAttempts} available attempts`,
        );
      }

      toast.success("Quiz found! Starting...");
      setIsModalOpen(false);
      navigate(`/student/quiz/${quizAndQuestions.shareToken}`);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Something went wrong");
    }
  };

  const handleOtpChange = (index, value) => {
    const char = value.slice(-1).toUpperCase();
    if (char && !/^[A-Z0-9]$/.test(char)) return;

    const next = [...otp];
    next[index] = char;
    setOtp(next);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    const text = event.clipboardData.getData("text").trim().toUpperCase();
    if (!text) return;

    event.preventDefault();
    const chars = text.slice(0, 6).split("");
    const next = ["", "", "", "", "", ""];

    chars.forEach((char, index) => {
      next[index] = char;
    });

    setOtp(next);
    const lastIndex = Math.min(chars.length, 6) - 1;
    if (lastIndex >= 0) {
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const filledCount = otp.filter((char) => char !== "").length;
  const token = otp.join("");

  const handleStartAttempt = () => {
    if (filledCount !== 6) {
      toast.error("Please enter all 6 characters of your token");
      return;
    }

    handleSubmitToken(token);
  };

  return (
    <StudentTokenEntry
      isModalOpen={isModalOpen}
      otp={otp}
      inputRefs={inputRefs}
      onOtpChange={handleOtpChange}
      onOtpKeyDown={handleOtpKeyDown}
      onOtpPaste={handleOtpPaste}
      filledCount={filledCount}
      onStartAttempt={handleStartAttempt}
      onLogout={logout}
    />
  );
}
