# Schema Map — CDISC Variable ↔ Database Column

This document maps every CDISC SEND variable name to its corresponding database column. This is the Rosetta stone for AI agents working with SEND data.

## studies (source: TS domain metadata)

| CDISC Variable | DB Column | Type | Notes |
|---------------|-----------|------|-------|
| STUDYID | `study_id` | varchar(100) | Unique study identifier |
| — | `title` | varchar(500) | From TS SSTDTL/TITLE param |
| — | `status` | enum | draft/in_progress/completed/archived |
| SPONSOR (TS param) | `sponsor` | varchar(200) | |
| SPECIES (TS param) | `species` | varchar(100) | |
| STRAIN (TS param) | `strain` | varchar(100) | |
| ROUTE (TS param) | `route` | varchar(100) | |
| TRT (TS param) | `test_article` | varchar(200) | |
| PLTEFG (TS param) | `glp_status` | varchar(50) | |
| SNDSVER (TS param) | `send_version` | varchar(20) | |

## trial_summary_parameters (source: TS domain)

| CDISC Variable | DB Column | Type | Notes |
|---------------|-----------|------|-------|
| — | `study_id` | uuid FK | References studies.id |
| TSSEQ | `seq` | integer | Sequence number |
| TSGRPID | `group_id` | varchar(50) | |
| TSPARMCD | `parameter_code` | varchar(20) | Parameter short code |
| TSPARM | `parameter` | varchar(200) | Parameter label |
| TSVAL | `value` | text | Parameter value |

## trial_arms (source: TA domain)

| CDISC Variable | DB Column | Type | Notes |
|---------------|-----------|------|-------|
| — | `study_id` | uuid FK | References studies.id |
| ARMCD | `arm_code` | varchar(20) | Arm short code |
| ARM | `arm` | varchar(200) | Arm description |
| TAETORD | `taetord` | integer | Element order within arm |
| ETCD | `etcd` | varchar(20) | Element code |
| ELEMENT | `element` | varchar(200) | Element description |
| TABRANCH | `tabranch` | varchar(200) | Branch logic |
| EPOCH | `epoch` | varchar(200) | Study epoch |

## trial_sets (source: TX domain)

| CDISC Variable | DB Column | Type | Notes |
|---------------|-----------|------|-------|
| — | `study_id` | uuid FK | References studies.id |
| SETCD | `set_code` | varchar(20) | Set short code |
| SET | `set_description` | varchar(200) | Set description |
| TXSEQ | `seq` | integer | Sequence number |
| TXPARMCD | `parameter_code` | varchar(20) | Parameter short code |
| TXPARM | `parameter` | varchar(200) | Parameter label |
| TXVAL | `value` | text | Parameter value |

## subjects (source: DM domain)

| CDISC Variable | DB Column | Type | Notes |
|---------------|-----------|------|-------|
| — | `study_id` | uuid FK | References studies.id |
| USUBJID | `usubjid` | varchar(100) | Unique subject ID (globally) |
| SUBJID | `subjid` | varchar(50) | Subject ID (within study) |
| SEX | `sex` | varchar(10) | M/F/U |
| SPECIES | `species` | varchar(100) | |
| STRAIN | `strain` | varchar(100) | |
| SBSTRAIN | `sbstrain` | varchar(100) | Sub-strain |
| ARMCD | `arm_code` | varchar(20) | Treatment group code |
| ARM | `arm` | varchar(200) | Treatment group name |
| SETCD | `set_code` | varchar(20) | Dose set code |
| RFSTDTC | `rfstdtc` | timestamp | Reference start date |
| RFENDTC | `rfendtc` | timestamp | Reference end date |
| RFICDTC | `rficdtc` | timestamp | Informed consent date |
| DTHDTC | `dthdtc` | timestamp | Date of death |
| DTHFL | `dthfl` | varchar(1) | Death flag (Y/N) |
| SITEID | `siteid` | varchar(50) | Study site |
| BRTHDTC | `brthdtc` | timestamp | Birth date |
| AGETXT | `agetxt` | varchar(20) | Age text |
| AGEU | `ageu` | varchar(20) | Age unit |

