import { useState, useContext, useRef, useEffect } from "react";
import { Link } from 'react-router-dom';
import { AuthContext } from "./AuthProvider";

export default function SudentTopbar(){

  const [isLoading, setIsLoading] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { logout } = useContext(AuthContext);
  const menuRef = useRef(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    try{
      setIsLoading(!isLoading);
      logout();
    }
    catch(error){
      alert('Error: ' + error);
    }
    finally{
      setIsLoading(!isLoading);
    }
  };

  return (
    <div className="border-b border-gray-700 p-4 flex items-center justify-between bg-gray-900">
      {/* LEFT SIDE: Logo */}
      <Link to= '/Student' className="text-xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors">
        QuizForge
      </Link>

      {/* RIGHT SIDE: Actions */}
      <div className="flex items-center gap-4">

        {/* PROFILE DROPDOWN */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={()=>setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-10 h-10 rounded-full bg-blue-600 border-2 border-gray-700 
              hover:border-blue-400 flex items-center justify-center overflow-hidden transition-all"
          >
            {/* Placeholder for Profile Image */}
            <span className="text-white text-xs font-bold">JD</span>
          </button>
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 z-50">
              <button 
                className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 transition-colors"
                onClick={handleLogout}
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