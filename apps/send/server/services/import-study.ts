import fs from 'fs'
import path from 'path'

import { eq } from 'drizzle-orm'
// xport-js is CJS with nested default exports: module.default.default = Library class
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/consistent-type-imports
import xportModule from 'xport-js'

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const Library = (xportModule as unknown as { default: typeof import('xport-js').default }).default

import {
  studies,
  trialSummaryParameters,
  trialArms,
  trialSets,
  subjects,
  subjectElements,
  exposures,
  dispositions,
  findings,
  comments,
  supplementalQualifiers,
  relatedRecords,
} from '../../shared/schema'
import { FINDINGS_DOMAINS } from '../../shared/constants'
import { db } from '../db/client'

import type { FindingsDomain } from '../../shared/constants'
import type { ImportResult } from '../../shared/types'

// ---------------------------------------------------------------------------
// XPT reading helpers
// ---------------------------------------------------------------------------

type Row = Record<string, string | number>

async function readXpt(
  dataDir: string,
  filename: string,
): Promise<{ columns: string[]; rows: Row[] }> {
  const filepath = path.join(dataDir, filename)
  const lib = new Library(filepath)

  // xport-js returns loosely typed metadata and data arrays
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const meta = await lib.getMetadata()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const columns: string[] = meta.map((v: { name: string }) => v.name)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const result = await lib.getData({ type: 'array', length: 100000 })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const rows: Row[] = (result.data as (string | number)[][]).map((arr) => {
    const obj: Row = {}
    columns.forEach((col: string, i: number) => {
      const val = arr[i]
      obj[col] = typeof val === 'string' ? val.trim() : val
    })
    return obj
  })

  return { columns, rows }
}

function str(row: Row, key: string): string {
  const v = row[key]
  return v == null ? '' : String(v).trim()
}

function numOrNull(row: Row, key: string): number | null {
  const v = row[key]
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return isNaN(n) ? null : n
}

function intOrNull(row: Row, key: string): number | null {
  const n = numOrNull(row, key)
  return n == null ? null : Math.round(n)
}

