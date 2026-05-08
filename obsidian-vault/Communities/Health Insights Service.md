---
title: "Health Insights Service"
community_id: 1
node_count: 6
tags:
  - community
  - graphify
---

# Health Insights Service

> [!info] Community 1
> This cluster contains **6 nodes** extracted by Graphify.

## Source Files

- [[Nodes/Health.tsx|Health.tsx]] — `src\components\views\Health.tsx`

## Functions & Abstractions

- [[Nodes/cn()|cn()]] — `src\components\views\Health.tsx` L298
- [[Nodes/detectLocationAndFetch()|detectLocationAndFetch()]] — `src\components\views\Health.tsx` L74
- [[Nodes/fetchWeatherAndCity()|fetchWeatherAndCity()]] — `src\components\views\Health.tsx` L45
- [[Nodes/getSeverityData()|getSeverityData()]] — `src\components\views\Health.tsx` L119
- [[Nodes/refreshData()|refreshData()]] — `src\components\views\Health.tsx` L101

## Internal Relationships

- ✅ [[Nodes/Health.tsx|Health.tsx]] **contains** [[Nodes/fetchWeatherAndCity()|fetchWeatherAndCity()]]
- ✅ [[Nodes/Health.tsx|Health.tsx]] **contains** [[Nodes/detectLocationAndFetch()|detectLocationAndFetch()]]
- ✅ [[Nodes/Health.tsx|Health.tsx]] **contains** [[Nodes/refreshData()|refreshData()]]
- ✅ [[Nodes/Health.tsx|Health.tsx]] **contains** [[Nodes/getSeverityData()|getSeverityData()]]
- ✅ [[Nodes/Health.tsx|Health.tsx]] **contains** [[Nodes/cn()|cn()]]
- ✅ [[Nodes/detectLocationAndFetch()|detectLocationAndFetch()]] **calls** [[Nodes/fetchWeatherAndCity()|fetchWeatherAndCity()]]
- ✅ [[Nodes/refreshData()|refreshData()]] **calls** [[Nodes/fetchWeatherAndCity()|fetchWeatherAndCity()]]
- ✅ [[Nodes/refreshData()|refreshData()]] **calls** [[Nodes/detectLocationAndFetch()|detectLocationAndFetch()]]