import { SESSION_STORAGE_KEY } from '../auth/sessionStorageKey'

/** In-memory token from AuthContext (avoids sessionStorage races during login / authMe). */
let apiAccessToken: string | null = null

/** From tenant public-config; when false, trip feed/search require Bearer for logged-in users. */
let tenantPublicTripAccess = true

export function setApiAccessToken(token: string | null): void {
  apiAccessToken = token
}

export function setTenantPublicTripAccess(publicAccess: boolean): void {
  tenantPublicTripAccess = publicAccess
}

function bearerToken(): string | undefined {
  if (apiAccessToken) return apiAccessToken
  return bearerFromSessionStorage()
}

function bearerFromSessionStorage(): string | undefined {
  if (typeof sessionStorage === 'undefined') return undefined
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as { accessToken?: unknown }
    return typeof parsed.accessToken === 'string' ? parsed.accessToken : undefined
  } catch {
    return undefined
  }
}

/** Strip query string and optional `/api/v2` prefix so path rules match `request()` inputs. */
export function normalizeApiPath(path: string): string {
  const pathname = (path.split('?')[0] ?? path).replace(/\/$/, '') || '/'
  if (pathname === '/api/v2') return '/'
  if (pathname.startsWith('/api/v2/')) return pathname.slice('/api/v2'.length) || '/'
  return pathname
}

/**
 * Public GET/HEAD routes that must work without a Bearer token (including stale tokens left in
 * sessionStorage). Do not send Authorization on these paths.
 */
export function isAnonymousPublicRead(path: string, method = 'GET'): boolean {
  const verb = method.toUpperCase()
  if (verb !== 'GET' && verb !== 'HEAD') return false

  const p = normalizeApiPath(path)
  // Login-gated tenants: feed/search need Bearer when the user is signed in.
  if (!tenantPublicTripAccess && (p.startsWith('/api/search') || p.startsWith('/trips/feed'))) {
    return false
  }
  if (p.startsWith('/api/search')) return true
  if (p.startsWith('/external/')) return true
  if (p === '/trips/feed-location-images') return false
  if (p === '/trips/feed/by-user') return false
  if (/^\/trips\/\d+\/detail$/.test(p)) return false
  if (p.startsWith('/trips/feed')) return true
  if (/^\/trips\/\d+\/community$/.test(p)) return true
  if (/^\/trips\/\d+\/comments$/.test(p)) return true
  if (/^\/trips\/\d+\/custom-fields$/.test(p)) return true
  if (p === '/trips/search/countLikes') return true
  if (/^\/users\/\d+\/profile$/.test(p)) return true
  if (/^\/users\/\d+\/likedTrips\/\d+$/.test(p)) return true
  if (/^\/tenants\/[^/]+\/public-config$/.test(p)) return true
  if (/^\/tenants\/[^/]+\/users$/.test(p)) return true
  return false
}

/** Whether to attach the session Bearer token (mutations, auth, optional-auth image batches). */
export function shouldAttachBearer(path: string, method = 'GET'): boolean {
  return !isAnonymousPublicRead(path, method)
}

/** GCS V4 signed URLs authenticate via query params; never send Bearer (breaks CORS preflight). */
export function isGcsSignedStorageUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith('http') ? url : resolveApiUrl(url))
    return (
      parsed.hostname === 'storage.googleapis.com' ||
      parsed.hostname.endsWith('.storage.googleapis.com')
    )
  } catch {
    return false
  }
}

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
  if (isTenantHost(windowLocationHostname()) && parsed.hostname !== windowLocationHostname()) {
    return '/api/v2'
  }
  const parsedPath = parsed.pathname.replace(/\/$/, '')
  const basePath = !parsedPath || parsedPath === '/' ? '/api/v2' : parsedPath
  return `${parsed.origin}${basePath}`
}

function windowLocationHostname(): string {
  return typeof window === 'undefined' ? '' : window.location.hostname
}

function isTenantHost(hostname: string): boolean {
  if (!hostname) return false

  const hostBase = import.meta.env.VITE_PLATFORM_HOST_BASE ?? 'k8s.tbd-htwg.de'
  const enterpriseHostBase =
    import.meta.env.VITE_PLATFORM_ENTERPRISE_HOST_BASE ?? `enterprise.${hostBase}`

  return (
    isSubdomainOf(hostname, hostBase) ||
    isSubdomainOf(hostname, enterpriseHostBase)
  )
}

