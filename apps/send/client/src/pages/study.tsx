import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

import { PageLayout, useApi } from '@datagrok/app-kit'

import type { StudyStatus } from '../../../shared/constants'

import { nav } from '../nav'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DomainInfo {
  domain: string
  label: string
  count: number
}

interface StudyDetail {
  id: string
  studyId: string
  title: string
  status: StudyStatus
  species: string | null
  strain: string | null
  route: string | null
  testArticle: string | null
  sponsor: string | null
  studyDirector: string | null
  createdAt: string
}

interface StudyResponse {
  study: StudyDetail
  domains: DomainInfo[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UPPER_FIELDS = new Set(['usubjid', 'subjid', 'seq', 'etcd'])

function formatColumnHeader(key: string): string {
  if (UPPER_FIELDS.has(key)) return key.toUpperCase()
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (s) => s.toUpperCase())
}

function formatCellValue(value: unknown): string {
  if (value == null) return '\u2014'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleDateString()
  }
  return String(value)
}

const STATUS_STYLES: Record<StudyStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  archived: 'bg-muted text-muted-foreground',
}

const STATUS_LABELS: Record<StudyStatus, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  completed: 'Completed',
  archived: 'Archived',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StudyPage() {
  const { id } = useParams<{ id: string }>()
  const api = useApi()

  const [studyResponse, setStudyResponse] = useState<StudyResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeDomain, setActiveDomain] = useState<string | null>(null)
  const [domainCache, setDomainCache] = useState<Record<string, Record<string, unknown>[]>>({})
  const [domainLoading, setDomainLoading] = useState(false)
  const [domainError, setDomainError] = useState<string | null>(null)

  // Fetch study detail + domain list
  useEffect(() => {
    if (!id) return

    async function fetchStudy() {
      setLoading(true)
      setError(null)
      try {
        const data = await api.get<StudyResponse>(`/studies/${id}`)
        setStudyResponse(data)
        if (data.domains.length > 0) {
          setActiveDomain(data.domains[0].domain)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load study')
      } finally {
        setLoading(false)
      }
    }

    void fetchStudy()
  }, [id])

  // Fetch domain data when active tab changes
  useEffect(() => {
    if (!activeDomain || !id) return
    if (domainCache[activeDomain]) return

    const domain = activeDomain

    async function fetchDomainData() {
      setDomainLoading(true)
      setDomainError(null)
      try {
        const rows = await api.get<Record<string, unknown>[]>(
          `/studies/${id}/domains/${domain}`,
        )
        setDomainCache((prev) => ({ ...prev, [domain]: rows }))
      } catch (err) {
        setDomainError(err instanceof Error ? err.message : 'Failed to load domain data')
      } finally {
        setDomainLoading(false)
      }
    }

    void fetchDomainData()
  }, [activeDomain, id])

  // Derive visible columns (exclude all-null columns)
  const activeRows = activeDomain ? domainCache[activeDomain] ?? [] : []
  const columns =
    activeRows.length > 0
      ? Object.keys(activeRows[0]).filter((key) =>
          activeRows.some((row) => row[key] != null && row[key] !== ''),
        )
      : []

  const study = studyResponse?.study
  const domains = studyResponse?.domains ?? []

  return (
    <PageLayout title={study ? `Study: ${study.studyId}` : 'Study'} nav={nav}>
      {loading && (
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Link to="/" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            Back to Studies
          </Link>
        </div>
      )}

      {!loading && !error && study && (
        <div className="space-y-4">
          {/* Study header */}
          <div className="flex items-start justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">{study.title}</h2>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[study.status]}`}
                >
                  {STATUS_LABELS[study.status]}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>ID: <span className="font-medium text-foreground">{study.studyId}</span></span>
                {study.species && <span>Species: {study.species}</span>}
                {study.strain && <span>Strain: {study.strain}</span>}
                {study.route && <span>Route: {study.route}</span>}
                {study.testArticle && <span>Test Article: {study.testArticle}</span>}
              </div>
            </div>
            <Link
              to="/"
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              All Studies
            </Link>
          </div>

          {/* Domain tabs */}
          {domains.length > 0 && (
            <div className="overflow-x-auto border-b border-border">
              <div className="flex gap-0">
                {domains.map((d) => (
                  <button
                    key={d.domain}
                    type="button"
                    title={`${d.label} (${String(d.count)} rows)`}
                    className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                      activeDomain === d.domain
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                    onClick={() => setActiveDomain(d.domain)}
                  >
                    {d.domain}
                    <span className="ml-1 text-xs text-muted-foreground">
                      {d.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Domain data table */}
          {domainLoading && (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-muted" />
              ))}
            </div>
          )}

          {domainError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
              <p className="text-sm text-destructive">{domainError}</p>
              <button
                type="button"
                onClick={() => {
                  if (activeDomain) {
                    setDomainCache((prev) => {
                      const next = { ...prev }
                      delete next[activeDomain]
                      return next
                    })
                  }
                }}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {!domainLoading && !domainError && activeRows.length === 0 && activeDomain && (
            <div className="rounded-lg border border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">No data for {activeDomain}</p>
            </div>
          )}

          {!domainLoading && !domainError && activeRows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground"
                      >
                        {formatColumnHeader(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="whitespace-nowrap px-3 py-1.5 text-foreground"
                        >
                          {formatCellValue(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {domains.length === 0 && (
            <div className="rounded-lg border border-border p-12 text-center">
              <p className="text-sm text-muted-foreground">No domain data found for this study</p>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  )
}
