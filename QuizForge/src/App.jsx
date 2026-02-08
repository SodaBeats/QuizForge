import React from "react";
import { useContext } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./components/AuthProvider";
import QuizMakerSkeleton from "./pages/QuizMakerPage";
import LogInComponent from "./pages/Login";

function ProtectedRoute ({children}){
  const { token } = useContext(AuthContext);
  if (token) {
    return children;
  }else{
    return <Navigate to='/login' />;
  }
}

export default function App() {
  return (
      <Routes>
        <Route path="/" element = {
          <ProtectedRoute>
            <QuizMakerSkeleton />
          </ProtectedRoute>
        } />
        <Route path="/login" element = {<LogInComponent />} />
      </Routes>
  );
}

