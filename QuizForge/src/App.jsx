import React from "react";
import { useContext } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { AuthContext } from "./components/AuthProvider";
import QuizMakerSkeleton from "./pages/QuizMakerPage";
import LogInComponent from "./pages/Login";
import QuizzesPage from "./pages/QuizzesPage";
import StudentTokenPage from "./pages/StudentTokenPage";
import StudentQuizPage from "./pages/StudentQuizPage";
import RootDirector from "./components/RootDirector";

function ProtectedRoute ({children}){
  const { token, userInfo } = useContext(AuthContext);
  if (token && userInfo.role === 'teacher') {
    return children;
  }else{
    return <Navigate to='/login' />;
  }
}

function StudentRoute ({children}) {
  const { token, userInfo } = useContext(AuthContext);
  if(token && userInfo.role === 'student'){
    return children;
  }else{
    return <Navigate to = '/login' />;
  }
}

export default function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route path='/' element = {<RootDirector />} />

        <Route path="/teacher" element = {
          <ProtectedRoute>
            <QuizMakerSkeleton />
          </ProtectedRoute>
        } />
        <Route path="/Quizzes" element = {
          <ProtectedRoute>
            <QuizzesPage />
          </ProtectedRoute>
        } />
        <Route path='/student' element = {
          <StudentRoute>
            <StudentTokenPage />
          </StudentRoute>
        } />
        <Route path='/student/quiz/:quizToken' element = {
          <StudentRoute>
            <StudentQuizPage />
          </StudentRoute>
        } />
        <Route path="/login" element = {<LogInComponent />} />
      </Routes>
    </>
  );
}

