import { Hono } from 'hono'
import { eq, sql, desc, and } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'

import { db } from '../db/client'
import {
  studies,
  subjects,
  findings,
  exposures,
  dispositions,
  subjectElements,
  comments,
  trialArms,
  trialSummaryParameters,
  trialSets,
} from '../../shared/schema'
import { FINDINGS_DOMAINS, DOMAIN_LABELS } from '../../shared/constants'

export const studiesRoute = new Hono()

// ---------------------------------------------------------------------------
// GET /studies — list all studies with subject counts
// ---------------------------------------------------------------------------

studiesRoute.get('/studies', async (c) => {
  const subjectCountSq = db
    .select({
      studyId: subjects.studyId,
      count: sql<number>`count(*)::int`.as('subject_count'),
    })
    .from(subjects)
    .groupBy(subjects.studyId)
    .as('sc')

  const rows = await db
    .select({
      id: studies.id,
      studyId: studies.studyId,
      title: studies.title,
      status: studies.status,
      species: studies.species,
      strain: studies.strain,
      route: studies.route,
      testArticle: studies.testArticle,
      subjectCount: sql<number>`coalesce(${subjectCountSq.count}, 0)`.as('subject_count'),
      createdAt: studies.createdAt,
    })
    .from(studies)
    .leftJoin(subjectCountSq, eq(studies.id, subjectCountSq.studyId))
    .orderBy(desc(studies.createdAt))

  return c.json(rows)
})

// ---------------------------------------------------------------------------
// GET /studies/:id — study detail with available domain counts
// ---------------------------------------------------------------------------

studiesRoute.get('/studies/:id', async (c) => {
  const studyUuid = c.req.param('id')

  const [study] = await db.select().from(studies).where(eq(studies.id, studyUuid))

  if (!study) {
    throw new HTTPException(404, { message: 'Study not found' })
  }

  // Findings domain counts (single GROUP BY query)
  const findingsCounts = await db
    .select({
      domain: findings.domain,
      count: sql<number>`count(*)::int`,
    })
    .from(findings)
    .where(eq(findings.studyId, studyUuid))
    .groupBy(findings.domain)

  // Special-purpose + trial design domain counts (parallel)
  const [dmRes, exRes, dsRes, seRes, coRes, taRes, tsRes, txRes] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(subjects).where(eq(subjects.studyId, studyUuid)),
    db.select({ count: sql<number>`count(*)::int` }).from(exposures).where(eq(exposures.studyId, studyUuid)),
    db.select({ count: sql<number>`count(*)::int` }).from(dispositions).where(eq(dispositions.studyId, studyUuid)),
    db.select({ count: sql<number>`count(*)::int` }).from(subjectElements).where(eq(subjectElements.studyId, studyUuid)),
    db.select({ count: sql<number>`count(*)::int` }).from(comments).where(eq(comments.studyId, studyUuid)),
    db.select({ count: sql<number>`count(*)::int` }).from(trialArms).where(eq(trialArms.studyId, studyUuid)),
    db.select({ count: sql<number>`count(*)::int` }).from(trialSummaryParameters).where(eq(trialSummaryParameters.studyId, studyUuid)),
    db.select({ count: sql<number>`count(*)::int` }).from(trialSets).where(eq(trialSets.studyId, studyUuid)),
  ])

  const domains: Array<{ domain: string; label: string; count: number }> = []

  for (const fc of findingsCounts) {
    const label = DOMAIN_LABELS[fc.domain]
    if (label) domains.push({ domain: fc.domain, label, count: fc.count })
  }

  const otherDomains: Array<{ domain: string; count: number }> = [
    { domain: 'DM', count: dmRes[0].count },
    { domain: 'EX', count: exRes[0].count },
    { domain: 'DS', count: dsRes[0].count },
    { domain: 'SE', count: seRes[0].count },
    { domain: 'CO', count: coRes[0].count },
    { domain: 'TA', count: taRes[0].count },
    { domain: 'TS', count: tsRes[0].count },
    { domain: 'TX', count: txRes[0].count },
  ]

  for (const od of otherDomains) {
    if (od.count > 0) {
      domains.push({ domain: od.domain, label: DOMAIN_LABELS[od.domain] ?? od.domain, count: od.count })
    }
  }

  domains.sort((a, b) => a.domain.localeCompare(b.domain))

  return c.json({ study, domains })
})

// ---------------------------------------------------------------------------
// DELETE /studies/:id — delete a study and all associated data (cascades)
// ---------------------------------------------------------------------------

studiesRoute.delete('/studies/:id', async (c) => {
  const studyUuid = c.req.param('id')

  const [study] = await db.select({ id: studies.id }).from(studies).where(eq(studies.id, studyUuid))

  if (!study) {
    throw new HTTPException(404, { message: 'Study not found' })
  }

  await db.delete(studies).where(eq(studies.id, studyUuid))

  return c.json({ success: true })
})

// ---------------------------------------------------------------------------
// GET /studies/:id/domains/:domain — rows for a specific domain
// ---------------------------------------------------------------------------

const FINDINGS_SET = new Set<string>(FINDINGS_DOMAINS)

