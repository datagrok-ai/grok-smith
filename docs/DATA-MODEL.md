# Cross-App Data Model

## Core Entities (shared across apps)

### User (from Datagrok)
- id, login, display_name
- Synced to local `datagrok_users` table per DATABASE.md

### Project
- Organizational unit that groups work across apps
- Compounds, studies, inventory items all belong to projects

## App-Specific Entities

### SEND (Animal Studies)
- Study, Subject, Domain (findings domains like BW, CL, LB, MI, MA, etc.)
- See apps/send/docs/DOMAIN.md for details

### Compound Registration (future)
- Compound, Batch, Structure, Salt, Project
- Compound → has many Batches → each Batch has registration metadata

### Inventory (future)
- Container, Location, Sample
- Links to Compound/Batch from compound-reg

## Relationships
- A Study may reference Compounds (test articles)
- Inventory Containers hold Batches of Compounds
- All entities link to Projects for access control
