# Graph Report - .  (2026-04-29)

## Corpus Check
- Large corpus: 38 files · ~1,143,493 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 49 nodes · 34 edges · 3 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.75)
- Token cost: 1,000 input · 500 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Health Insights Service|Health Insights Service]]
- [[_COMMUNITY_Core Integration Layer|Core Integration Layer]]
- [[_COMMUNITY_Impact Analysis|Impact Analysis]]

## God Nodes (most connected - your core abstractions)
1. `India AQI Dashboard` - 5 edges
2. `fetchWeatherAndCity()` - 3 edges
3. `detectLocationAndFetch()` - 3 edges
4. `refreshData()` - 3 edges
5. `Respiratory Admissions Correlation` - 2 edges
6. `Google Gemini AI` - 1 edges
7. `Leaflet Map` - 1 edges
8. `Recharts Visualization` - 1 edges
9. `Heat Bulletin` - 1 edges
10. `AQI Analysis Dashboard` - 1 edges

## Surprising Connections (you probably didn't know these)
- `Heat Bulletin` --context_for--> `India AQI Dashboard`  [INFERRED]
  public/heat_bulletin.pdf → README.md
- `India AQI Dashboard` --uses--> `Google Gemini AI`  [EXTRACTED]
  README.md → src/App.tsx
- `India AQI Dashboard` --uses--> `Leaflet Map`  [EXTRACTED]
  README.md → src/components/views/Summary.tsx
- `India AQI Dashboard` --uses--> `Recharts Visualization`  [EXTRACTED]
  README.md → src/components/views/Composite.tsx
- `Respiratory Admissions Correlation` --correlated_with--> `PM2.5 Pollutant`  [INFERRED]
  public/aqi_analysis.png → README.md

## Communities

### Community 1 - "Health Insights Service"
Cohesion: 0.53
Nodes (3): detectLocationAndFetch(), fetchWeatherAndCity(), refreshData()

### Community 2 - "Core Integration Layer"
Cohesion: 0.33
Nodes (6): Google Gemini AI, Heat Bulletin, India AQI Dashboard, Leaflet Map, Pollution News Feed, Recharts Visualization

### Community 6 - "Impact Analysis"
Cohesion: 0.67
Nodes (3): AQI Analysis Dashboard, PM2.5 Pollutant, Respiratory Admissions Correlation

## Knowledge Gaps
- **7 isolated node(s):** `Google Gemini AI`, `Leaflet Map`, `Recharts Visualization`, `Heat Bulletin`, `AQI Analysis Dashboard` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `Google Gemini AI`, `Leaflet Map`, `Recharts Visualization` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._