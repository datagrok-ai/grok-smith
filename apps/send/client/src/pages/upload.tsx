import { useCallback, useRef, useState } from 'react'

import { PageLayout, useDatagrok } from '@datagrok/app-kit'

import { nav } from '../nav'

import type { ImportResult } from '../../../shared/types'

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; filename: string }
  | { status: 'success'; result: ImportResult }
  | { status: 'error'; message: string }

export default function UploadPage() {
  const { currentUser } = useDatagrok()
  const [state, setState] = useState<UploadState>({ status: 'idle' })
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = useCallback(
    async (file: File) => {
      setState({ status: 'uploading', filename: file.name })

      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/studies/upload', {
          method: 'POST',
          headers: { 'X-User-Id': currentUser.id },
          body: formData,
        })

        if (!res.ok) {
          const body = (await res.json()) as { message?: string }
          throw new Error(body.message ?? `Upload failed (${String(res.status)})`)
        }

        const result = (await res.json()) as ImportResult
        setState({ status: 'success', result })
      } catch (err) {
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Upload failed',
        })
      }
    },
    [currentUser.id],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        void upload(file)
      }
    },
    [upload],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        void upload(file)
      }
    },
    [upload],
  )

  const reset = useCallback(() => {
    setState({ status: 'idle' })
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [])

  return (
    <PageLayout title="Upload SEND Dataset" nav={nav}>
      <div className="mx-auto max-w-2xl space-y-6">
        {state.status === 'idle' && (
          <div
            role="button"
            tabIndex={0}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-16 text-center transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                inputRef.current?.click()
              }
            }}
          >
            <div className="text-4xl">📦</div>
            <p className="mt-4 text-lg font-medium text-foreground">
              Drop a .zip file here
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              or click to browse — zip should contain XPT files from a SEND study
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {state.status === 'uploading' && (
          <div className="flex flex-col items-center rounded-lg border border-border p-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-lg font-medium text-foreground">
              Importing study...
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {state.filename}
            </p>
          </div>
        )}

        {state.status === 'success' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted p-6">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Study imported successfully
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {state.result.studyCode} — {state.result.studyTitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Study ID</p>
                <p className="mt-1 font-mono text-sm text-foreground">
                  {state.result.studyId}
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Subjects</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {state.result.subjectCount}
                </p>
              </div>
            </div>

            {Object.keys(state.result.domainCounts).length > 0 && (
              <div className="rounded-lg border border-border p-4">
                <p className="mb-3 text-sm font-medium text-foreground">
                  Domain Counts
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(state.result.domainCounts)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([domain, count]) => (
                      <div
                        key={domain}
                        className="flex items-center justify-between rounded bg-muted px-3 py-1.5"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {domain}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={reset}
            >
              Upload Another
            </button>
          </div>
        )}

        {state.status === 'error' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
              <div className="flex items-start gap-3">
                <div className="text-2xl">❌</div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Import failed
                  </h3>
                  <p className="mt-1 text-sm text-destructive">
                    {state.message}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={reset}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
