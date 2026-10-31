export function StudentQuizWarnings({
  showExitWarning,
  setShowExitWarning,
  onSubmitAndExit,
  showLogoutWarning,
  setShowLogoutWarning,
  onSubmitAndLogout,
}) {
  return (
    <>
      {showExitWarning && (
        <div className="fixed inset-0 bg-modalback/70 flex items-center justify-center z-50">
          <div className="bg-specialsurface border border-muted p-6 rounded-lg max-w-sm text-center space-y-4">
            <h2 className="text-inkondark text-lg font-semibold">Leave Quiz?</h2>
            <p className="text-inkondark text-sm">
              Your quiz will be auto-submitted if you navigate away.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowExitWarning(false)}
                className="px-4 py-2 rounded bg-surface text-inkondark border border-muted/30 hover:bg-muted/20 transition-colors"
              >
                Stay
              </button>
              <button
                onClick={onSubmitAndExit}
                className="px-4 py-2 rounded bg-accept text-inkondark hover:bg-green-600 transition-colors"
              >
                Submit &amp; Exit
              </button>
            </div>
          </div>
        </div>
      )}
      {showLogoutWarning && (
        <div className="fixed inset-0 bg-modalback/70 flex items-center justify-center z-50">
          <div className="bg-specialsurface border border-muted p-6 rounded-lg max-w-sm text-center space-y-4">
            <h2 className="text-inkondark text-lg font-semibold">Leave Quiz?</h2>
            <p className="text-inkondark text-sm">
              Your quiz will be auto-submitted if you navigate away.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowLogoutWarning(false)}
                className="px-4 py-2 rounded bg-surface text-inkondark border border-muted/30 hover:bg-muted/20 transition-colors"
              >
                Stay
              </button>
              <button
                onClick={onSubmitAndLogout}
                className="px-4 py-2 rounded bg-accept text-inkondark hover:bg-green-600 transition-colors"
              >
                Submit &amp; Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
