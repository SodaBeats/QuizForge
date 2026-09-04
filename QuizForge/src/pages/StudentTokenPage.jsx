import { useContext, useState, useRef } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";
import "./StudentTokenPage.css";

// image imports
import avatarPeeking from "../assets/avatar_token.png";
import lightbulbClean from "../assets/lightbulb_token.png";
import checklistClean from "../assets/checklist_token.png";
import booksClean from "../assets/books_token.png";
import paperPlaneClean from "../assets/paper_plane_token.png";

export default function StudentTokenPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const { authFetch, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const backendHost = import.meta.env.VITE_BACKEND_HOST;

  if (!backendHost) throw new Error("Missing backend host");

  const inputRefs = useRef([]);

  const handleSubmitToken = async (token) => {
    try {
      const response = await authFetch(
        `${backendHost}/api/student/quiz-access`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          credentials: "include",
        },
      );

      if (!response.ok) {
        const result = await response.json();

        throw new Error(
          result.errors?.map((e) => e.msg).join(", ") ||
            result.message ||
            "Access Denied",
        );
      }

      const quizAndQuestions = await response.json();

      // stop user if already used up all attempts
      if (quizAndQuestions.totalAttempts >= quizAndQuestions.maxAttempts) {
        throw new Error(
          `You have used up all ${quizAndQuestions.maxAttempts} available attempts`,
        );
      }

      toast.success("Quiz found! Starting...");
      setIsModalOpen(false);

      // navigate to quiz page
      navigate(`/student/quiz/${quizAndQuestions.shareToken}`);
    } catch (error) {
      console.error(error);
      alert(error.message || "Something went wrong");
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

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData("text").trim().toUpperCase();

    if (!text) return;

    e.preventDefault();

    const chars = text.slice(0, 6).split("");

    const next = ["", "", "", "", "", ""];

    chars.forEach((c, i) => {
      next[i] = c;
    });

    setOtp(next);

    const lastIndex = Math.min(chars.length, 6) - 1;

    if (lastIndex >= 0) {
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const filledCount = otp.filter((c) => c !== "").length;
  const token = otp.join("");

  const handleStartAttempt = () => {
    if (filledCount !== 6) {
      toast.error("Please enter all 6 characters of your token");
      return;
    }

    handleSubmitToken(token);
  };

  return (
    <div className="student-token-page">
      {/* =====================================================
          BACKGROUND DECORATION
          ===================================================== */}

      <img className="bg-icon lightbulb" src={lightbulbClean} alt="" />

      <img className="bg-icon checklist" src={checklistClean} alt="" />

      <img className="bg-icon books" src={booksClean} alt="" />

      <img className="bg-icon paper-plane" src={paperPlaneClean} alt="" />

      {/* =====================================================
          TOP BAR
          ===================================================== */}

      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">Q</div>

          <div className="brand-text">
            <div className="name">
              Quiz<span className="accent">Forge</span>
            </div>

            <div className="tagline">Learn • Practice • Achieve</div>
          </div>
        </div>

        <div className="portal-badge">
          <div className="icon">
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10 12 5 2 10l10 5 10-5Z" />
              <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
            </svg>
          </div>

          <span>STUDENT PORTAL</span>
        </div>
      </div>

      {/* =====================================================
          MAIN STAGE
          ===================================================== */}

      <div className="stage">
        <img className="mascot" src={avatarPeeking} alt="QuizForge mascot" />

        {isModalOpen ? (
          <div className="card">
            {/* =================================================
                CAP ICON
                ================================================= */}

            <div className="cap-icon">
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 10 12 5 2 10l10 5 10-5Z" />
                <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
              </svg>
            </div>

            {/* =================================================
                TITLE
                ================================================= */}

            <h1>
              Enter Quiz <span className="accent">Token</span>
            </h1>

            <p className="subtext">
              Enter the 6-character token provided by your instructor
            </p>

            {/* =================================================
                OTP INPUTS
                ================================================= */}

            <div className="otp">
              {otp.map((char, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  maxLength={1}
                  autoFocus={i === 0}
                  placeholder="X"
                  value={char}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={handleOtpPaste}
                />
              ))}
            </div>

            {/* =================================================
                CHARACTER COUNTER
                ================================================= */}

            <div className="counter">
              <span>{filledCount}</span> / 6 characters
            </div>

            {/* =================================================
                START BUTTON
                ================================================= */}

            <button className="btn btn-primary" onClick={handleStartAttempt}>
              <span className="icn">
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
              Start Attempt
            </button>

            {/* =================================================
                LOGOUT BUTTON
                ================================================= */}

            <button className="btn btn-ghost" onClick={logout}>
              <svg
                viewBox="0 0 24 24"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  verticalAlign: "-2px",
                  marginRight: "4px",
                }}
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              Logout
            </button>

            {/* =================================================
                HELP
                ================================================= */}

            <div className="help">
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
              Don't have a token?
              <a href="#">Contact your instructor</a>
            </div>
          </div>
        ) : (
          <div className="card">
            <h1>Ready to take the quiz!</h1>
          </div>
        )}
      </div>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer>
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        QuizForge <span className="dot">•</span> Built for the Classroom
      </footer>
    </div>
  );
}