studiesRoute.get('/studies/:id/domains/:domain', async (c) => {
  const studyUuid = c.req.param('id')
  const domainCode = c.req.param('domain').toUpperCase()

  if (FINDINGS_SET.has(domainCode)) {
    const rows = await db
      .select({
        usubjid: subjects.usubjid,
        seq: findings.seq,
        testCode: findings.testCode,
        testName: findings.testName,
        category: findings.category,
        subcategory: findings.subcategory,
        originalResult: findings.originalResult,
        originalUnit: findings.originalUnit,
        standardResult: findings.standardResult,
        standardResultNumeric: findings.standardResultNumeric,
        standardUnit: findings.standardUnit,
        resultCategory: findings.resultCategory,
        findingStatus: findings.findingStatus,
        specimen: findings.specimen,
        anatomicalRegion: findings.anatomicalRegion,
        laterality: findings.laterality,
        severity: findings.severity,
        method: findings.method,
        baselineFlag: findings.baselineFlag,
        studyDay: findings.studyDay,
        endDay: findings.endDay,
        dateCollected: findings.dateCollected,
      })
      .from(findings)
      .leftJoin(subjects, eq(findings.subjectId, subjects.id))
      .where(and(eq(findings.studyId, studyUuid), eq(findings.domain, domainCode)))
      .orderBy(subjects.usubjid, findings.seq)

    return c.json(rows)
  }

  switch (domainCode) {
    case 'DM': {
      const rows = await db
        .select({
          usubjid: subjects.usubjid,
          subjid: subjects.subjid,
          sex: subjects.sex,
          species: subjects.species,
          strain: subjects.strain,
          sbstrain: subjects.sbstrain,
          armCode: subjects.armCode,
          arm: subjects.arm,
          setCode: subjects.setCode,
        })
        .from(subjects)
        .where(eq(subjects.studyId, studyUuid))
        .orderBy(subjects.usubjid)

      return c.json(rows)
    }

    case 'EX': {
      const rows = await db
        .select({
          usubjid: subjects.usubjid,
          seq: exposures.seq,
          treatment: exposures.treatment,
          dose: exposures.dose,
          doseUnit: exposures.doseUnit,
          doseForm: exposures.doseForm,
          doseFrequency: exposures.doseFrequency,
          route: exposures.route,
          startDate: exposures.startDate,
          endDate: exposures.endDate,
          startDay: exposures.startDay,
          endDay: exposures.endDay,
        })
        .from(exposures)
        .leftJoin(subjects, eq(exposures.subjectId, subjects.id))
        .where(eq(exposures.studyId, studyUuid))
        .orderBy(subjects.usubjid, exposures.seq)

      return c.json(rows)
    }

    case 'DS': {
      const rows = await db
        .select({
          usubjid: subjects.usubjid,
          seq: dispositions.seq,
          category: dispositions.category,
          term: dispositions.term,
          decodedTerm: dispositions.decodedTerm,
          visitDay: dispositions.visitDay,
          startDate: dispositions.startDate,
          startDay: dispositions.startDay,
        })
        .from(dispositions)
        .leftJoin(subjects, eq(dispositions.subjectId, subjects.id))
        .where(eq(dispositions.studyId, studyUuid))
        .orderBy(subjects.usubjid, dispositions.seq)

      return c.json(rows)
    }

    case 'SE': {
      const rows = await db
        .select({
          usubjid: subjects.usubjid,
          seq: subjectElements.seq,
          etcd: subjectElements.etcd,
          element: subjectElements.element,
          sestdtc: subjectElements.sestdtc,
          seendtc: subjectElements.seendtc,
          epoch: subjectElements.epoch,
        })
        .from(subjectElements)
        .leftJoin(subjects, eq(subjectElements.subjectId, subjects.id))
        .where(eq(subjectElements.studyId, studyUuid))
        .orderBy(subjects.usubjid, subjectElements.seq)

      return c.json(rows)
    }

    case 'CO': {
      const rows = await db
        .select({
          usubjid: subjects.usubjid,
          relatedDomain: comments.relatedDomain,
          seq: comments.seq,
          idVar: comments.idVar,
          idVarValue: comments.idVarValue,
          commentValue: comments.commentValue,
          commentDate: comments.commentDate,
        })
        .from(comments)
        .leftJoin(subjects, eq(comments.subjectId, subjects.id))
        .where(eq(comments.studyId, studyUuid))
        .orderBy(comments.seq)

      return c.json(rows)
    }

    case 'TA': {
      const rows = await db
        .select({
          armCode: trialArms.armCode,
          arm: trialArms.arm,
          taetord: trialArms.taetord,
          etcd: trialArms.etcd,
          element: trialArms.element,
          tabranch: trialArms.tabranch,
          epoch: trialArms.epoch,
        })
        .from(trialArms)
        .where(eq(trialArms.studyId, studyUuid))
        .orderBy(trialArms.armCode, trialArms.taetord)

      return c.json(rows)
    }

    case 'TS': {
      const rows = await db
        .select({
          seq: trialSummaryParameters.seq,
          groupId: trialSummaryParameters.groupId,
          parameterCode: trialSummaryParameters.parameterCode,
          parameter: trialSummaryParameters.parameter,
          value: trialSummaryParameters.value,
        })
        .from(trialSummaryParameters)
        .where(eq(trialSummaryParameters.studyId, studyUuid))
        .orderBy(trialSummaryParameters.seq)

      return c.json(rows)
    }

    case 'TX': {
      const rows = await db
        .select({
          setCode: trialSets.setCode,
          setDescription: trialSets.setDescription,
          seq: trialSets.seq,
          parameterCode: trialSets.parameterCode,
          parameter: trialSets.parameter,
          value: trialSets.value,
        })
        .from(trialSets)
        .where(eq(trialSets.studyId, studyUuid))
        .orderBy(trialSets.setCode, trialSets.seq)

      return c.json(rows)
    }

    default:
      return c.json([])
  }
})
