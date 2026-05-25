import { ApiError } from '../api/client'

/** Extract a user-facing message from an API error (Spring problem JSON or plain text). */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) {
    if (error instanceof Error && error.message) {
      return error.message
    }
    return fallback
  }

  const raw = error.body?.trim() || error.message
  if (!raw) return fallback

  try {
    const parsed = JSON.parse(raw) as {
      message?: string
      error?: string
      detail?: string
    }
    if (parsed.message) return parsed.message
    if (parsed.detail) return parsed.detail
    if (parsed.error && parsed.error !== 'Not Found') return parsed.error
  } catch {
    // plain text or HTML
  }

  if (raw.length > 200) return fallback
  return raw
}
