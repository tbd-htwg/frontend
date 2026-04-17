/**
 * Unset/empty uses same-origin `/api/v2` (Vite dev proxy; Caddy in production).
 * For absolute URLs, if no path is provided, `/api/v2` is appended automatically.
 */
export function getApiBaseUrl(): string {
  const v = import.meta.env.VITE_API_BASE_URL
  if (v === '' || v == null) return '/api/v2'

  const normalized = v.replace(/\/$/, '')
  if (!/^https?:\/\//.test(normalized)) return normalized

  const parsed = new URL(normalized)
  const parsedPath = parsed.pathname.replace(/\/$/, '')
  const basePath = !parsedPath || parsedPath === '/' ? '/api/v2' : parsedPath
  return `${parsed.origin}${basePath}`
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const base = getApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  let url: string

  if (/^https?:\/\//.test(path)) {
    url = path
  } else if (!base) {
    url = normalizedPath
  } else if (normalizedPath.startsWith('/api/search')) {
    if (/^https?:\/\//.test(base)) {
      const baseUrl = new URL(base)
      url = `${baseUrl.origin}${normalizedPath}`
    } else {
      url = normalizedPath
    }
  } else if (/^https?:\/\//.test(base)) {
    const baseUrl = new URL(base)
    const basePath = baseUrl.pathname.replace(/\/$/, '')
    if (normalizedPath === basePath || normalizedPath.startsWith(`${basePath}/`)) {
      url = `${baseUrl.origin}${normalizedPath}`
    } else {
      url = `${base}${normalizedPath}`
    }
  } else if (normalizedPath === base || normalizedPath.startsWith(`${base}/`)) {
    url = normalizedPath
  } else {
    url = `${base}${normalizedPath}`
  }

  const res = await fetch(url, init)
  if (!res.ok) {
    const errText = await res.text()
    throw new ApiError(
      errText || res.statusText || 'Request failed',
      res.status,
      errText,
    )
  }
  return res
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await request(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (res.status === 204) return undefined as T
  return parseJson<T>(res)
}

export async function requestVoid(path: string, init?: RequestInit): Promise<void> {
  await request(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
}

export async function requestText(
  path: string,
  init?: RequestInit,
): Promise<string> {
  const res = await request(path, init)
  if (res.status === 204) return ''
  return res.text()
}
