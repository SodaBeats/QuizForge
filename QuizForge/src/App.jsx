import React from "react";
import { Routes, Route } from "react-router-dom";
import QuizMakerSkeleton from "./pages/QuizMakerPage";
import LogInComponent from "./pages/Login";



export default function App() {
  return (
      <Routes>
        <Route path="/" element = {<QuizMakerSkeleton />} />
        <Route path="/login" element = {<LogInComponent />} />
      </Routes>
  );
}
