#!/usr/bin/env bash
# dev.sh — start backend (localhost:3000) and frontend (localhost:5173) together.
# Ctrl+C stops both.
set -euo pipefail
cd "$(dirname "$0")"

# The server throws at boot without this; a placeholder is fine unless you're
# testing LLM endpoints (ingest/query). Export the real key to use it.
export OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-placeholder}"

cleanup() { kill $(jobs -p) 2>/dev/null || true; }
trap cleanup EXIT

(cd server && npm run start:dev) &
(cd client && npm run dev) &

wait
