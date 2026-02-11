#!/usr/bin/env bash
set -euo pipefail

# ── AI Developer Session Launcher ───────────────────────────────────
# Usage:
#   ./run.sh                              # interactive, uses .env
#   ./run.sh --branch feature/foo --task "Add CSV export"
#   ./run.sh --port 7682                  # run on a different port (parallel sessions)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load .env if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Parse CLI overrides
while [[ $# -gt 0 ]]; do
  case $1 in
    --branch) BRANCH="$2"; shift 2 ;;
    --task)   TASK="$2"; shift 2 ;;
    --port)   TTYD_PORT="$2"; shift 2 ;;
    --repo)   REPO="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

export BRANCH="${BRANCH:-}"
export TASK="${TASK:-}"
export TTYD_PORT="${TTYD_PORT:-7681}"
export REPO="${REPO:-}"

# Validate
if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "ERROR: ANTHROPIC_API_KEY not set. Copy .env.example to .env and fill it in."
  exit 1
fi
if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "ERROR: GITHUB_TOKEN not set. Copy .env.example to .env and fill it in."
  exit 1
fi
if [ -z "${REPO:-}" ]; then
  echo "ERROR: REPO not set (e.g. your-org/grok-smith)"
  exit 1
fi

echo ""
echo "  Starting AI Developer Session"
echo "  ─────────────────────────────"
echo "  Repo:   $REPO"
echo "  Branch: ${BRANCH:-main}"
[ -n "$TASK" ] && echo "  Task:   $TASK"
echo "  Port:   $TTYD_PORT"
echo ""

docker compose up --build
