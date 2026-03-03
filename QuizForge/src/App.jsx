import React from "react";
import { useContext } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { AuthContext } from "./components/AuthProvider";
import QuizMakerSkeleton from "./pages/QuizMakerPage";
import LogInComponent from "./pages/Login";
import QuizzesPage from "./pages/QuizzesPage";

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
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element = {
          <ProtectedRoute>
            <QuizMakerSkeleton />
          </ProtectedRoute>
        } />
        <Route path="/Quizzes" element = {
          <ProtectedRoute>
            <QuizzesPage />
          </ProtectedRoute>
        } />
        <Route path="/login" element = {<LogInComponent />} />
      </Routes>
    </>
  );
}

