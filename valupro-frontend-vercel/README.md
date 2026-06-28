# ValuPro — Frontend

Institutional equity valuation dashboard built with Next.js 14, TypeScript, and Tailwind CSS.

**Live demo:** [valupro.vercel.app](https://valupro.vercel.app) *(update this after deployment)*

---

## Deploy to Vercel (one click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR-USERNAME/valupro-frontend)

**Steps:**
1. Click the button above (or import this repo at [vercel.com/new](https://vercel.com/new))
2. Leave **Root Directory** as `/` (this repo *is* the frontend — no subdirectory)
3. Add environment variable (optional):
   - `NEXT_PUBLIC_API_URL` = your backend URL (e.g. `https://valupro-api.up.railway.app`)
4. Click **Deploy**

The frontend works without a backend — all pages display professional demo data.

---

## Local development

```bash
git clone https://github.com/YOUR-USERNAME/valupro-frontend.git
cd valupro-frontend

npm install

# Optional: connect to a running backend
cp .env.example .env.local
# Edit .env.local → add NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
# → http://localhost:3000
```

---

## Features

- **Dashboard** — KPI grid, recent valuations table, football field chart
- **Company Search** — live search with sector/industry filtering
- **Valuation** — DCF assumptions panel + football field + Bear/Base/Bull scenarios
- **DCF Analysis** — 10-year PV schedule, waterfall chart, terminal value audit
- **Comparables** — peer table with IQR-cleaned multiples, implied price ranges
- **Sensitivity** — WACC×g heatmap, tornado chart, scenario comparison
- **Reports** — report library with PDF download

---

## Stack

Next.js 14 · TypeScript · Tailwind CSS · Recharts · Radix UI · Lucide Icons

---

## Backend

The full backend (FastAPI, Python) is in a separate repository.  
Connect it by setting `NEXT_PUBLIC_API_URL` in your Vercel environment variables.
