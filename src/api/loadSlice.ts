export type SliceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: unknown }

export async function loadSlice<T>(fn: () => Promise<T>): Promise<SliceResult<T>> {
  try {
    const data = await fn()
    return { ok: true, data }
  } catch (error) {
    return { ok: false, error }
  }
}

export function sliceErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