## subject_elements (source: SE domain)

| CDISC Variable | DB Column | Type | Notes |
|---------------|-----------|------|-------|
| — | `study_id` | uuid FK | References studies.id |
| USUBJID | `subject_id` | uuid FK | Resolved via lookup |
| SESEQ | `seq` | integer | Sequence number |
| ETCD | `etcd` | varchar(20) | Element code |
| ELEMENT | `element` | varchar(200) | Element description |
| SESTDTC | `sestdtc` | timestamp | Start date |
| SEENDTC | `seendtc` | timestamp | End date |
| EPOCH | `epoch` | varchar(200) | Study epoch |

## exposures (source: EX domain)

| CDISC Variable | DB Column | Type | Notes |
|---------------|-----------|------|-------|
| — | `study_id` | uuid FK | References studies.id |
| USUBJID | `subject_id` | uuid FK | Resolved via lookup |
| EXSEQ | `seq` | integer | Sequence number |
| EXTRT | `treatment` | varchar(200) | Treatment name |
| EXDOSE | `dose` | double | Dose amount |
| EXDOSU | `dose_unit` | varchar(50) | Dose unit |
| EXDOSFRM | `dose_form` | varchar(100) | Dose form |
| EXDOSFRQ | `dose_frequency` | varchar(50) | Dosing frequency |
| EXROUTE | `route` | varchar(100) | Route of administration |
| EXLOT | `lot_number` | varchar(100) | Lot number |
| EXTRTV | `vehicle` | varchar(100) | Vehicle |
| EXSTDTC | `start_date` | timestamp | Start date/time |
| EXENDTC | `end_date` | timestamp | End date/time |
| EXSTDY | `start_day` | integer | Start study day |
| EXENDY | `end_day` | integer | End study day |

## dispositions (source: DS domain)

| CDISC Variable | DB Column | Type | Notes |
|---------------|-----------|------|-------|
| — | `study_id` | uuid FK | References studies.id |
| USUBJID | `subject_id` | uuid FK | Resolved via lookup |
| DSSEQ | `seq` | integer | Sequence number |
| DSCAT | `category` | varchar(200) | Category |
| DSTERM | `term` | varchar(200) | Reported term |
| DSDECOD | `decoded_term` | varchar(200) | Decoded term |
| VISITDY | `visit_day` | integer | Planned visit day |
| DSSTDTC | `start_date` | timestamp | Start date |
| DSSTDY | `start_day` | integer | Study day |

## findings (source: BW, CL, LB, MI, MA, OM, and 10 more domains)

The `findings` table stores all 16 findings domains in a single table with a `domain` discriminator column. CDISC variable names have the domain prefix stripped (e.g., `BWTESTCD` → `testCode`, `LBORRES` → `originalResult`).

### Column Mapping (prefix stripped)

