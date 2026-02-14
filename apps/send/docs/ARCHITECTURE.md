# SEND App Architecture

## Stack
- Client: React + Tailwind + app-kit components
- Server: Hono API on port 3000
- Database: PostgreSQL, schema `send`
- Local dev: Vite dev server proxies /api to Hono

## Data Flow
1. User uploads SEND dataset (XPT or CSV)
2. Server parses and validates against SEND controlled terminology
3. Data stored in normalized tables: studies, subjects, domain_data
4. Client fetches via REST API, displays in grids and charts

## API Design (planned)
- GET /api/studies — list studies with filtering
- GET /api/studies/:id — study detail with subject count
- POST /api/studies/upload — upload SEND dataset
- GET /api/studies/:id/subjects — subjects in a study
- GET /api/studies/:id/domains/:domain — domain data (e.g., BW records)

## Integration Points
- Datagrok: embedded as panel, can push data to Datagrok dataframes for visualization
- app-kit: provides Shell, View, DataGrid, theme, auth context