function dateOrNull(row: Row, key: string): Date | null {
  const v = str(row, key)
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

// ---------------------------------------------------------------------------
// Column mapping constants
// ---------------------------------------------------------------------------

const FINDINGS_COLUMN_MAP: Record<string, string> = {
  TESTCD: 'testCode',
  TEST: 'testName',
  CAT: 'category',
  SCAT: 'subcategory',
  ORRES: 'originalResult',
  ORRESU: 'originalUnit',
  STRESC: 'standardResult',
  STRESN: 'standardResultNumeric',
  STRESU: 'standardUnit',
  RESCAT: 'resultCategory',
  STAT: 'findingStatus',
  REASND: 'reasonNotDone',
  SPEC: 'specimen',
  ANTREG: 'anatomicalRegion',
  LAT: 'laterality',
  SEV: 'severity',
  METHOD: 'method',
  BLFL: 'baselineFlag',
  LOC: 'location',
  DTHREL: 'deathRelation',
  DTC: 'dateCollected',
  ENDTC: 'endDate',
  DY: 'studyDay',
  ENDY: 'endDay',
}

const DATE_FIELDS = new Set(['dateCollected', 'endDate'])
const NUMERIC_FIELDS = new Set(['standardResultNumeric', 'studyDay', 'endDay'])

// ---------------------------------------------------------------------------
// Import functions
// ---------------------------------------------------------------------------

async function importStudy(
  dataDir: string,
  userId: string,
): Promise<{ studyDbId: string; studyCode: string; studyTitle: string }> {
  const { rows } = await readXpt(dataDir, 'ts.xpt')

  const params: Record<string, string> = {}
  for (const row of rows) {
    params[str(row, 'TSPARMCD')] = str(row, 'TSVAL')
  }

  const studyId = params['STUDYID'] || rows[0] ? str(rows[0], 'STUDYID') : 'UNKNOWN'
  const title = params['SSTDTL'] || params['TITLE'] || studyId

  const [inserted] = await db
    .insert(studies)
    .values({
      studyId,
      title,
      status: 'completed',
      sponsor: params['SPONSOR'] || null,
      species: params['SPECIES'] || null,
      strain: params['STRAIN'] || null,
      route: params['ROUTE'] || null,
      testArticle: params['TRT'] || null,
      glpStatus: params['PLTEFG'] || null,
      sendVersion: params['SNDSVER'] || null,
      createdBy: userId,
    })
    .onConflictDoNothing()
    .returning({ id: studies.id })

  let studyDbId: string
  if (!inserted) {
    const [existing] = await db
      .select({ id: studies.id })
      .from(studies)
      .where(eq(studies.studyId, studyId))
    studyDbId = existing.id
  } else {
    studyDbId = inserted.id

    for (const row of rows) {
      await db
        .insert(trialSummaryParameters)
        .values({
          studyId: studyDbId,
          seq: intOrNull(row, 'TSSEQ') ?? 1,
          groupId: str(row, 'TSGRPID') || null,
          parameterCode: str(row, 'TSPARMCD'),
          parameter: str(row, 'TSPARM'),
          value: str(row, 'TSVAL'),
          createdBy: userId,
        })
        .onConflictDoNothing()
    }
  }

  return { studyDbId, studyCode: studyId, studyTitle: title }
}

async function importTrialArms(
  dataDir: string,
  studyDbId: string,
  userId: string,
): Promise<void> {
  let data
  try {
    data = await readXpt(dataDir, 'ta.xpt')
  } catch {
    return
  }

  for (const row of data.rows) {
    await db
      .insert(trialArms)
      .values({
        studyId: studyDbId,
        armCode: str(row, 'ARMCD'),
        arm: str(row, 'ARM'),
        taetord: intOrNull(row, 'TAETORD'),
        etcd: str(row, 'ETCD') || null,
        element: str(row, 'ELEMENT') || null,
        tabranch: str(row, 'TABRANCH') || null,
        epoch: str(row, 'EPOCH') || null,
        createdBy: userId,
      })
      .onConflictDoNothing()
  }
}

async function importTrialSets(
  dataDir: string,
  studyDbId: string,
  userId: string,
): Promise<void> {
  let data
  try {
    data = await readXpt(dataDir, 'tx.xpt')
  } catch {
    return
  }

  for (const row of data.rows) {
    await db
      .insert(trialSets)
      .values({
        studyId: studyDbId,
        setCode: str(row, 'SETCD'),
        setDescription: str(row, 'SET') || str(row, 'SETCD'),
        seq: intOrNull(row, 'TXSEQ'),
        parameterCode: str(row, 'TXPARMCD') || null,
        parameter: str(row, 'TXPARM') || null,
        value: str(row, 'TXVAL') || null,
        createdBy: userId,
      })
      .onConflictDoNothing()
  }
}

async function importSubjects(
  dataDir: string,
  studyDbId: string,
  userId: string,
): Promise<Map<string, string>> {
  const { rows } = await readXpt(dataDir, 'dm.xpt')
  const subjectMap = new Map<string, string>()

  for (const row of rows) {
    const usubjid = str(row, 'USUBJID')
    const [inserted] = await db
      .insert(subjects)
      .values({
        studyId: studyDbId,
        usubjid,
        subjid: str(row, 'SUBJID'),
        sex: str(row, 'SEX') || 'U',
        species: str(row, 'SPECIES') || null,
        strain: str(row, 'STRAIN') || null,
        sbstrain: str(row, 'SBSTRAIN') || null,
        armCode: str(row, 'ARMCD') || null,
        arm: str(row, 'ARM') || null,
        setCode: str(row, 'SETCD') || null,
        rfstdtc: dateOrNull(row, 'RFSTDTC'),
        rfendtc: dateOrNull(row, 'RFENDTC'),
        rficdtc: dateOrNull(row, 'RFICDTC'),
        dthdtc: dateOrNull(row, 'DTHDTC'),
        dthfl: str(row, 'DTHFL') || null,
        siteid: str(row, 'SITEID') || null,
        brthdtc: dateOrNull(row, 'BRTHDTC'),
        agetxt: str(row, 'AGETXT') || null,
        ageu: str(row, 'AGEU') || null,
        createdBy: userId,
      })
      .onConflictDoNothing()
      .returning({ id: subjects.id })

    if (inserted) {
      subjectMap.set(usubjid, inserted.id)
    } else {
      const [existing] = await db
        .select({ id: subjects.id })
        .from(subjects)
        .where(eq(subjects.usubjid, usubjid))
      if (existing) subjectMap.set(usubjid, existing.id)
    }
  }

  return subjectMap
}

async function importSubjectElements(
  dataDir: string,
  studyDbId: string,
  subjectMap: Map<string, string>,
  userId: string,
): Promise<void> {
  let data
  try {
    data = await readXpt(dataDir, 'se.xpt')
  } catch {
    return
  }

  for (const row of data.rows) {
    const subjectId = subjectMap.get(str(row, 'USUBJID'))
    if (!subjectId) continue

    await db
      .insert(subjectElements)
      .values({
        studyId: studyDbId,
        subjectId,
        seq: intOrNull(row, 'SESEQ') ?? 1,
        etcd: str(row, 'ETCD') || null,
        element: str(row, 'ELEMENT') || null,
        sestdtc: dateOrNull(row, 'SESTDTC'),
        seendtc: dateOrNull(row, 'SEENDTC'),
        epoch: str(row, 'EPOCH') || null,
        createdBy: userId,
      })
      .onConflictDoNothing()
  }
}

async function importExposures(
  dataDir: string,
  studyDbId: string,
  subjectMap: Map<string, string>,
  userId: string,
): Promise<void> {
  let data
  try {
    data = await readXpt(dataDir, 'ex.xpt')
  } catch {
    return
  }

  for (const row of data.rows) {
    const subjectId = subjectMap.get(str(row, 'USUBJID'))
    if (!subjectId) continue

    await db
      .insert(exposures)
      .values({
        studyId: studyDbId,
        subjectId,
        seq: intOrNull(row, 'EXSEQ') ?? 1,
        treatment: str(row, 'EXTRT'),
        dose: numOrNull(row, 'EXDOSE'),
        doseUnit: str(row, 'EXDOSU') || null,
        doseForm: str(row, 'EXDOSFRM') || null,
        doseFrequency: str(row, 'EXDOSFRQ') || null,
        route: str(row, 'EXROUTE') || null,
        lotNumber: str(row, 'EXLOT') || null,
        vehicle: str(row, 'EXTRTV') || null,
        startDate: dateOrNull(row, 'EXSTDTC'),
        endDate: dateOrNull(row, 'EXENDTC'),
        startDay: intOrNull(row, 'EXSTDY'),
        endDay: intOrNull(row, 'EXENDY'),
        createdBy: userId,
      })
      .onConflictDoNothing()
  }
}

async function importDispositions(
  dataDir: string,
  studyDbId: string,
  subjectMap: Map<string, string>,
  userId: string,
): Promise<void> {
  let data
  try {
    data = await readXpt(dataDir, 'ds.xpt')
  } catch {
    return
  }

  for (const row of data.rows) {
    const subjectId = subjectMap.get(str(row, 'USUBJID'))
    if (!subjectId) continue

    await db
      .insert(dispositions)
      .values({
        studyId: studyDbId,
        subjectId,
        seq: intOrNull(row, 'DSSEQ') ?? 1,
        category: str(row, 'DSCAT') || null,
        term: str(row, 'DSTERM'),
        decodedTerm: str(row, 'DSDECOD') || null,
        visitDay: intOrNull(row, 'VISITDY'),
        startDate: dateOrNull(row, 'DSSTDTC'),
        startDay: intOrNull(row, 'DSSTDY'),
        createdBy: userId,
      })
      .onConflictDoNothing()
  }
}

async function importFindingsDomain(
  dataDir: string,
  domain: FindingsDomain,
  studyDbId: string,
  subjectMap: Map<string, string>,
  userId: string,
): Promise<number> {
  const filename = `${domain.toLowerCase()}.xpt`
  let data
  try {
    data = await readXpt(dataDir, filename)
  } catch {
    return 0
  }

  const { columns, rows } = data
  if (rows.length === 0) return 0

  const prefix = domain.toUpperCase()
  let insertedCount = 0

  const batchSize = 100
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const values = batch.map((row) => {
      const subjectId = subjectMap.get(str(row, 'USUBJID')) ?? null
      const seq = intOrNull(row, `${prefix}SEQ`) ?? 1

      const mapped: Record<string, unknown> = {
        studyId: studyDbId,
        subjectId,
        domain,
        seq,
        visitDay: intOrNull(row, 'VISITDY'),
        createdBy: userId,
      }

      const extras: Record<string, unknown> = {}
      const mappedCdiscVars = new Set([
        'STUDYID',
        'DOMAIN',
        'USUBJID',
        `${prefix}SEQ`,
        'VISITDY',
      ])

      for (const col of columns) {
        const suffix = col.startsWith(prefix) ? col.slice(prefix.length) : null
        const dbField = suffix ? FINDINGS_COLUMN_MAP[suffix] : null

        if (dbField) {
          mappedCdiscVars.add(col)
          let val: unknown
          if (DATE_FIELDS.has(dbField)) {
            val = dateOrNull(row, col)
          } else if (NUMERIC_FIELDS.has(dbField)) {
            val = numOrNull(row, col)
          } else {
            val = str(row, col) || null
          }
          mapped[dbField] = val
        }
      }

      for (const col of columns) {
        if (
          !mappedCdiscVars.has(col) &&
          !FINDINGS_COLUMN_MAP[col.startsWith(prefix) ? col.slice(prefix.length) : '']
        ) {
          const v = str(row, col)
          if (v) extras[col] = v
        }
      }

      if (Object.keys(extras).length > 0) {
        mapped['domainData'] = extras
      }

      if (!mapped['testCode'])
        mapped['testCode'] = str(row, `${prefix}TESTCD`) || 'UNKNOWN'
      if (!mapped['testName'])
        mapped['testName'] = str(row, `${prefix}TEST`) || mapped['testCode']

      return mapped
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    await db.insert(findings).values(values as any).onConflictDoNothing()
    insertedCount += batch.length
  }

  return insertedCount
}

async function importFindings(
  dataDir: string,
  studyDbId: string,
  subjectMap: Map<string, string>,
  userId: string,
): Promise<Record<string, number>> {
  const domainCounts: Record<string, number> = {}
  for (const domain of FINDINGS_DOMAINS) {
    const count = await importFindingsDomain(dataDir, domain, studyDbId, subjectMap, userId)
    if (count > 0) {
      domainCounts[domain] = count
    }
  }
  return domainCounts
}

async function importComments(
  dataDir: string,
  studyDbId: string,
  subjectMap: Map<string, string>,
  userId: string,
): Promise<number> {
  let data
  try {
    data = await readXpt(dataDir, 'co.xpt')
  } catch {
    return 0
  }

  for (const row of data.rows) {
    const subjectId = subjectMap.get(str(row, 'USUBJID')) ?? null

    await db
      .insert(comments)
      .values({
        studyId: studyDbId,
        subjectId,
        relatedDomain: str(row, 'RDOMAIN') || null,
        seq: intOrNull(row, 'COSEQ') ?? 1,
        idVar: str(row, 'IDVAR') || null,
        idVarValue: str(row, 'IDVARVAL') || null,
        commentValue: str(row, 'COVAL') || '(empty)',
        commentDate: dateOrNull(row, 'CODTC'),
        createdBy: userId,
      })
      .onConflictDoNothing()
  }

  return data.rows.length
}

async function importSupplemental(
  dataDir: string,
  studyDbId: string,
  subjectMap: Map<string, string>,
  userId: string,
): Promise<void> {
  // Discover SUPP files dynamically from the directory
  const files = fs.readdirSync(dataDir)
  const suppFiles = files.filter((f) => /^supp.*\.xpt$/i.test(f))

  for (const filename of suppFiles) {
    let data
    try {
      data = await readXpt(dataDir, filename)
    } catch {
      continue
    }

    for (const row of data.rows) {
      const subjectId = subjectMap.get(str(row, 'USUBJID')) ?? null

      await db
        .insert(supplementalQualifiers)
        .values({
          studyId: studyDbId,
          subjectId,
          relatedDomain: str(row, 'RDOMAIN'),
          idVar: str(row, 'IDVAR') || null,
          idVarValue: str(row, 'IDVARVAL') || null,
          qualifierName: str(row, 'QNAM'),
          qualifierLabel: str(row, 'QLABEL') || null,
          qualifierValue: str(row, 'QVAL') || '',
          origin: str(row, 'QORIG') || null,
          evaluator: str(row, 'QEVAL') || null,
          createdBy: userId,
        })
        .onConflictDoNothing()
    }
  }
}

async function importRelatedRecords(
  dataDir: string,
  studyDbId: string,
  subjectMap: Map<string, string>,
  userId: string,
): Promise<void> {
  let data
  try {
    data = await readXpt(dataDir, 'relrec.xpt')
  } catch {
    return
  }

  for (const row of data.rows) {
    const subjectId = subjectMap.get(str(row, 'USUBJID')) ?? null

    await db
      .insert(relatedRecords)
      .values({
        studyId: studyDbId,
        subjectId,
        relatedDomain: str(row, 'RDOMAIN'),
        idVar: str(row, 'IDVAR') || null,
        idVarValue: str(row, 'IDVARVAL') || null,
        relationType: str(row, 'RELTYPE') || null,
        relationId: str(row, 'RELID'),
        createdBy: userId,
      })
      .onConflictDoNothing()
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function importStudyFromDirectory(
  dataDir: string,
  userId: string,
): Promise<ImportResult> {
  // 1. Study + trial summary
  const { studyDbId, studyCode, studyTitle } = await importStudy(dataDir, userId)

  // 2. Trial Arms
  await importTrialArms(dataDir, studyDbId, userId)

  // 3. Trial Sets
  await importTrialSets(dataDir, studyDbId, userId)

  // 4. Subjects
  const subjectMap = await importSubjects(dataDir, studyDbId, userId)

  // 5. Subject Elements
  await importSubjectElements(dataDir, studyDbId, subjectMap, userId)

  // 6. Exposures
  await importExposures(dataDir, studyDbId, subjectMap, userId)

  // 7. Dispositions
  await importDispositions(dataDir, studyDbId, subjectMap, userId)

  // 8. Findings
  const domainCounts = await importFindings(dataDir, studyDbId, subjectMap, userId)

  // 9. Comments, Supplemental, Related Records
  const commentCount = await importComments(dataDir, studyDbId, subjectMap, userId)
  if (commentCount > 0) domainCounts['CO'] = commentCount
  await importSupplemental(dataDir, studyDbId, subjectMap, userId)
  await importRelatedRecords(dataDir, studyDbId, subjectMap, userId)

  return {
    studyId: studyDbId,
    studyCode,
    studyTitle,
    subjectCount: subjectMap.size,
    domainCounts,
  }
}