| CDISC Suffix | DB Column | Type | Example (BW domain) |
|-------------|-----------|------|---------------------|
| --SEQ | `seq` | integer | BWSEQ |
| --TESTCD | `test_code` | varchar(50) | BWTESTCD |
| --TEST | `test_name` | varchar(200) | BWTEST |
| --CAT | `category` | varchar(200) | BWCAT |
| --SCAT | `subcategory` | varchar(200) | BWSCAT |
| --ORRES | `original_result` | text | BWORRES |
| --ORRESU | `original_unit` | varchar(50) | BWORRESU |
| --STRESC | `standard_result` | varchar(200) | BWSTRESC |
| --STRESN | `standard_result_numeric` | double | BWSTRESN |
| --STRESU | `standard_unit` | varchar(50) | BWSTRESU |
| --RESCAT | `result_category` | varchar(100) | BWRESCAT |
| --STAT | `finding_status` | varchar(20) | BWSTAT |
| --REASND | `reason_not_done` | varchar(200) | BWREASND |
| --SPEC | `specimen` | varchar(100) | MISPEC |
| --ANTREG | `anatomical_region` | varchar(100) | MIANTREG |
| --LAT | `laterality` | varchar(20) | MALAT |
| --SEV | `severity` | varchar(50) | MISEV |
| --METHOD | `method` | varchar(100) | LBMETHOD |
| --BLFL | `baseline_flag` | varchar(1) | BWBLFL |
| --LOC | `location` | varchar(100) | MILOC |
| --DTHREL | `death_relation` | varchar(50) | MIDTHREL |
| --DTC | `date_collected` | timestamp | BWDTC |
| --ENDTC | `end_date` | timestamp | CWENDTC |
| --DY | `study_day` | integer | BWDY |
| --ENDY | `end_day` | integer | FWENDY |
| VISITDY | `visit_day` | integer | (same across domains) |

### Domain-specific columns → `domain_data` JSONB

Any CDISC variable that doesn't map to a dedicated column is stored in the `domain_data` JSONB field. For example:
- `MIDIR` (directionality) for MI domain
- `CLSIG` (clinical significance) for CL domain
- `FWDOSE` for FW domain

### Indexes

| Index Name | Columns | Purpose |
|-----------|---------|---------|
| `idx_findings_study_domain` | (study_id, domain) | Filter by study + domain |
| `idx_findings_subject` | (subject_id) | Join to subjects |
| `idx_findings_domain_test` | (domain, test_code) | Cross-study test lookup |
| `idx_findings_study_subject_domain` | (study_id, subject_id, domain) | Common dashboard query |

## comments (source: CO domain)

| CDISC Variable | DB Column | Type | Notes |
|---------------|-----------|------|-------|
| RDOMAIN | `related_domain` | varchar(2) | Domain this comment references |
| COSEQ | `seq` | integer | Sequence number |
| IDVAR | `id_var` | varchar(50) | Identifying variable name |
| IDVARVAL | `id_var_value` | varchar(200) | Identifying variable value |
| COVAL | `comment_value` | text | Comment text |
| CODTC | `comment_date` | timestamp | Comment date |

## supplemental_qualifiers (source: SUPP-- domains)

| CDISC Variable | DB Column | Type | Notes |
|---------------|-----------|------|-------|
| RDOMAIN | `related_domain` | varchar(2) | Domain this qualifier extends |
| IDVAR | `id_var` | varchar(50) | Identifying variable name |
| IDVARVAL | `id_var_value` | varchar(200) | Identifying variable value |
| QNAM | `qualifier_name` | varchar(50) | Qualifier variable name |
| QLABEL | `qualifier_label` | varchar(200) | Qualifier label |
| QVAL | `qualifier_value` | text | Qualifier value |
| QORIG | `origin` | varchar(50) | Origin (CRF, Assigned, etc.) |
| QEVAL | `evaluator` | varchar(200) | Evaluator |

## related_records (source: RELREC domain)

| CDISC Variable | DB Column | Type | Notes |
|---------------|-----------|------|-------|
| RDOMAIN | `related_domain` | varchar(2) | Related domain |
| IDVAR | `id_var` | varchar(50) | Identifying variable name |
| IDVARVAL | `id_var_value` | varchar(200) | Identifying variable value |
| RELTYPE | `relation_type` | varchar(50) | Relationship type |
| RELID | `relation_id` | varchar(50) | Relationship identifier |

## Common Columns (all tables)

| DB Column | Type | Notes |
|-----------|------|-------|
| `id` | uuid PK | Auto-generated UUID |
| `created_at` | timestamp | Auto-set on insert |
| `updated_at` | timestamp | Auto-set on insert and update |
| `created_by` | uuid | User who created the record |
