import {
  pgSchema,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  integer,
  doublePrecision,
  jsonb,
  index,
  unique,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

import type { z } from 'zod'

import { STUDY_STATUS } from './constants'

// ---------------------------------------------------------------------------
// Schema & Enums
// ---------------------------------------------------------------------------

export const sendSchema = pgSchema('send')

export const studyStatusEnum = pgEnum('study_status', STUDY_STATUS)

/** System user UUID used for seed data and automated imports */
export const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000'

// ---------------------------------------------------------------------------
// studies — one row per nonclinical study (source: TS domain metadata)
// ---------------------------------------------------------------------------

export const studies = sendSchema.table('studies', {
  id: uuid('id').primaryKey().defaultRandom(),
  studyId: varchar('study_id', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  status: studyStatusEnum('status').notNull().default('draft'),
  sponsor: varchar('sponsor', { length: 200 }),
  studyDirector: varchar('study_director', { length: 200 }),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  species: varchar('species', { length: 100 }),
  strain: varchar('strain', { length: 100 }),
  route: varchar('route', { length: 100 }),
  testArticle: varchar('test_article', { length: 200 }),
  glpStatus: varchar('glp_status', { length: 50 }),
  sendVersion: varchar('send_version', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: uuid('created_by').notNull(),
})

// ---------------------------------------------------------------------------
// trial_summary_parameters — key/value pairs from TS domain
// ---------------------------------------------------------------------------

export const trialSummaryParameters = sendSchema.table('trial_summary_parameters', {
  id: uuid('id').primaryKey().defaultRandom(),
  studyId: uuid('study_id')
    .notNull()
    .references(() => studies.id),
  seq: integer('seq').notNull(),
  groupId: varchar('group_id', { length: 50 }),
  parameterCode: varchar('parameter_code', { length: 20 }).notNull(),
  parameter: varchar('parameter', { length: 200 }).notNull(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: uuid('created_by').notNull(),
})

// ---------------------------------------------------------------------------
// trial_arms — treatment/control group definitions (TA domain)
// ---------------------------------------------------------------------------

export const trialArms = sendSchema.table(
  'trial_arms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studyId: uuid('study_id')
      .notNull()
      .references(() => studies.id),
    armCode: varchar('arm_code', { length: 20 }).notNull(),
    arm: varchar('arm', { length: 200 }).notNull(),
    taetord: integer('taetord'),
    etcd: varchar('etcd', { length: 20 }),
    element: varchar('element', { length: 200 }),
    tabranch: varchar('tabranch', { length: 200 }),
    epoch: varchar('epoch', { length: 200 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: uuid('created_by').notNull(),
  },
  (table) => ({
    uqTrialArmsStudyArm: unique('uq_trial_arms_study_arm').on(table.studyId, table.armCode, table.taetord),
  }),
)

// ---------------------------------------------------------------------------
// trial_sets — dose groups (TX domain)
// ---------------------------------------------------------------------------

export const trialSets = sendSchema.table(
  'trial_sets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studyId: uuid('study_id')
      .notNull()
      .references(() => studies.id),
    setCode: varchar('set_code', { length: 20 }).notNull(),
    setDescription: varchar('set_description', { length: 200 }).notNull(),
    seq: integer('seq'),
    parameterCode: varchar('parameter_code', { length: 20 }),
    parameter: varchar('parameter', { length: 200 }),
    value: text('value'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: uuid('created_by').notNull(),
  },
  (table) => ({
    uqTrialSetsStudySetSeq: unique('uq_trial_sets_study_set_seq').on(table.studyId, table.setCode, table.seq),
  }),
)

// ---------------------------------------------------------------------------
// subjects — individual animals (DM domain)
// ---------------------------------------------------------------------------

export const subjects = sendSchema.table(
  'subjects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studyId: uuid('study_id')
      .notNull()
      .references(() => studies.id),
    usubjid: varchar('usubjid', { length: 100 }).notNull(),
    subjid: varchar('subjid', { length: 50 }).notNull(),
    sex: varchar('sex', { length: 10 }).notNull(),
    species: varchar('species', { length: 100 }),
    strain: varchar('strain', { length: 100 }),
    sbstrain: varchar('sbstrain', { length: 100 }),
    armCode: varchar('arm_code', { length: 20 }),
    arm: varchar('arm', { length: 200 }),
    setCode: varchar('set_code', { length: 20 }),
    rfstdtc: timestamp('rfstdtc', { withTimezone: true }),
    rfendtc: timestamp('rfendtc', { withTimezone: true }),
    rficdtc: timestamp('rficdtc', { withTimezone: true }),
    dthdtc: timestamp('dthdtc', { withTimezone: true }),
    dthfl: varchar('dthfl', { length: 1 }),
    siteid: varchar('siteid', { length: 50 }),
    brthdtc: timestamp('brthdtc', { withTimezone: true }),
    agetxt: varchar('agetxt', { length: 20 }),
    ageu: varchar('ageu', { length: 20 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: uuid('created_by').notNull(),
  },
  (table) => ({
    uqSubjectsStudyUsubjid: unique('uq_subjects_study_usubjid').on(table.studyId, table.usubjid),
    idxSubjectsStudyId: index('idx_subjects_study_id').on(table.studyId),
  }),
)

// ---------------------------------------------------------------------------
// subject_elements — epoch/element assignments per subject (SE domain)
// ---------------------------------------------------------------------------

export const subjectElements = sendSchema.table('subject_elements', {
  id: uuid('id').primaryKey().defaultRandom(),
  studyId: uuid('study_id')
    .notNull()
    .references(() => studies.id),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => subjects.id),
  seq: integer('seq').notNull(),
  etcd: varchar('etcd', { length: 20 }),
  element: varchar('element', { length: 200 }),
  sestdtc: timestamp('sestdtc', { withTimezone: true }),
  seendtc: timestamp('seendtc', { withTimezone: true }),
  epoch: varchar('epoch', { length: 200 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: uuid('created_by').notNull(),
})

// ---------------------------------------------------------------------------
// exposures — dosing records (EX domain)
// ---------------------------------------------------------------------------

export const exposures = sendSchema.table('exposures', {
  id: uuid('id').primaryKey().defaultRandom(),
  studyId: uuid('study_id')
    .notNull()
    .references(() => studies.id),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => subjects.id),
  seq: integer('seq').notNull(),
  treatment: varchar('treatment', { length: 200 }).notNull(),
  dose: doublePrecision('dose'),
  doseUnit: varchar('dose_unit', { length: 50 }),
  doseForm: varchar('dose_form', { length: 100 }),
  doseFrequency: varchar('dose_frequency', { length: 50 }),
  route: varchar('route', { length: 100 }),
  lotNumber: varchar('lot_number', { length: 100 }),
  vehicle: varchar('vehicle', { length: 100 }),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  startDay: integer('start_day'),
  endDay: integer('end_day'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: uuid('created_by').notNull(),
})

// ---------------------------------------------------------------------------
// dispositions — subject disposition events (DS domain)
// ---------------------------------------------------------------------------

export const dispositions = sendSchema.table('dispositions', {
  id: uuid('id').primaryKey().defaultRandom(),
  studyId: uuid('study_id')
    .notNull()
    .references(() => studies.id),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => subjects.id),
  seq: integer('seq').notNull(),
  category: varchar('category', { length: 200 }),
  term: varchar('term', { length: 200 }).notNull(),
  decodedTerm: varchar('decoded_term', { length: 200 }),
  visitDay: integer('visit_day'),
  startDate: timestamp('start_date', { withTimezone: true }),
  startDay: integer('start_day'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: uuid('created_by').notNull(),
})

// ---------------------------------------------------------------------------
// findings — unified table for all findings domains
// (BW, BG, CL, DD, EG, FW, LB, MA, MI, OM, PC, PM, PP, SC, TF, VS)
// ---------------------------------------------------------------------------

export const findings = sendSchema.table(
  'findings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studyId: uuid('study_id')
      .notNull()
      .references(() => studies.id),
    subjectId: uuid('subject_id').references(() => subjects.id),
    domain: varchar('domain', { length: 2 }).notNull(),
    seq: integer('seq').notNull(),
    testCode: varchar('test_code', { length: 50 }).notNull(),
    testName: varchar('test_name', { length: 200 }).notNull(),
    category: varchar('category', { length: 200 }),
    subcategory: varchar('subcategory', { length: 200 }),
    originalResult: text('original_result'),
    originalUnit: varchar('original_unit', { length: 50 }),
    standardResult: varchar('standard_result', { length: 200 }),
    standardResultNumeric: doublePrecision('standard_result_numeric'),
    standardUnit: varchar('standard_unit', { length: 50 }),
    resultCategory: varchar('result_category', { length: 100 }),
    findingStatus: varchar('finding_status', { length: 20 }),
    reasonNotDone: varchar('reason_not_done', { length: 200 }),
    specimen: varchar('specimen', { length: 100 }),
    anatomicalRegion: varchar('anatomical_region', { length: 100 }),
    laterality: varchar('laterality', { length: 20 }),
    severity: varchar('severity', { length: 50 }),
    method: varchar('method', { length: 100 }),
    baselineFlag: varchar('baseline_flag', { length: 1 }),
    location: varchar('location', { length: 100 }),
    deathRelation: varchar('death_relation', { length: 50 }),
    visitDay: integer('visit_day'),
    dateCollected: timestamp('date_collected', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    studyDay: integer('study_day'),
    endDay: integer('end_day'),
    /** Domain-specific columns that don't have a dedicated field */
    domainData: jsonb('domain_data'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: uuid('created_by').notNull(),
  },
  (table) => ({
    idxFindingsStudyDomain: index('idx_findings_study_domain').on(table.studyId, table.domain),
    idxFindingsSubject: index('idx_findings_subject').on(table.subjectId),
    idxFindingsDomainTest: index('idx_findings_domain_test').on(table.domain, table.testCode),
    idxFindingsStudySubjectDomain: index('idx_findings_study_subject_domain').on(table.studyId, table.subjectId, table.domain),
  }),
)

// ---------------------------------------------------------------------------
// comments — cross-domain comments (CO domain)
// ---------------------------------------------------------------------------

export const comments = sendSchema.table('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  studyId: uuid('study_id')
    .notNull()
    .references(() => studies.id),
  subjectId: uuid('subject_id').references(() => subjects.id),
  relatedDomain: varchar('related_domain', { length: 2 }),
  seq: integer('seq').notNull(),
  idVar: varchar('id_var', { length: 50 }),
  idVarValue: varchar('id_var_value', { length: 200 }),
  commentValue: text('comment_value').notNull(),
  commentDate: timestamp('comment_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: uuid('created_by').notNull(),
})

// ---------------------------------------------------------------------------
// supplemental_qualifiers — SUPP-- domains (SUPPMA, SUPPMI, etc.)
// ---------------------------------------------------------------------------

export const supplementalQualifiers = sendSchema.table('supplemental_qualifiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  studyId: uuid('study_id')
    .notNull()
    .references(() => studies.id),
  subjectId: uuid('subject_id').references(() => subjects.id),
  relatedDomain: varchar('related_domain', { length: 2 }).notNull(),
  idVar: varchar('id_var', { length: 50 }),
  idVarValue: varchar('id_var_value', { length: 200 }),
  qualifierName: varchar('qualifier_name', { length: 50 }).notNull(),
  qualifierLabel: varchar('qualifier_label', { length: 200 }),
  qualifierValue: text('qualifier_value').notNull(),
  origin: varchar('origin', { length: 50 }),
  evaluator: varchar('evaluator', { length: 200 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: uuid('created_by').notNull(),
})

// ---------------------------------------------------------------------------
// related_records — RELREC domain
// ---------------------------------------------------------------------------

export const relatedRecords = sendSchema.table('related_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  studyId: uuid('study_id')
    .notNull()
    .references(() => studies.id),
  subjectId: uuid('subject_id').references(() => subjects.id),
  relatedDomain: varchar('related_domain', { length: 2 }).notNull(),
  idVar: varchar('id_var', { length: 50 }),
  idVarValue: varchar('id_var_value', { length: 200 }),
  relationType: varchar('relation_type', { length: 50 }),
  relationId: varchar('relation_id', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: uuid('created_by').notNull(),
})

// ---------------------------------------------------------------------------
// Zod Schemas & TypeScript Types
// ---------------------------------------------------------------------------

// Studies
export const insertStudySchema = createInsertSchema(studies)
export const selectStudySchema = createSelectSchema(studies)
export type InsertStudy = z.infer<typeof insertStudySchema>
export type Study = z.infer<typeof selectStudySchema>

// Trial Summary Parameters
export const insertTrialSummaryParameterSchema = createInsertSchema(trialSummaryParameters)
export const selectTrialSummaryParameterSchema = createSelectSchema(trialSummaryParameters)
export type InsertTrialSummaryParameter = z.infer<typeof insertTrialSummaryParameterSchema>
export type TrialSummaryParameter = z.infer<typeof selectTrialSummaryParameterSchema>

// Trial Arms
export const insertTrialArmSchema = createInsertSchema(trialArms)
export const selectTrialArmSchema = createSelectSchema(trialArms)
export type InsertTrialArm = z.infer<typeof insertTrialArmSchema>
export type TrialArm = z.infer<typeof selectTrialArmSchema>

// Trial Sets
export const insertTrialSetSchema = createInsertSchema(trialSets)
export const selectTrialSetSchema = createSelectSchema(trialSets)
export type InsertTrialSet = z.infer<typeof insertTrialSetSchema>
export type TrialSet = z.infer<typeof selectTrialSetSchema>

// Subjects
export const insertSubjectSchema = createInsertSchema(subjects)
export const selectSubjectSchema = createSelectSchema(subjects)
export type InsertSubject = z.infer<typeof insertSubjectSchema>
export type Subject = z.infer<typeof selectSubjectSchema>

// Subject Elements
export const insertSubjectElementSchema = createInsertSchema(subjectElements)
export const selectSubjectElementSchema = createSelectSchema(subjectElements)
export type InsertSubjectElement = z.infer<typeof insertSubjectElementSchema>
export type SubjectElement = z.infer<typeof selectSubjectElementSchema>

// Exposures
export const insertExposureSchema = createInsertSchema(exposures)
export const selectExposureSchema = createSelectSchema(exposures)
export type InsertExposure = z.infer<typeof insertExposureSchema>
export type Exposure = z.infer<typeof selectExposureSchema>

// Dispositions
export const insertDispositionSchema = createInsertSchema(dispositions)
export const selectDispositionSchema = createSelectSchema(dispositions)
export type InsertDisposition = z.infer<typeof insertDispositionSchema>
export type Disposition = z.infer<typeof selectDispositionSchema>

// Findings
export const insertFindingSchema = createInsertSchema(findings)
export const selectFindingSchema = createSelectSchema(findings)
export type InsertFinding = z.infer<typeof insertFindingSchema>
export type Finding = z.infer<typeof selectFindingSchema>

// Comments
export const insertCommentSchema = createInsertSchema(comments)
export const selectCommentSchema = createSelectSchema(comments)
export type InsertComment = z.infer<typeof insertCommentSchema>
export type Comment = z.infer<typeof selectCommentSchema>

// Supplemental Qualifiers
export const insertSupplementalQualifierSchema = createInsertSchema(supplementalQualifiers)
export const selectSupplementalQualifierSchema = createSelectSchema(supplementalQualifiers)
export type InsertSupplementalQualifier = z.infer<typeof insertSupplementalQualifierSchema>
export type SupplementalQualifier = z.infer<typeof selectSupplementalQualifierSchema>

// Related Records
export const insertRelatedRecordSchema = createInsertSchema(relatedRecords)
export const selectRelatedRecordSchema = createSelectSchema(relatedRecords)
export type InsertRelatedRecord = z.infer<typeof insertRelatedRecordSchema>
export type RelatedRecord = z.infer<typeof selectRelatedRecordSchema>
