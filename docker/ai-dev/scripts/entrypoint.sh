#!/usr/bin/env bash
set -euo pipefail

# ── Validate required env vars ───────────────────────────────────────
for var in GITHUB_TOKEN REPO; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: $var is required" >&2
    exit 1
  fi
done

# Auth: either ANTHROPIC_API_KEY (API) or mounted ~/.claude/ (Max/Pro subscription)
if [ -z "${ANTHROPIC_API_KEY:-}" ] && [ ! -d /home/dev/.claude ]; then
  echo "ERROR: Set ANTHROPIC_API_KEY or mount ~/.claude/ for subscription auth" >&2
  exit 1
fi

# ── Ensure Claude Code skips onboarding (dark theme, already set up) ─
echo '{"theme":"dark","hasCompletedOnboarding":true}' > /home/dev/.claude.json

BRANCH="${BRANCH:-}"
TASK="${TASK:-}"
GIT_USER_NAME="${GIT_USER_NAME:-AI Developer}"
GIT_USER_EMAIL="${GIT_USER_EMAIL:-ai-dev@datagrok.ai}"
TTYD_PORT="${TTYD_PORT:-7681}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
REVIEWERS="${REVIEWERS:-}"
PR_LABELS="${PR_LABELS:-ai-generated}"

# ── Git & GitHub auth ────────────────────────────────────────────────
git config --global user.name "$GIT_USER_NAME"
git config --global user.email "$GIT_USER_EMAIL"
# gh CLI auto-uses GITHUB_TOKEN env var; just verify it works
gh auth status || { echo "ERROR: GitHub auth failed" >&2; exit 1; }

# ── Clone repo ───────────────────────────────────────────────────────
REPO_DIR="/home/dev/workspace"
echo "Cloning $REPO..."
gh repo clone "$REPO" "$REPO_DIR"
cd "$REPO_DIR"

# ── Branch setup ─────────────────────────────────────────────────────
if [ -n "$BRANCH" ]; then
  # Check if branch exists on remote
  if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
    git checkout "$BRANCH"
    git pull
  else
    git checkout -b "$BRANCH"
  fi
fi

# ── Session context for Claude Code ──────────────────────────────────
# Append session info so Claude knows the host URLs for testing
HOST_APP_PORT="${HOST_APP_PORT:-5173}"
HOST_API_PORT="${HOST_API_PORT:-3000}"
cat >> "$REPO_DIR/CLAUDE.md" << EOF

## Docker AI Dev Session
You are running inside a Docker container. When starting dev servers:
- The frontend is accessible at: http://localhost:${HOST_APP_PORT}
- The API is accessible at: http://localhost:${HOST_API_PORT}
- Always tell the user these URLs when you start a dev server.
- Run \`submit-pr\` when the task is complete to create a PR.
EOF

# ── Install dependencies ────────────────────────────────────────────
echo "Installing dependencies..."
npm install

# ── Slack notification: session started ─────────────────────────────
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  /home/dev/scripts/notify-slack.sh "started" \
    "Session started on \`${BRANCH:-main}\`${TASK:+ — Task: $TASK}"
fi

# ── Prepare Claude Code session script ───────────────────────────────
SESSION_SCRIPT="/home/dev/start-session.sh"
cat > "$SESSION_SCRIPT" << 'INNER'
#!/usr/bin/env bash
cd /home/dev/workspace

echo "============================================"
echo "  Grok-Smith AI Developer Session"
echo "============================================"
echo "  Branch: ${BRANCH:-main}"
[ -n "${TASK:-}" ] && echo "  Task:   $TASK"
echo "============================================"
echo ""

if [ -n "${TASK:-}" ]; then
  echo "Starting Claude Code with task..."
  echo "$TASK" | claude --dangerously-skip-permissions
else
  echo "Starting Claude Code (interactive)..."
  claude --dangerously-skip-permissions
fi
INNER
chmod +x "$SESSION_SCRIPT"

# ── Symlink helper commands ──────────────────────────────────────────
mkdir -p /home/dev/.local/bin
ln -sf /home/dev/scripts/submit-pr.sh /home/dev/.local/bin/submit-pr
ln -sf /home/dev/scripts/notify-slack.sh /home/dev/.local/bin/notify-slack
export PATH="/home/dev/.local/bin:$PATH"

# ── Write env file for ttyd sessions (avoids leaking secrets in logs) ─
ENV_FILE="/home/dev/.session-env"
cat > "$ENV_FILE" << EOF
export ANTHROPIC_API_KEY='${ANTHROPIC_API_KEY:-}'
export GITHUB_TOKEN='$GITHUB_TOKEN'
export BRANCH='$BRANCH'
export TASK='$TASK'
export SLACK_WEBHOOK_URL='$SLACK_WEBHOOK_URL'
export REVIEWERS='$REVIEWERS'
export PR_LABELS='$PR_LABELS'
export HOST_APP_PORT='${HOST_APP_PORT}'
export HOST_API_PORT='${HOST_API_PORT}'
export PATH='/home/dev/.local/bin:$PATH'
EOF
chmod 600 "$ENV_FILE"

# ── Launch ttyd with the session ─────────────────────────────────────
HOST_TTYD_PORT="${HOST_TTYD_PORT:-7681}"
HOST_APP_PORT="${HOST_APP_PORT:-5173}"
HOST_API_PORT="${HOST_API_PORT:-3000}"

echo ""
echo "============================================"
echo "  Session ready!"
echo "============================================"
echo "  Terminal:  http://localhost:${HOST_TTYD_PORT}"
echo "  Frontend:  http://localhost:${HOST_APP_PORT}"
echo "  API:       http://localhost:${HOST_API_PORT}"
echo "============================================"
echo ""
exec ttyd \
  --port "$TTYD_PORT" \
  --writable \
  bash -l -c "source /home/dev/.session-env && /home/dev/start-session.sh"
