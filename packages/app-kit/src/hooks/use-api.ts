import { useDatagrok } from '../adapter/datagrok-provider'
import { useApiBasePath } from './api-base-path'

export interface ApiError {
  error: string
  details?: Record<string, string>
}

export class ApiRequestError extends Error {
  status: number
  body: ApiError

  constructor(status: number, body: ApiError) {
    super(body.error)
    this.name = 'ApiRequestError'
    this.status = status
    this.body = body
  }
}

interface ApiMethods {
  get: <T>(path: string) => Promise<T>
  post: <T>(path: string, body?: unknown) => Promise<T>
  put: <T>(path: string, body?: unknown) => Promise<T>
  del: <T>(path: string) => Promise<T>
}

/**
 * Thin wrapper around fetch for API calls.
 * Prefixes paths with the API base path (default /api), handles JSON, and throws structured errors.
 */
export function useApi(): ApiMethods {
  const { currentUser } = useDatagrok()
  const basePath = useApiBasePath()

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = path.startsWith('/') ? `${basePath}${path}` : `${basePath}/${path}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-Id': currentUser.id,
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const errorBody = (await res.json().catch(() => ({
        error: `Request failed with status ${res.status.toString()}`,
      }))) as ApiError
      throw new ApiRequestError(res.status, errorBody)
    }

    return (await res.json()) as T
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
    del: <T>(path: string) => request<T>('DELETE', path),
  }
}
