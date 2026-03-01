import { Hono } from 'hono'
import { eq, sql, and, inArray } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import type { AppVariables } from '@datagrok/server-kit'

import {
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
import { getSecureDb } from '../db/secure'

export const studiesRoute = new Hono<{ Variables: AppVariables }>()

// ---------------------------------------------------------------------------
// GET /studies — list studies visible to the current user, with subject counts
// ---------------------------------------------------------------------------

studiesRoute.get('/studies', async (c) => {
  const sdb = getSecureDb(c)

  // Permission-filtered study list
  const rows = await sdb.entity.studies.findMany({
    select: {
      id: true,
      studyId: true,
      title: true,
      status: true,
      species: true,
      strain: true,
      route: true,
      testArticle: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    includePermissions: true,
  })

  if (rows.length === 0) {
    return c.json([])
  }

  // Fetch subject counts for visible studies
  const studyIds = rows.map((r) => r['id'] as string)
  const subjectCounts = await sdb
    .select({
      studyId: subjects.studyId,
      count: sql<number>`count(*)::int`.as('subject_count'),
    })
    .from(subjects)
    .where(inArray(subjects.studyId, studyIds))
    .groupBy(subjects.studyId)

  const countMap = new Map(subjectCounts.map((sc) => [sc.studyId, sc.count]))

  const result = rows.map((r) => ({
    ...r,
    subjectCount: countMap.get(r['id'] as string) ?? 0,
  }))

  return c.json(result)
})

// ---------------------------------------------------------------------------
// GET /studies/:id — study detail with available domain counts
// ---------------------------------------------------------------------------

studiesRoute.get('/studies/:id', async (c) => {
  const studyUuid = c.req.param('id')
  const sdb = getSecureDb(c)

  // Permission-filtered lookup
  const study = await sdb.entity.studies.findUnique({
    where: { id: studyUuid },
    includePermissions: true,
  })

  if (!study) {
    throw new HTTPException(404, { message: 'Study not found' })
  }

  // Domain counts — these are detail tables, queried with raw Drizzle
  const findingsCounts = await sdb
    .select({
      domain: findings.domain,
      count: sql<number>`count(*)::int`,
    })
    .from(findings)
    .where(eq(findings.studyId, studyUuid))
    .groupBy(findings.domain)

  const [dmRes, exRes, dsRes, seRes, coRes, taRes, tsRes, txRes] = await Promise.all([
    sdb.select({ count: sql<number>`count(*)::int` }).from(subjects).where(eq(subjects.studyId, studyUuid)),
    sdb.select({ count: sql<number>`count(*)::int` }).from(exposures).where(eq(exposures.studyId, studyUuid)),
    sdb.select({ count: sql<number>`count(*)::int` }).from(dispositions).where(eq(dispositions.studyId, studyUuid)),
    sdb.select({ count: sql<number>`count(*)::int` }).from(subjectElements).where(eq(subjectElements.studyId, studyUuid)),
    sdb.select({ count: sql<number>`count(*)::int` }).from(comments).where(eq(comments.studyId, studyUuid)),
    sdb.select({ count: sql<number>`count(*)::int` }).from(trialArms).where(eq(trialArms.studyId, studyUuid)),
    sdb.select({ count: sql<number>`count(*)::int` }).from(trialSummaryParameters).where(eq(trialSummaryParameters.studyId, studyUuid)),
    sdb.select({ count: sql<number>`count(*)::int` }).from(trialSets).where(eq(trialSets.studyId, studyUuid)),
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
// DELETE /studies/:id — delete a study (requires Delete permission)
// ---------------------------------------------------------------------------

studiesRoute.delete('/studies/:id', async (c) => {
  const studyUuid = c.req.param('id')
  const sdb = getSecureDb(c)

  // entity-db checks Delete permission and cascades via entities row
  await sdb.entity.studies.delete({ where: { id: studyUuid } })

  return c.json({ success: true })
})

// ---------------------------------------------------------------------------
// GET /studies/:id/domains/:domain — rows for a specific domain
// ---------------------------------------------------------------------------

const FINDINGS_SET = new Set<string>(FINDINGS_DOMAINS)

studiesRoute.get('/studies/:id/domains/:domain', async (c) => {
  const studyUuid = c.req.param('id')
  const domainCode = c.req.param('domain').toUpperCase()
  const sdb = getSecureDb(c)

  // Verify the user can view this study
  const study = await sdb.entity.studies.findUnique({ where: { id: studyUuid } })
  if (!study) {
    throw new HTTPException(404, { message: 'Study not found' })
  }

  if (FINDINGS_SET.has(domainCode)) {
    const rows = await sdb
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
      const rows = await sdb
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
      const rows = await sdb
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
      const rows = await sdb
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
      const rows = await sdb
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
      const rows = await sdb
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
      const rows = await sdb
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
      const rows = await sdb
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
      const rows = await sdb
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
