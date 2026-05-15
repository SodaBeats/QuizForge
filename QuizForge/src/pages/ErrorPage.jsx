import React from "react";
import { useNavigate } from "react-router-dom";

export default function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-6xl mb-4" aria-hidden="true">😵</p>
        <h1 className="text-3xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-slate-600 mb-6">
          We couldn't load the page. Please try again or return to the login screen.
        </p>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
