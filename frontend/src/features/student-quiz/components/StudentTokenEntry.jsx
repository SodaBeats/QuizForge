import avatarPeeking from "../../../assets/avatar_token.png";
import lightbulbClean from "../../../assets/lightbulb_token.png";
import checklistClean from "../../../assets/checklist_token.png";
import booksClean from "../../../assets/books_token.png";
import paperPlaneClean from "../../../assets/paper_plane_token.png";
import "../pages/StudentTokenPage.css";

export function StudentTokenEntry({
  isModalOpen,
  otp,
  inputRefs,
  onOtpChange,
  onOtpKeyDown,
  onOtpPaste,
  filledCount,
  onStartAttempt,
  onLogout,
}) {
  return (
    <div className="student-token-page">
      <img className="bg-icon lightbulb" src={lightbulbClean} alt="" />
      <img className="bg-icon checklist" src={checklistClean} alt="" />
      <img className="bg-icon books" src={booksClean} alt="" />
      <img className="bg-icon paper-plane" src={paperPlaneClean} alt="" />

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

      <div className="stage">
        <img className="mascot" src={avatarPeeking} alt="QuizForge mascot" />

        {isModalOpen ? (
          <div className="card">
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

            <h1 className="text-accent">Enter Token</h1>
            <p className="subtext">
              Enter the 6-character token provided by your instructor
            </p>

            <div className="otp">
              {otp.map((char, index) => (
                <input
                  key={index}
                  ref={(element) => (inputRefs.current[index] = element)}
                  maxLength={1}
                  autoFocus={index === 0}
                  placeholder="X"
                  value={char}
                  onChange={(event) => onOtpChange(index, event.target.value)}
                  onKeyDown={(event) => onOtpKeyDown(index, event)}
                  onPaste={onOtpPaste}
                />
              ))}
            </div>

            <div className="counter">
              <span>{filledCount}</span> / 6 characters
            </div>

            <button className="btn btn-primary" onClick={onStartAttempt}>
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

            <button className="btn btn-ghost" onClick={onLogout}>
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
