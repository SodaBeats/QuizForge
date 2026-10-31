import { Dropdown } from "../../../components/ui/Dropdown";

export function StudentTopbar({ onLogout }) {
  return (
    <div className="border-b-2 border-accent/20 p-4 flex items-center justify-between bg-specialsurface">
      {/* LEFT SIDE: Logo */}
      <span className="text-xl font-bold text-inkondark cursor-pointer hover:text-inkondark/80 transition-colors">
        QuizForge
      </span>

      {/* RIGHT SIDE: Actions */}
      <div className="flex items-center gap-4">
        {/* PROFILE DROPDOWN */}
        <Dropdown>
          {({ open, toggle }) => (
            <>
              <button
                onClick={toggle}
                className="w-10 h-10 rounded-full bg-accent border-2 border-muted/20 hover:border-accent flex items-center justify-center overflow-hidden transition-all"
              >
                {/* Placeholder for Profile Image */}
                <span className="text-inkondark text-xs font-bold">JD</span>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-muted/20 rounded-lg py-2 z-50">
                  <button
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-muted/10 transition-colors"
                    onClick={onLogout}
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
  );
}
