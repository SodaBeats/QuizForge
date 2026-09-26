import React from "react";
//import { useNavigate } from "react-router-dom";

export default function ErrorPage() {
  //const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 p-4">
      <div className="max-w-md w-full bg-ink-50 shadow-lg rounded-xl border border-ink-300 p-8 text-center">
        <p className="text-6xl mb-4" aria-hidden="true">
          😵
        </p>
        <h1 className="text-3xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-ink-500 mb-6">
          We couldn't load the page. Please try again later
        </p>
        {/*<button
          type="button"
          onClick={() => navigate("/login")}
          className="inline-flex items-center justify-center px-6 py-3 bg-brand-500 text-ink-50 rounded-lg shadow-sm hover:bg-brand-600 transition"
        >
          Back to Login
        </button>*/}
      </div>
    </div>
  );
}
