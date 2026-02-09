// ---------------------------------------------------------------------------
// Study Status
// ---------------------------------------------------------------------------

export const STUDY_STATUS = ['draft', 'in_progress', 'completed', 'archived'] as const
export type StudyStatus = (typeof STUDY_STATUS)[number]

// ---------------------------------------------------------------------------
// SEND Domain Codes
// ---------------------------------------------------------------------------

/** Findings domains — observational data stored in the unified `findings` table */
export const FINDINGS_DOMAINS = [
  'BG',
  'BW',
  'CL',
  'DD',
  'EG',
  'FW',
  'LB',
  'MA',
  'MI',
  'OM',
  'PC',
  'PM',
  'PP',
  'SC',
  'TF',
  'VS',
] as const
export type FindingsDomain = (typeof FINDINGS_DOMAINS)[number]

/** Trial design domains — structural/reference data */
export const TRIAL_DESIGN_DOMAINS = ['TA', 'TE', 'TS', 'TX'] as const
export type TrialDesignDomain = (typeof TRIAL_DESIGN_DOMAINS)[number]

/** Special purpose domains — subjects, disposition, comments, etc. */
export const SPECIAL_PURPOSE_DOMAINS = ['CO', 'DM', 'DS', 'EX', 'SE'] as const
export type SpecialPurposeDomain = (typeof SPECIAL_PURPOSE_DOMAINS)[number]

/** All SEND domains found in the PointCross dataset */
export const ALL_DOMAINS = [
  ...FINDINGS_DOMAINS,
  ...TRIAL_DESIGN_DOMAINS,
  ...SPECIAL_PURPOSE_DOMAINS,
] as const
export type SendDomain = (typeof ALL_DOMAINS)[number]

/** Human-readable labels for all domains */
export const DOMAIN_LABELS: Record<string, string> = {
  // Findings
  BG: 'Body Weight Gains',
  BW: 'Body Weights',
  CL: 'Clinical Observations',
  DD: 'Death Details',
  EG: 'ECG/Electrocardiogram',
  FW: 'Food/Water Consumption',
  LB: 'Laboratory Results',
  MA: 'Macroscopic Findings',
  MI: 'Microscopic Findings',
  OM: 'Organ Measurements',
  PC: 'Pharmacokinetic Concentrations',
  PM: 'Palpable Masses',
  PP: 'Pharmacokinetic Parameters',
  SC: 'Subject Characteristics',
  TF: 'Tumor Findings',
  VS: 'Vital Signs',
  // Trial design
  TA: 'Trial Arms',
  TE: 'Trial Elements',
  TS: 'Trial Summary',
  TX: 'Trial Sets',
  // Special purpose
  CO: 'Comments',
  DM: 'Demographics',
  DS: 'Disposition',
  EX: 'Exposure',
  SE: 'Subject Elements',
}

// Backward-compatible exports
export const SEND_DOMAINS = ALL_DOMAINS
export const SEND_DOMAIN_LABELS = DOMAIN_LABELS
