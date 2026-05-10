# 🌌 Viscora Nexus

> A next-generation, AI-driven psychological companion and self-analysis tool featuring a multi-persona adaptive interface.

Viscora Nexus is the evolution of the original Viscora project ([Viscora Earlier Version](https://viscora-daily-diary.vercel.app/)). It has transformed into a highly personalized, Zettelkasten-inspired daily diary and mental state tracker. By adapting its interface, tone, and capabilities to distinct user personas (Students, Homemakers, Professionals), Nexus acts as an empathetic mentor. Built on a robust, decoupled full-stack architecture, it seamlessly integrates advanced natural language processing to connect the dots of your daily thoughts.

## ✨ Key Features

* 🤖 **Multi-Persona Adaptive AI:** The UI/UX and the AI's internal prompting dynamically shift to serve the specific needs and workflows of different user types.

* 🧠 **Zettelkasten Reflection Engine:** Log daily entries with mood mapping. The AI reads past context to generate poetic insights and 3 thematic tracking hashtags for every entry.

* 🔍 **Deep Psychological Analysis:** After accumulating a few entries, run a deep analysis to extract:

  * **SWOT Analysis:** Strengths, Weaknesses, Opportunities, and Threats.

  * **WWW & EBI:** "What Went Well" and "Even Better If".

  * **5 Whys Analysis:** Root cause drill-down of current challenges.


* 💬 **Conversational Nexus Chat:** A real-time floating chat interface with an empathetic AI mentor. Transcripts can be saved directly to the permanent memory log.

* 🔥 **Gamified Consistency Tracking:** A GitHub-style interactive heatmap grid that tracks journaling streaks and daily check-in times.

* 🎨 **HCI-Focused UI/UX:** Immersive, distraction-free environment with smooth Dark/Light mode transitions, ambient radial gradients, and elegant typography.

## 🛠️ Tech Stack & Deployment

Viscora Nexus leverages a modern, decoupled architecture for maximum scalability, deployed entirely on modern cloud infrastructure:

* **Frontend:** React + TypeScript + Tailwind CSS (Built with Vite) — 🚀 **Deployed on Vercel**

* **Backend:** Python + Django REST Framework + SimpleJWT — ☁️ **Deployed on Render**

* **Database:** PostgreSQL (Robust relational data management) — 🗄️ **Managed via Supabase**

* **AI Integration:** Google Gemini API (Leveraging strict JSON schemas and system instruction prompting)

## 📐 Architecture

The application strictly separates the frontend presentation layer from the backend business logic. The Vite/React frontend communicates asynchronously with the Django backend via secure REST APIs. Django handles JWT authentication, manages data persistence in PostgreSQL, and acts as a secure orchestrator for assembling context-aware prompts sent to the Gemini LLM.

## 🚀 Getting Started (Local Development)

### Prerequisites

* Python 3.10+

* Node.js 18+

* PostgreSQL (Local or Cloud)

* This Repository Code was made for local offline setup i.e using ollama with LLM like gemma 


## 🔗 Live Application

We invite you to experience the deployed application.

### *We kindly request you to use it for at least 3-5 days to explore the Deep Analysis and Consistency Grid properly:* [**Visit Viscora Nexus Live**](https://viscora-nexus.vercel.app/)