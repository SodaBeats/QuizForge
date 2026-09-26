# QuizForge: AI-Driven Quiz Generation and Assessment Platform

> Creating exams, grading open-ended responses, and tracking student analytics manually is time-consuming and tedious. QuizForge eliminates this administrative bottleneck by leveraging AI to automatically generate questions from uploaded documents, grade complex written answers, and track student performance with tailored learning recommendations.

---

## Features

### Teacher Features

- Upload documents and ingested by embedding pipeline to be used for RAG.
- Quickly make quizzes/exams by providing metadata before generating questions, such as which documents to use as sources for the AI question generation using RAG (Optionally, able to generate questions without sources).
- Quickly generate questions based on the given topic.
- Able to limit exam access to certain groups/class.
- `QuizResultDashboard` provides a dashboard for viewing quiz-wide result.
- Automatic grading of student attempts with AI-driven assessment of open-ended question types (short-answer or essay).
- Automatic AI-driven comments about questions that the student got wrong.
- AI generates a summary of student's attempt performance such as strenghts and weaknesses, and recommends actionable learning paths based on inferred data.

### Student Features

- Access teacher exams using exam's designated token.
- Behavioral safeguards such as anti-copy-paste measure, per-question timer, and navigation prevention to encourage honest exam attempts.

---

## Upcoming Features

- **Interactive Dashboard:** Enables educators to drill down into individual student attempts per question to view raw answers, AI-generated grades, and feedback comments.

---

## Tech Stack

- **Frontend:** React, Tailwind CSS, Tanstack Query
- **Backend:** Node.js, Express, PostgreSQL, Drizzle ORM
- **Database:** Neon Postgres (with `pgvector` extension)
- **Testing & CI:** Jest, GitHub Actions, Docker
- **Authentication:** JWT

---

## Getting Started

### Prerequisites

Ensure you have the following installed locally:

- Node.js (v20+)
- Docker (for local database containers)
- Redis (Local or Cloud)
