// LoadingScreen.jsx
import "./LoadingScreen.css";

export function LoadingScreen({ fullScreen = false }) {
  return (
    <div className={`loading-screen ${fullScreen ? "full-screen" : ""}`}>
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
}
