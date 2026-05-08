---
title: "Core Integration Layer"
community_id: 2
node_count: 6
tags:
  - community
  - graphify
---

# Core Integration Layer

> [!info] Community 2
> This cluster contains **6 nodes** extracted by Graphify.

## Source Files

- [[Nodes/Google Gemini AI|Google Gemini AI]] — `src/App.tsx`
- [[Nodes/Heat Bulletin|Heat Bulletin]] — `public/heat_bulletin.pdf`
- [[Nodes/India AQI Dashboard|India AQI Dashboard]] — `README.md`
- [[Nodes/Leaflet Map|Leaflet Map]] — `src/components/views/Summary.tsx`
- [[Nodes/Pollution News Feed|Pollution News Feed]] — `news.csv`
- [[Nodes/Recharts Visualization|Recharts Visualization]] — `src/components/views/Composite.tsx`

## Internal Relationships

- ✅ [[Nodes/India AQI Dashboard|India AQI Dashboard]] **uses** [[Nodes/Google Gemini AI|Google Gemini AI]]
- ✅ [[Nodes/India AQI Dashboard|India AQI Dashboard]] **uses** [[Nodes/Leaflet Map|Leaflet Map]]
- ✅ [[Nodes/India AQI Dashboard|India AQI Dashboard]] **uses** [[Nodes/Recharts Visualization|Recharts Visualization]]
- ✅ [[Nodes/India AQI Dashboard|India AQI Dashboard]] **displays** [[Nodes/Pollution News Feed|Pollution News Feed]]
- 🔮 [[Nodes/Heat Bulletin|Heat Bulletin]] **context_for** [[Nodes/India AQI Dashboard|India AQI Dashboard]]