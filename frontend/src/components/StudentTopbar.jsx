import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "./AuthProvider";

export default function SudentTopbar({ onLogout }) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="border-b border-surface-700 p-4 flex items-center justify-between bg-surface-900">
      {/* LEFT SIDE: Logo */}
      <span className="text-xl font-bold text-ink-50 cursor-pointer hover:text-brand-400 transition-colors">
        QuizForge
      </span>

      {/* RIGHT SIDE: Actions */}
      <div className="flex items-center gap-4">
        {/* PROFILE DROPDOWN */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-10 h-10 rounded-full bg-brand-500 border-2 border-surface-700 
              hover:border-brand-400 flex items-center justify-center overflow-hidden transition-all"
          >
            {/* Placeholder for Profile Image */}
            <span className="text-ink-50 text-xs font-bold">JD</span>
          </button>
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface-800 border border-surface-700 rounded-lg shadow-xl py-2 z-50">
              <button
                className="w-full text-left px-4 py-2 text-red-400 hover:bg-surface-700 transition-colors"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
