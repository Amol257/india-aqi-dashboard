# Daily AQI Data Pipeline – Setup Guide

## How it works

```
GitHub Actions (cron: daily 06:30 IST)
        │
        ▼
scripts/fetch_aqi_data.py
  ├── Paginates data.gov.in API  (all pollutants, all stations)
  ├── Cleans & aggregates by city
  └── Writes public/data/local_aqi.json
        │
        ▼
git commit & push  (only if data changed)
        │
        ▼
npm run build  →  Deploy to GitHub Pages
```

---

## One-time setup

### 1. Add your API key as a GitHub Secret

1. Go to your repo → **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `DATA_GOV_API_KEY`
4. Value: your data.gov.in API key

> The public demo key is used as a fallback, but it has rate limits.  
> Get a free personal key at https://data.gov.in/user/register

### 2. Enable GitHub Pages

1. Go to **Settings → Pages**
2. Set **Source** to `GitHub Actions`

### 3. Replace the old deploy workflow

Delete (or rename) `.github/workflows/deploy.yml` and use the new
`.github/workflows/daily_refresh.yml` instead — it combines the data
refresh step with the build+deploy step.

---

## Running locally

```bash
# Install Python deps (one-time)
pip install requests python-dotenv

# Optional: create a .env file with your key
echo 'DATA_GOV_API_KEY=your_key_here' > .env

# Fetch fresh data
python scripts/fetch_aqi_data.py

# Start the dev server
npm run dev
```

---

## Script: `scripts/fetch_aqi_data.py`

| Feature | Details |
|---|---|
| Pagination | Fetches all records in batches of 500 |
| Retry logic | 3 retries with exponential back-off per page |
| Data cleaning | Drops zero / NA pollutant values |
| Aggregation | Per-city avg/peak AQI, per-pollutant averages across stations |
| Tier detection | Tier 1, Tier 2, Industrial (matches original logic) |
| Safety | Aborts without overwriting if API returns 0 records |

---

## Schedule

The workflow runs at **01:00 UTC (06:30 IST) every day**.  
Edit the `cron` line in `.github/workflows/daily_refresh.yml` to change the time:

```yaml
- cron: "0 1 * * *"   # 01:00 UTC = 06:30 IST
```

You can also trigger it manually from the **Actions** tab → **Daily AQI Data Refresh + Deploy** → **Run workflow**.
