# ValuPro — Complete Setup Guide

This guide covers every way to run ValuPro. Start with **Option A** (Docker) — it
requires the fewest steps and works on Mac, Windows, and Linux.

---

## What you need (minimum)

| Requirement | Version | Why |
|-------------|---------|-----|
| Docker Desktop | ≥ 24 | Runs everything in containers |
| A free FMP API key | — | Fetches live stock data |

That's it for the demo. For AI investment memos, you also need an Anthropic API key.

**Get your keys here (both have free tiers):**
- FMP: https://financialmodelingprep.com → click "Get Free API Key"
- Anthropic: https://console.anthropic.com → create account → API keys

---

## Option A — Docker (recommended, 3 steps)

### Step 1 — Install Docker Desktop

Download from https://www.docker.com/products/docker-desktop/

After installing, verify it works:
```bash
docker --version
# Should print: Docker version 24.x or higher
```

### Step 2 — Configure your API key

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/valupro.git
cd valupro

# Copy the example environment file
cp backend/.env.example backend/.env
```

Now open `backend/.env` in any text editor and add your FMP key:
```
FMP_API_KEY=your_actual_key_here        ← replace this
ANTHROPIC_API_KEY=your_key_here         ← optional, for AI memos
```

### Step 3 — Run

```bash
docker compose up --build
```

This downloads about 1 GB of images the first time (takes 5–10 minutes).
After that, subsequent starts take under 30 seconds.

**You'll know it's working when you see:**
```
backend   | INFO  valupro.ready
frontend  | ▲ Next.js 14.2.5
frontend  | Local: http://localhost:3000
```

**Open your browser:**
- Dashboard:  http://localhost:3000
- API docs:   http://localhost:8000/docs
- Health:     http://localhost:8000/health/live

### Stop the application
```bash
docker compose down          # stops containers, keeps your data
docker compose down -v       # stops containers AND deletes database
```

---

## Option B — GitHub Codespaces (zero local setup)

GitHub Codespaces runs everything in the cloud — you don't need to install anything.

1. Push this repository to GitHub
2. Click the green **Code** button → **Codespaces** tab → **Create codespace on main**
3. Wait ~3 minutes for the environment to build
4. A VS Code editor opens in your browser
5. In the terminal at the bottom:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env and add your FMP_API_KEY
   nano backend/.env
   ```
6. Run:
   ```bash
   docker compose up --build
   ```
7. Codespaces will automatically forward ports — click the link to open the frontend

---

## Option C — Local development (without Docker)

Use this if you want to modify the code and see changes instantly.

### Backend

```bash
# Requires Python 3.12 and running Postgres + Redis
# Easiest way to run Postgres + Redis: docker compose up postgres redis

cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env               # add your API keys
uvicorn main:app --reload --port 8000
```

Backend available at: http://localhost:8000

### Frontend

```bash
# Requires Node.js 18+ (https://nodejs.org)
cd frontend
npm install
cp .env.example .env.local
# The default .env.local already points to http://localhost:8000
npm run dev
```

Frontend available at: http://localhost:3000

---

## Option D — Vercel + Railway (production deployment)

This deploys the frontend to Vercel (free) and the backend to Railway (free tier).

### Deploy backend to Railway

1. Go to https://railway.app → New Project → Deploy from GitHub Repo
2. Select your `valupro` repository
3. Railway auto-detects the `backend/Dockerfile`
4. Add environment variables in Railway's dashboard:
   - `FMP_API_KEY` = your key
   - `ANTHROPIC_API_KEY` = your key
   - `API_SECRET_KEY` = a random 64-character string
   - `APP_ENV` = production
   - `CORS_ALLOWED_ORIGINS` = https://your-app.vercel.app (set after deploying frontend)
5. Railway also provides Postgres and Redis as add-ons (click **+ New** → **Database**)
6. Copy the `DATABASE_URL` and `REDIS_URL` Railway gives you into your env vars
7. Your backend URL will be something like: `https://valupro-production.up.railway.app`

### Deploy frontend to Vercel

1. Go to https://vercel.com → New Project → Import from GitHub
2. Select your `valupro` repository
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Railway backend URL (from above)
5. Click Deploy
6. Copy your Vercel URL back to Railway's `CORS_ALLOWED_ORIGINS` variable

