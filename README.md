# 🌫️ India AQI Dashboard

> **Atmospheric Clarity** — A real-time Air Quality Index dashboard for cities across India, powered by Gemini AI.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-india--aqi--dashboard.vercel.app-brightgreen?style=flat-square)](https://india-aqi-dashboard.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-94%25-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)

---

## 📌 Overview

India AQI Dashboard is a full-featured web application that visualizes air quality data across Indian cities. It combines interactive maps, charts, and AI-powered insights to help users understand pollution levels and their health implications at a glance.

---

## ✨ Features

- **Interactive Map** — Explore AQI levels city-by-city on a Leaflet-powered map of India
- **Charts & Trends** — Visualize pollution trends over time using Recharts
- **AI Insights** — Gemini AI integration for context-aware air quality summaries and health recommendations
- **News Feed** — Curated pollution-related news sourced from `news.csv`
- **Responsive UI** — Built with Tailwind CSS and smooth animations via Motion
- **CI/CD** — Automated deployments via GitHub Actions

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4 |
| Mapping | Leaflet, React-Leaflet |
| Charts | Recharts |
| AI | Google Gemini AI (`@google/genai`) |
| Build Tool | Vite 6 |
| Animations | Motion |
| Deployment | Vercel / GitHub Pages |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A [Gemini API key](https://aistudio.google.com/app/apikey)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Amol257/india-aqi-dashboard.git
cd india-aqi-dashboard

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
```

Open `.env.local` and fill in your credentials:

```env
GEMINI_API_KEY="your_gemini_api_key_here"
APP_URL="http://localhost:3000"
```

### Running Locally

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
india-aqi-dashboard/
├── .github/workflows/     # CI/CD GitHub Actions
├── public/                # Static assets
├── scratch/               # Experimental/scratch files
├── scripts/               # Data processing scripts
├── src/                   # Main application source
├── .env.example           # Environment variable template
├── index.html             # HTML entry point
├── metadata.json          # App metadata
├── news.csv               # Pollution news data
├── parse_data.js          # Data parsing utility
├── vite.config.ts         # Vite configuration
└── tsconfig.json          # TypeScript configuration
```

---

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run TypeScript type checking |
| `npm run deploy` | Deploy to GitHub Pages |
| `npm run clean` | Remove the `dist` directory |

---

## 🌐 Deployment

### Vercel (Recommended)

The live demo is hosted on Vercel. To deploy your own instance:

1. Import the repository into [Vercel](https://vercel.com)
2. Add `GEMINI_API_KEY` and `APP_URL` as environment variables in the Vercel dashboard
3. Deploy — Vercel handles the rest automatically

### GitHub Pages

```bash
npm run deploy
```

This builds the app and publishes the `dist/` directory to the `gh-pages` branch. The homepage is configured in `package.json` as `https://amol257.github.io/india-aqi-dashboard/`.

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | API key for Google Gemini AI |
| `APP_URL` | ✅ Yes | The URL where the app is hosted (used for API callbacks) |

---

## 🤝 Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please make sure `npm run lint` passes before submitting.

---

## 📄 License

This project is open-source. See the repository for details.

---

<p align="center">Made with ❤️ for cleaner air and clearer data</p>
