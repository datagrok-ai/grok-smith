FROM node:20-bookworm

# ── System deps ──────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl wget jq tmux openssh-client \
    build-essential python3 \
    && rm -rf /var/lib/apt/lists/*

# ── GitHub CLI ───────────────────────────────────────────────────────
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# ── ttyd (web terminal) ─────────────────────────────────────────────
ARG TTYD_VERSION=1.7.7
RUN wget -qO /usr/local/bin/ttyd \
      "https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.$(uname -m)" \
    && chmod +x /usr/local/bin/ttyd

# ── Claude Code ──────────────────────────────────────────────────────
RUN npm install -g @anthropic-ai/claude-code

# ── Workspace setup ─────────────────────────────────────────────────
RUN useradd -m -s /bin/bash dev
USER dev
WORKDIR /home/dev

# Git config (populated at runtime from env vars)
RUN git config --global init.defaultBranch main \
    && git config --global pull.rebase false

# ── Scripts ──────────────────────────────────────────────────────────
COPY --chown=dev:dev scripts/ /home/dev/scripts/
RUN chmod +x /home/dev/scripts/*.sh

EXPOSE 7681

ENTRYPOINT ["/home/dev/scripts/entrypoint.sh"]
