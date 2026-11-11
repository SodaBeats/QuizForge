// LoadingScreen.jsx
import "./LoadingScreen.css";

export function LoadingScreen({ fullScreen = false, message = "Loading..." }) {
  return (
    <div
      className={`loading-screen ${fullScreen ? "full-screen" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="spinner" aria-hidden="true"></div>
      <p>{message}</p>
    </div>
  );
}
