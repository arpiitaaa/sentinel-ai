# Sentinel-AI: Market Intelligence & Quantitative Analysis Agent

**Sentinel-AI** is an autonomous multi-agent system designed to automate the end-to-end workflow of a financial data analyst. By orchestrating specialized AI agents, it transforms raw market data into structured, actionable investment intelligence.

## 📊 Data Analysis & Quantitative Focus
This project demonstrates advanced data analyst competencies by automating complex analytical tasks:

*   **Quantitative Modeling**: Automated calculation of key technical indicators including **RSI (Relative Strength Index)**, **50/200-day Moving Averages**, and **Beta (Market Risk)**.
*   **NLP Sentiment Analysis**: Real-time processing of financial news streams to perform sentiment scoring and bias detection across multiple intelligence sources.
*   **Risk Assessment**: Dynamic modeling of volatility scores and P/E ratios to evaluate investment safety and market positioning.
*   **Agentic Data Synthesis**: Implementation of a "Master Orchestrator" pattern that simulates a team of analysts (Researcher, Analyst, Quant, Editor) to ensure data integrity and multi-perspective validation.

## 🤖 The Agentic Workflow
The system uses a sophisticated agentic logic to "think" through market problems:
1.  **The Researcher**: Gathers live price data and news via Google Search grounding.
2.  **The Analyst**: Critically reviews news for bias and identifies emerging market trends.
3.  **The Quant**: Performs mathematical modeling of technical indicators and financial health.
4.  **The Editor**: Synthesizes all findings into a professional-grade investment brief.

## 🛠️ Tech Stack
*   **Language**: TypeScript / React 18
*   **AI Engine**: Google Gemini API (with Google Search Grounding)
*   **Visualization**: Recharts (Time-series & Sentiment Gauges)
*   **Styling**: Tailwind CSS v4
*   **Animation**: Framer Motion

## 🚀 Deployment & Usage
1.  **Clone the repo**: `git clone https://github.com/your-username/sentinel-ai.git`
2.  **Install dependencies**: `npm install`
3.  **Set Environment Variables**: Create a `.env` file and add your `GEMINI_API_KEY`.
4.  **Run the app**: `npm run dev`

---
*Developed as a showcase of AI Product Development and Automated Data Analysis.*