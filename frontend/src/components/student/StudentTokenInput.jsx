// QuizTokenModal.jsx
import { useState, useContext } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../AuthProvider";

export default function QuizTokenModal({ isOpen, onSubmit }) {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    try {
      logout();
    } catch (error) {
      alert("Error: " + error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate token input
    if (!token.trim()) {
      toast.error("Please enter a quiz token");
      return;
    }

    if (token.length !== 6) {
      toast.error("Quiz token must be 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Call the parent's submit handler
      await onSubmit(token);
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-canvas/70 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg p-8 w-96 max-w-full mx-4 border border-muted/20">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-ink mb-2">
            Enter Quiz Token
          </h2>
          <p className="text-sm text-muted">
            Enter the 6-character token provided by your instructor
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Token Input */}
          <div>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="XXXXXX"
              className="w-full px-4 py-3 bg-surface border-2 border-muted/20 rounded-lg text-ink text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-accent uppercase"
              autoFocus
            />
            <p className="text-xs text-muted text-center mt-2">
              {token.length}/6 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || token.length !== 6}
            className="w-full px-4 py-3 bg-accent text-canvas rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Start Attempt"}
          </button>
        </form>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full mt-4 px-4 py-2 bg-transparent border border-muted/20 hover:border-red-500 hover:bg-red-500/10 text-muted hover:text-red-400 rounded-lg transition-colors font-medium"
        >
          Logout
        </button>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted">
            Don't have a token? Contact your instructor
          </p>
        </div>
      </div>
    </div>
  );
}
