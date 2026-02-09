import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageLayout, useApi } from '@datagrok/app-kit'

import type { StudyStatus } from '../../../shared/constants'

import { nav } from '../nav'

interface StudyRow {
  id: string
  studyId: string
  title: string
  status: StudyStatus
  species: string | null
  strain: string | null
  route: string | null
  testArticle: string | null
  subjectCount: number
  createdAt: string
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

export default function HomePage() {
  const api = useApi()
  const [studies, setStudies] = useState<StudyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchStudies() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<StudyRow[]>('/studies')
      setStudies(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load studies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchStudies()
  }, [])

  return (
    <PageLayout title="SEND — Animal Studies" nav={nav}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Studies</h2>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Upload Study
          </Link>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              onClick={() => void fetchStudies()}
              className="mt-3 text-sm font-medium text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && studies.length === 0 && (
          <div className="rounded-lg border border-border p-12 text-center">
            <div className="text-4xl">📋</div>
            <p className="mt-3 text-sm text-muted-foreground">No studies yet</p>
            <Link
              to="/upload"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Upload Your First Study
            </Link>
          </div>
        )}

        {!loading && !error && studies.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Study ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Species</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Subjects</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {studies.map((study) => (
                  <tr key={study.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{study.studyId}</td>
                    <td className="px-4 py-3 text-foreground">{study.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[study.status]}`}
                      >
                        {STATUS_LABELS[study.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{study.species ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {study.subjectCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(study.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
