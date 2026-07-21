#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ ! -f "$ROOT_DIR/.env" ]]; then
  echo "Missing .env. Copy .env.example and configure it first." >&2
  exit 1
fi
BACKEND_PORT="${BACKEND_PORT:-3051}"
FRONTEND_PORT="${FRONTEND_PORT:-3050}"
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-http://127.0.0.1:$FRONTEND_PORT,http://localhost:$FRONTEND_PORT}"
export BACKEND_PORT FRONTEND_PORT ALLOWED_ORIGINS
if [[ ! -d "$ROOT_DIR/backend/node_modules" || ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
  echo "Dependencies are missing. Run npm ci separately in backend and frontend." >&2
  exit 1
fi
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already in use; refusing to terminate another process." >&2
    exit 1
  fi
done

(cd "$ROOT_DIR/backend" && npm start) & backend_pid=$!
(cd "$ROOT_DIR/frontend" && BROWSER=none PORT="$FRONTEND_PORT" REACT_APP_API_BASE="http://127.0.0.1:$BACKEND_PORT/api" npm start) & frontend_pid=$!
cleanup() {
  kill "$backend_pid" "$frontend_pid" 2>/dev/null || true
  wait "$backend_pid" "$frontend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
wait "$backend_pid" "$frontend_pid"