function isSubdomainOf(hostname: string, base: string): boolean {
  return hostname !== base && hostname.endsWith(`.${base}`)
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

/** Same URL resolution as {@link request}. */
export function resolveApiUrl(path: string): string {
  const base = getApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (/^https?:\/\//.test(path)) {
    return path
  }
  if (!base) {
    return normalizedPath
  }
  if (normalizedPath.startsWith('/api/search')) {
    if (/^https?:\/\//.test(base)) {
      const baseUrl = new URL(base)
      return `${baseUrl.origin}${normalizedPath}`
    }
    return normalizedPath
  }
  if (/^https?:\/\//.test(base)) {
    const baseUrl = new URL(base)
    const basePath = baseUrl.pathname.replace(/\/$/, '')
    if (normalizedPath === basePath || normalizedPath.startsWith(`${basePath}/`)) {
      return `${baseUrl.origin}${normalizedPath}`
    }
    return `${base}${normalizedPath}`
  }
  if (normalizedPath === base || normalizedPath.startsWith(`${base}/`)) {
    return normalizedPath
  }
  return `${base}${normalizedPath}`
}

async function request(
  path: string,
  init?: RequestInit,
  options?: { forceBearer?: boolean; anonymous?: boolean },
): Promise<Response> {
  const headers = new Headers(init?.headers)
  if (init?.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const method = init?.method ?? 'GET'
  const attach =
    options?.anonymous === true
      ? false
      : options?.forceBearer === true || shouldAttachBearer(path, method)
  const token = attach ? bearerToken() : undefined
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const url = resolveApiUrl(path)
  const res = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
    credentials: 'omit',
  })
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

/**
 * HEAD request: backend exposes membership checks (e.g. likedTrips) via 204 vs 404 only for HEAD,
 * not GET — GET would miss {@code LikeController} and fall through to security/SDR (often 401).
 */
export async function getExists(path: string): Promise<boolean> {
  const headers = new Headers()
  const token = shouldAttachBearer(path, 'HEAD') ? bearerToken() : undefined
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(resolveApiUrl(path), {
    method: 'HEAD',
    headers,
    cache: 'no-store',
    credentials: 'omit',
  })
  if (res.status === 404) return false
  if (res.ok) return true
  const errText = await res.text()
  throw new ApiError(
    errText || res.statusText || 'Request failed',
    res.status,
    errText,
  )
}

/** GET with Bearer token from session (no default Content-Type). */
export async function authorizedGet(path: string): Promise<Response> {
  const headers = new Headers()
  const token = bearerToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(resolveApiUrl(path), {
    method: 'GET',
    headers,
    cache: 'no-store',
    credentials: 'omit',
  })
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
  options?: { forceBearer?: boolean; anonymous?: boolean },
): Promise<T> {
  const res = await request(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  }, options)
  if (res.status === 204) return undefined as T
  return parseJson<T>(res)
}

export async function requestVoid(
  path: string,
  init?: RequestInit,
  options?: { forceBearer?: boolean; anonymous?: boolean },
): Promise<void> {
  await request(
    path,
    {
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    },
    options,
  )
}

export async function requestText(
  path: string,
  init?: RequestInit,
): Promise<string> {
  const res = await request(path, init)
  if (res.status === 204) return ''
  return res.text()
}

export async function uploadFileToSignedUrl(
  uploadUrl: string,
  file: File,
  contentType: string,
): Promise<string | undefined> {
  const headers = new Headers({
    'Content-Type': contentType,
  })
  const authPath = uploadUrl.startsWith('http')
    ? new URL(uploadUrl).pathname
    : uploadUrl
  if (
    !isGcsSignedStorageUrl(uploadUrl) &&
    shouldAttachBearer(authPath, 'PUT')
  ) {
    const token = bearerToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  const url = /^https?:\/\//.test(uploadUrl) ? uploadUrl : resolveApiUrl(uploadUrl)
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: file,
    cache: 'no-store',
    credentials: 'omit',
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new ApiError(
      errText || res.statusText || 'Signed upload failed',
      res.status,
      errText,
    )
  }
  const text = await res.text()
  if (!text) return undefined
  try {
    const json = JSON.parse(text) as { signedReadUrl?: unknown }
    return typeof json.signedReadUrl === 'string' ? json.signedReadUrl : undefined
  } catch {
    return undefined
  }
}
