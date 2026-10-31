import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../app/providers/AuthProvider";
import toast from "react-hot-toast";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Dropdown } from "../ui/Dropdown";

export function TeacherTopbar({ actions, logoClass = "" }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await logout();
    } catch (error) {
      toast.error(error.message || "Something went wrong while logging out");
    }
  };

  return (
    <>
      <div className="px-5 py-3 flex items-center justify-between bg-specialsurface z-40 border-b-2 border-accent/20">
        <Link
          to="/teacher"
          className={`flex items-center gap-2.5 cursor-pointer group ${logoClass}`}
        >
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center font-display font-extrabold text-inkondark text-sm"
            style={{
              background: "var(--accent)",
            }}
          >
            Q
          </div>
          <span className="font-display text-base font-bold text-inkondark group-hover:text-accent transition-colors">
            Ilmari<span className="text-accent">Gen</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 font-body ml-auto">
          {actions}

          <Dropdown>
            {({ open, toggle, close }) => (
              <>
                <button
                  onClick={toggle}
                  className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden transition-all bg-accent"
                >
                  <span className="text-inkondark text-xs font-display font-bold">
                    JD
                  </span>
                </button>
                {open && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg py-2 z-50 bg-specialsurface border-2 border-muted">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-inkondark hover:bg-mutedteal transition-colors"
                      onClick={() => {
                        navigate("/teacher/quizzes");
                        close();
                      }}
                    >
                      Quizzes
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-inkondark hover:bg-mutedteal transition-colors"
                      onClick={() => {
                        navigate("/teacher/classes");
                        close();
                      }}
                    >
                      Classes
                    </button>

                    <div className="h-px bg-muted/20 my-1"></div>

                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-mutedteal transition-colors"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            )}
          </Dropdown>
        </div>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Log out?"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
