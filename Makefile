# ValuPro — convenience commands
# Usage: make help

.PHONY: help up down build restart logs test demo-pdf demo-memo shell-backend shell-db clean

help:
	@echo "ValuPro — Available Commands"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  make up          Start all services (docker compose up)"
	@echo "  make build       Rebuild and start all services"
	@echo "  make down        Stop all services"
	@echo "  make restart     Restart backend only"
	@echo "  make logs        Tail all logs"
	@echo "  make test        Run unit tests"
	@echo "  make demo-pdf    Download a demo valuation PDF for AAPL"
	@echo "  make demo-memo   Fetch a demo AI investment memo"
	@echo "  make shell-backend   Open a shell in the backend container"
	@echo "  make shell-db    Open a PostgreSQL shell"
	@echo "  make clean       Remove all containers and volumes"

up:
	docker compose up

build:
	docker compose up --build

down:
	docker compose down

restart:
	docker compose restart backend

logs:
	docker compose logs -f --tail=100

test:
	docker compose exec backend pytest -m unit -q

demo-pdf:
	curl -sf http://localhost:8000/api/v1/reports/AAPL/demo --output AAPL_demo.pdf
	@echo "Saved: AAPL_demo.pdf ($(shell du -h AAPL_demo.pdf | cut -f1))"

demo-memo:
	curl -sf http://localhost:8000/api/v1/memo/AAPL/demo | python3 -m json.tool

shell-backend:
	docker compose exec backend bash

shell-db:
	docker compose exec postgres psql -U valupro

clean:
	docker compose down -v --remove-orphans
	@echo "All containers and volumes removed"
