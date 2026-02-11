#!/usr/bin/env bash
set -euo pipefail

EVENT="${1:-info}"
MESSAGE="${2:-}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

if [ -z "$SLACK_WEBHOOK_URL" ]; then
  echo "(Slack not configured, skipping notification)"
  exit 0
fi

BRANCH="${BRANCH:-$(git branch --show-current 2>/dev/null || echo 'unknown')}"
REPO="${REPO:-$(basename "$(git remote get-url origin 2>/dev/null)" .git || echo 'unknown')}"

case "$EVENT" in
  started)
    EMOJI=":rocket:"
    COLOR="#36a64f"
    TITLE="AI Dev Session Started"
    ;;
  pr-created)
    EMOJI=":white_check_mark:"
    COLOR="#2eb886"
    TITLE="PR Created"
    ;;
  error)
    EMOJI=":x:"
    COLOR="#dc3545"
    TITLE="Session Error"
    ;;
  *)
    EMOJI=":information_source:"
    COLOR="#439FE0"
    TITLE="AI Dev Update"
    ;;
esac

PAYLOAD=$(jq -n \
  --arg emoji "$EMOJI" \
  --arg color "$COLOR" \
  --arg title "$TITLE" \
  --arg message "$MESSAGE" \
  --arg repo "$REPO" \
  --arg branch "$BRANCH" \
  '{
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ($emoji + " *" + $title + "*\nRepo: `" + $repo + "` | Branch: `" + $branch + "`\n" + $message)
        }
      }
    ]
  }')

curl -s -X POST "$SLACK_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" > /dev/null

echo "Slack notification sent: $TITLE"