---

## Running tests

```bash
cd backend

# Quick unit tests (no database or Redis needed)
pytest -m unit -v

# All tests (requires running postgres + redis)
# Start them first: docker compose up postgres redis -d
pytest -v

# Tests with coverage report
pytest --cov=. --cov-report=html
open htmlcov/index.html
```

---

## Generating a valuation report

### Via the API (curl)

```bash
# Generate a demo PDF report for Apple — no API key needed
curl http://localhost:8000/api/v1/reports/AAPL/demo --output AAPL_report.pdf
echo "Report saved: $(du -h AAPL_report.pdf | cut -f1)"

# Generate a live valuation (requires FMP_API_KEY)
curl -X POST http://localhost:8000/api/v1/valuation/AAPL \
  -H "Content-Type: application/json" \
  -d '{}' | python3 -m json.tool

# Run the full analysis (DCF + sensitivity + scenarios)
curl -X POST http://localhost:8000/api/v1/analysis/AAPL \
  -H "Content-Type: application/json" \
  -d '{
    "sensitivity": {"wacc_steps": 9, "growth_steps": 5},
    "build_tornado": true
  }' | python3 -m json.tool
```

### Via the dashboard

1. Open http://localhost:3000
2. Click **Company Search** in the left sidebar
3. Type a ticker (e.g. AAPL, MSFT, GOOG)
4. Click **Run Full Valuation**
5. Navigate to **Reports** → click **Download PDF**

---

## Generating an AI investment memo

```bash
# Demo memo — no API key needed (uses static data)
curl http://localhost:8000/api/v1/memo/AAPL/demo | python3 -m json.tool

# Live memo — requires ANTHROPIC_API_KEY in your .env
curl -X POST http://localhost:8000/api/v1/memo/AAPL \
  -H "Content-Type: application/json" \
  -d '{}' | python3 -m json.tool

# Stream the memo as it generates (sections appear one by one)
curl -N http://localhost:8000/api/v1/memo/AAPL/stream \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{}'
```

---

## Troubleshooting

### "Port already in use"
```bash
# Find what's using port 8000 or 3000
lsof -i :8000
lsof -i :3000
# Kill it, then retry docker compose up --build
```

### "Cannot connect to Docker daemon"
Docker Desktop isn't running. Open Docker Desktop from your Applications folder.

### "Module not found" errors in backend
```bash
docker compose down -v
docker compose up --build  # full rebuild
```

### Frontend shows blank page
```bash
docker compose logs frontend --tail=50
# Usually means npm install failed — check for error messages
```

### "Invalid API key" errors
```bash
# Verify your .env file has the key
cat backend/.env | grep FMP_API_KEY
# Should show: FMP_API_KEY=your_actual_key
# If it shows "demo" or is empty, edit the file and add your key
# After editing: docker compose restart backend
```

### Everything else
```bash
# View all logs
docker compose logs --tail=100

# View only backend logs
docker compose logs backend --tail=50

# Restart a single service
docker compose restart backend

# Full clean restart
docker compose down -v && docker compose up --build
```

---

## What each URL does

| URL | What it is |
|-----|-----------|
| `http://localhost:3000` | Frontend dashboard |
| `http://localhost:8000/docs` | Interactive API documentation |
| `http://localhost:8000/health/live` | Health check (should return `{"status":"ok"}`) |
| `http://localhost:8000/api/v1/reports/AAPL/demo` | Download demo PDF (GET) |
| `http://localhost:8000/api/v1/memo/AAPL/demo` | Get demo AI memo JSON (GET) |

---

## Environment variable reference

| Variable | Required | What it does |
|----------|----------|--------------|
| `FMP_API_KEY` | For live data | Fetches stock prices and financial statements |
| `ANTHROPIC_API_KEY` | For AI memos | Generates the 8-section investment memo |
| `API_SECRET_KEY` | In production | Signs authentication tokens |
| `DATABASE_URL` | Set by Docker | PostgreSQL connection string |
| `REDIS_URL` | Set by Docker | Redis cache connection string |
| `APP_ENV` | Optional | `development` or `production` |
| `CORS_ALLOWED_ORIGINS` | In production | Which frontends can call the API |
