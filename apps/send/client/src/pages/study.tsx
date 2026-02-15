import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

import {
  View,
  useApi,
  Badge,
  Skeleton,
  Alert,
  AlertDescription,
  EmptyState,
  DataGrid,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@datagrok/app-kit'
import type { BadgeVariant } from '@datagrok/app-kit'

import type { StudyStatus } from '../../../shared/constants'

import { SendNav } from '../components/send-nav'

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

  const activeRows = activeDomain ? domainCache[activeDomain] ?? [] : []

  const study = studyResponse?.study
  const domains = studyResponse?.domains ?? []

  const domainStatus = activeDomain && activeRows.length > 0
    ? `${activeDomain}: ${String(activeRows.length)} rows`
    : undefined

  return (
    <View
      name={study ? `Study: ${study.studyId}` : 'Study'}
      breadcrumbs={[
        { label: 'SEND' },
        { label: 'Studies', href: '..' },
        { label: study?.studyId ?? '...' },
      ]}
      toolbox={<SendNav />}
      status={domainStatus}
    >
      <div className="p-4">
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-10" />
            <Skeleton className="h-64" />
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="text-center">
            <AlertDescription>{error}</AlertDescription>
            <Link to=".." className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              Back to Studies
            </Link>
          </Alert>
        )}

        {!loading && !error && study && (
          <div className="space-y-4">
            {/* Study header */}
            <div className="flex items-start justify-between rounded-lg border border-border bg-muted/30 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-foreground">{study.title}</h2>
                  <Badge variant={study.status as BadgeVariant}>
                    {STATUS_LABELS[study.status]}
                  </Badge>
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
                to=".."
                className="shrink-0 text-sm font-medium text-primary hover:underline"
              >
                All Studies
              </Link>
            </div>

            {/* Domain tabs + data */}
            {domains.length > 0 && (
              <Tabs
                value={activeDomain ?? undefined}
                onValueChange={setActiveDomain}
              >
                <TabsList>
                  {domains.map((d) => (
                    <TabsTrigger key={d.domain} value={d.domain} title={`${d.label} (${String(d.count)} rows)`}>
                      {d.domain}
                      <span className="ml-1 text-xs text-muted-foreground">{d.count}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {domains.map((d) => (
                  <TabsContent key={d.domain} value={d.domain}>
                    {domainLoading && activeDomain === d.domain && (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-8" />
                        ))}
                      </div>
                    )}

                    {domainError && activeDomain === d.domain && (
                      <Alert variant="destructive" className="text-center">
                        <AlertDescription>{domainError}</AlertDescription>
                        <button
                          type="button"
                          onClick={() => {
                            setDomainCache((prev) => {
                              const next = { ...prev }
                              delete next[d.domain]
                              return next
                            })
                          }}
                          className="mt-3 text-sm font-medium text-primary hover:underline"
                        >
                          Retry
                        </button>
                      </Alert>
                    )}

                    {!domainLoading && !domainError && activeDomain === d.domain && activeRows.length === 0 && (
                      <EmptyState title={`No data for ${d.domain}`} />
                    )}

                    {!domainLoading && !domainError && activeDomain === d.domain && activeRows.length > 0 && (
                      <DataGrid
                        rowData={activeRows}
                        autoColumns
                        formatHeader={formatColumnHeader}
                        formatCell={formatCellValue}
                        height="auto"
                      />
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}

            {domains.length === 0 && (
              <EmptyState title="No domain data found for this study" />
            )}
          </div>
        )}
      </div>
    </View>
  )
}
