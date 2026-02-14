# Datagrok App Factory

AI-developed applications for the [Datagrok](https://datagrok.ai) platform — a browser-native analytics platform for pharma and biotech.

Every app in this repo is built and maintained with [Claude Code](https://docs.anthropic.com/en/docs/claude-code), guided by structured domain docs, coding conventions, and a shared component library. The goal: ship production-quality scientific apps faster by pairing AI coding agents with well-defined guardrails.

## Apps

| App | Description | Status |
|-----|-------------|--------|
| [SEND](apps/send/) | Viewer for CDISC SEND (Standard for Exchange of Nonclinical Data) datasets. Upload XPT/CSV nonclinical study data, browse studies, subjects, and domain findings (body weights, lab results, clinical observations, etc.) in interactive grids and charts. | In development |

## Developer Tooling

### [`@datagrok/app-kit`](packages/app-kit/)

Shared component library and theme for all apps. Wraps Shadcn/ui with Datagrok-branded components (`Shell`, `View`, `DataGrid`, forms, etc.) so apps get a consistent look and feel without importing Shadcn directly.

### [`create-app`](tools/create-app/)

App scaffolding tool. Generates a new app with the standard project structure (client/server/shared), wired up to app-kit and ready for development:

```bash
npx tsx tools/create-app/index.ts <app-name>
```

### [AI Dev Environment](docker/ai-dev/)

Docker-based environment for running parallel Claude Code sessions. Each container gets its own branch, clones the repo, and exposes a web terminal (ttyd) for observing and interacting with the agent. Supports task assignment via environment variables, Slack notifications, and automatic PR creation.

```bash
# Start an AI developer session
ANTHROPIC_API_KEY=... GITHUB_TOKEN=... TASK="Add export button" \
  docker compose -f docker/ai-dev/docker-compose.yml up
```

## Project Structure

```
apps/                   # Application workspaces
  send/                 # SEND dataset viewer
    client/             #   React + Tailwind frontend
    server/             #   Hono API server
    shared/             #   Drizzle schema, Zod validation, types
    docs/               #   Domain, architecture, and status docs
packages/
  app-kit/              # Shared UI components and theme
tools/
  create-app/           # App scaffolding generator
docker/
  ai-dev/               # Dockerized Claude Code environment
docs/                   # Cross-cutting conventions
  CODING.md             #   TypeScript and project conventions
  DATABASE.md           #   Database naming and schema rules
  DESIGN.md             #   UI/UX design system
```

## Quick Start

```bash
# Install dependencies
npm install

# Start the database
npm run db:up

# Run the SEND app
npm run dev:send
```

## Conventions

All apps follow shared conventions documented in [`docs/`](docs/):

- **TypeScript** — Strict mode, no `any`, async/await, named exports
- **Database** — Drizzle ORM, UUID primary keys, audit columns on every table
- **UI** — app-kit components only, Datagrok theme tokens, no hardcoded styles
- **Validation** — Zod schemas derived from Drizzle, enforced on all API endpoints
- **Types** — `shared/schema.ts` is the single source of truth, imported by both client and server
