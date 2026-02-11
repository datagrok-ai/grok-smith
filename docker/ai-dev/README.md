# AI Developer Docker

Containerized Claude Code environment for the Datagrok team. Each team member can spin up parallel sessions that clone the repo, work on a task via Claude Code in the browser, and submit PRs when done.

## Quick start

```bash
cd docker/ai-dev
cp .env.example .env
# Fill in GITHUB_TOKEN and REPO
```

### Auth

**Claude Max/Pro subscription (default):** Your `~/.claude/` is mounted into the container. If you haven't logged in yet, run `claude login` inside the container once — it persists across runs.

**API key:** Set `ANTHROPIC_API_KEY` in `.env` instead.

### Run a session

```bash
./run.sh --branch feature/csv-export --task "Add CSV export to study list"
```

Open http://localhost:7681 — Claude Code starts automatically with your task.

### Parallel sessions

```bash
./run.sh --branch feature/csv-export --task "..." --port 7681
./run.sh --branch feature/dark-mode  --task "..." --port 7682
```

## What happens inside

1. Clones the repo, checks out the branch
2. Runs `npm install`
3. Sends a Slack notification (if configured)
4. Launches a web terminal (ttyd) with Claude Code in `--dangerously-skip-permissions` mode
5. When done, run `submit-pr` to typecheck, lint, commit, push, and create a PR

## Commands available inside the container

| Command | What it does |
|---------|-------------|
| `claude` | Start/restart Claude Code |
| `submit-pr` | Run checks + create PR with auto-labels and reviewers |
| `notify-slack` | Send a Slack message manually |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub PAT with `repo` scope |
| `REPO` | Yes | GitHub org/repo (e.g. `datagrok-ai/grok-smith`) |
| `ANTHROPIC_API_KEY` | No | Only if not using Max/Pro subscription |
| `BRANCH` | No | Branch to create/checkout |
| `TASK` | No | Task description passed to Claude Code |
| `SLACK_WEBHOOK_URL` | No | Slack incoming webhook for notifications |
| `REVIEWERS` | No | Comma-separated GitHub usernames for PR review |
| `PR_LABELS` | No | PR label (default: `ai-generated`) |
| `TTYD_PORT` | No | Web terminal port (default: `7681`) |
| `GIT_USER_NAME` | No | Git author name (default: `AI Developer`) |
| `GIT_USER_EMAIL` | No | Git author email (default: `ai-dev@datagrok.ai`) |

## Files

```
docker/ai-dev/
├── Dockerfile            # Node 20, gh CLI, Claude Code, ttyd
├── docker-compose.yml    # Mounts ~/.claude/ for subscription auth
├── run.sh                # Launcher with CLI arg overrides
├── .env.example          # All config vars documented
└── scripts/
    ├── entrypoint.sh     # Clone, branch, install, launch ttyd
    ├── submit-pr.sh      # Typecheck + lint + commit + push + PR
    └── notify-slack.sh   # Slack webhook notifications
```
