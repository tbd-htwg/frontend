/** Empty string uses same-origin `/v1` (Vite dev proxy; Caddy in production). Otherwise full base URL without trailing slash. */
export function getApiBaseUrl(): string {
  const v = import.meta.env.VITE_API_BASE_URL
  if (v === '') return ''
  return (v ?? '').replace(/\/$/, '')
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
  const url = `${base}${path}`
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
