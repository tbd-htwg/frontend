import { ApiError } from '../api/client'

export type PlaceSearchErrorKind = 'bad_request' | 'unavailable' | 'upstream' | 'generic'

export type PlaceSearchError = {
  kind: PlaceSearchErrorKind
  message: string
}

function messageFromApiBody(body?: string): string | undefined {
  if (!body) return undefined
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string }
    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message.trim()
    }
    if (typeof parsed.error === 'string' && parsed.error.trim()) {
      return parsed.error.trim()
    }
  } catch {
    /* plain text body */
  }
  const trimmed = body.trim()
  return trimmed.length > 0 && trimmed.length < 500 ? trimmed : undefined
}

/** Maps failed place search / enrichment calls to user-facing dropdown messages. */
export function placeSearchErrorFromStatus(
  status: number,
  body?: string,
): PlaceSearchError {
  const detail = messageFromApiBody(body)
  switch (status) {
    case 400:
      return {
        kind: 'bad_request',
        message:
          detail ??
          'That place could not be found. Choose another result or try a different search.',
      }
    case 503:
      return {
        kind: 'unavailable',
        message:
          detail ??
          'Place search is temporarily unavailable (Google Places). Check the API key and try again later.',
      }
    case 502:
      return {
        kind: 'upstream',
        message:
          detail ??
          'Could not reach the place lookup service. Retry in a moment.',
      }
    default:
      return {
        kind: 'generic',
        message: detail ?? 'Place search failed. Try again.',
      }
  }
}

export function placeSearchErrorFromUnknown(err: unknown): PlaceSearchError {
  if (err instanceof ApiError) {
    return placeSearchErrorFromStatus(err.status, err.body)
  }
  if (err instanceof Error && err.message.trim()) {
    return { kind: 'generic', message: err.message.trim() }
  }
  return { kind: 'generic', message: 'Place search failed. Try again.' }
}

export function placeSearchErrorPanelClass(kind: PlaceSearchErrorKind): string {
  switch (kind) {
    case 'bad_request':
      return 'border-amber-200 bg-amber-50 text-amber-900'
    case 'unavailable':
    case 'upstream':
      return 'border-red-200 bg-red-50 text-red-800'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700'
  }
}
