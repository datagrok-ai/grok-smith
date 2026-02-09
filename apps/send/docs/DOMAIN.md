# SEND Domain Model

## Core Concepts

### Study
A nonclinical study evaluating a test article. Identified by STUDYID.
Has: title, sponsor, study director, start/end dates, GLP status.

### Subject
An individual animal in a study. Identified by USUBJID (unique subject ID).
Has: species, strain, sex, group assignment, dose level.

### Domain
A category of collected data. Each domain is a separate dataset in SEND.
Key domains:
- DM (Demographics) — subject-level data
- EX (Exposure) — dosing records
- BW (Body Weights) — periodic weight measurements
- CL (Clinical Observations) — clinical signs
- LB (Laboratory Results) — hematology, clinical chemistry
- MI (Microscopic Findings) — histopathology
- MA (Macroscopic Findings) — gross pathology
- OM (Organ Measurements) — organ weights
- FW (Food/Water Consumption)

### Finding
A single observation or measurement within a domain. Has: test/parameter,
result value, unit, timepoint, specimen, method.

## Database Design: Unified Findings Table

All 16 findings domains (BW, BG, CL, DD, EG, FW, LB, MA, MI, OM, PC, PM, PP, SC, TF, VS) are stored in a **single `findings` table** with a `domain` column as discriminator.

**Why not 16 separate tables?** These domains share ~20 common columns (test_code, test_name, result, unit, specimen, etc.) with only 0–5 domain-specific extras. A unified table:
- Simplifies cross-domain queries (e.g., "all findings for subject X")
- Avoids 16 near-identical table definitions and 16 sets of API endpoints
- Makes adding new domains trivial (just a new domain code, no migration)

**Domain-specific fields** that don't have a dedicated column are stored in the `domain_data` JSONB column. For example, MI domain's `MIDIR` (directionality) goes into `domain_data.MIDIR`.

See `docs/SCHEMA-MAP.md` for the complete CDISC variable → database column mapping.

### Domain Categories

| Category | Domains | Storage |
|----------|---------|---------|
| Findings | BW, BG, CL, DD, EG, FW, LB, MA, MI, OM, PC, PM, PP, SC, TF, VS | `findings` table |
| Trial Design | TA, TE, TS, TX | `trial_arms`, `trial_summary_parameters`, `trial_sets` |
| Special Purpose | DM, EX, DS, SE, CO | `subjects`, `exposures`, `dispositions`, `subject_elements`, `comments` |

## Business Rules
- BR-001: Every subject must belong to exactly one study
- BR-002: USUBJID must be unique within a study
- BR-003: Domain data must conform to CDISC SEND controlled terminology
- BR-004: Body weight values must be positive numbers
- BR-005: Study dates must be consistent (start <= end)
