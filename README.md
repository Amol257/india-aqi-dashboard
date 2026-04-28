# 🌫️ India AQI Dashboard — Atmospheric Clarity

> **National air quality dashboard with real-time health impact analysis and monitoring telemetry.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-amol257.github.io-brightgreen?style=flat-square&logo=github)](https://amol257.github.io/india-aqi-dashboard/)
[![TypeScript](https://img.shields.io/badge/TypeScript-94%25-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## 📌 Overview

**India AQI Dashboard** is a full-featured web application for visualizing and understanding air quality across India. It combines an interactive map, AI-powered health insights via Google Gemini, pollution trend charts, and a curated news feed — all in one clean, responsive interface.

🔗 **Live:** https://amol257.github.io/india-aqi-dashboard/

---

## ✨ Features

- **🗺️ Interactive Map** — Leaflet-powered map of India with city-level AQI markers and color-coded pollution zones
- **📊 Trend Charts** — Visualize historical and comparative AQI data across cities using Recharts
- **🤖 AI Health Insights** — Google Gemini AI generates contextual health recommendations based on current air quality
- **📰 Pollution News Feed** — Curated air quality news sourced from `news.csv`
- **💨 Health Impact Analysis** — Real-time analysis of AQI levels and their effects on different population groups
- **📱 Responsive Design** — Works seamlessly on desktop and mobile
- **✨ Smooth Animations** — Fluid UI transitions powered by Motion

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Mapping | Leaflet, React-Leaflet |
| Charts | Recharts |
| AI | Google Gemini AI (`@google/genai`) |
| Build Tool | Vite 6 |
| Animations | Motion |
| Icons | Lucide React |
| Deployment | GitHub Pages |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free tier available)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Amol257/india-aqi-dashboard.git
cd india-aqi-dashboard

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
GEMINI_API_KEY="your_gemini_api_key_here"
APP_URL="http://localhost:3000"
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
india-aqi-dashboard/
├── .github/workflows/        # CI/CD GitHub Actions pipelines
├── public/                   # Static assets (icons, images)
├── scratch/                  # Scratch/experimental files
├── scripts/                  # Data processing scripts
├── src/                      # Main React/TypeScript source
├── .env.example              # Environment variable template
├── index.html                # HTML entry point
├── metadata.json             # App metadata
├── news.csv                  # Pollution news dataset
├── parse_data.js             # Data parsing utility
├── fix.cjs / fix_regions.js  # Data normalization utilities
├── vite.config.ts            # Vite build configuration
└── tsconfig.json             # TypeScript configuration
```

---

## 📦 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at `localhost:3000` |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | TypeScript type-check (`tsc --noEmit`) |
| `npm run deploy` | Build and deploy to GitHub Pages |
| `npm run clean` | Remove the `dist/` directory |

---

## 🌐 Deployment

This project deploys to **GitHub Pages** using the `gh-pages` package.

```bash
npm run deploy
```

This runs `npm run build` then publishes the `dist/` folder to the `gh-pages` branch. The app is served from the `/india-aqi-dashboard/` base path as configured in `vite.config.ts`.

**Live:** https://amol257.github.io/india-aqi-dashboard/

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google Gemini AI API key — get one free at [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `APP_URL` | ✅ | URL where the app is hosted (used for API callbacks and self-referential links) |

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

Please ensure `npm run lint` passes before submitting.

---

## 📄 License

This project is open-source. See the repository for details.

---

<p align="center">Made with ❤️ for cleaner air and clearer data</p>
