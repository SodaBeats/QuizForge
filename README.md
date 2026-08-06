# QuizForge: AI-Driven Quiz Generation and Assessment Platform

> Creating exams, grading open-ended responses, and tracking student analytics manually is time-consuming and tedious. QuizForge eliminates this administrative bottleneck by leveraging AI to automatically generate quizzes from uploaded documents, grade complex written answers, and track student performance with tailored learning recommendations.

---

## Features

- **Document Ingestion & RAG Pipeline:** Uses uploaded documents as a context-aware knowledge base for question generation, ensuring accurate context and mitigating AI hallucinations.
- **Automated Grading & Learning Recommendations:** Automatically evaluates student attempts through an AI grading pipeline. Synthesizes attempt summaries to identify student strengths, areas for improvement, and actionable study recommendations.
- **Quiz Result Dashboard:** Displays individual and class ranking, identifies questions with highest/lowest correctenss rate, and visualize overall attempt score distribution.

---

## Upcoming Features

- **Interactive Dashboard:** Enables educators to drill down into individual student attempts per question to view raw answers, AI-generated grades, and feedback comments.

---

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Tanstack Query
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
