import React from "react";
import { useContext } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./components/AuthProvider";
import QuizMakerSkeleton from "./pages/QuizMakerPage";
import LogInComponent from "./pages/Login";

function ProtectedRoute ({children}){
  const { token, userInfo } = useContext(AuthContext);
  if (token && userInfo.role === 'teacher') {
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

