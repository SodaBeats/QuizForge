import React from "react";
//import { useNavigate } from "react-router-dom";

export default function ErrorPage() {
  //const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
      <div className="max-w-md w-full bg-ink rounded-md border border-muted/30 p-8 text-center">
        <p className="text-6xl mb-4" aria-hidden="true">
          😵
        </p>
        <h1 className="text-3xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-muted mb-6">
          We couldn't load the page. Please try again later
        </p>
        {/*<button
          type="button"
          onClick={() => navigate("/login")}
          className="inline-flex items-center justify-center px-6 py-3 bg-accent text-canvas rounded-lg transition"
        >
          Back to Login
        </button>*/}
      </div>
    </div>
  );
}
