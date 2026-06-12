export function readJwtClaim(token: string | null, claim: string): unknown {
  if (!token) return undefined
  const parts = token.split('.')
  if (parts.length < 2) return undefined
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const json = atob(padded)
    const payload = JSON.parse(json) as Record<string, unknown>
    return payload[claim]
  } catch {
    return undefined
  }
}

export function isPlatformAdminToken(token: string | null): boolean {
  return readJwtClaim(token, 'platform_admin') === true
}
