/**
 * Mirrors backend {@code SearchQueryParser}: space-separated tokens; {@code key:value} facets
 * (values without whitespace).
 */
const FACET_TOKEN =
  /^(transport|location|accommodation|accomodation|destination|user|author):([^:\s]+)$/i

export type ParsedFacet = { key: string; value: string }

/** Canonical facet keys for serialization (matches backend normalization). */
export function canonicalFacetKey(rawKey: string): string {
  const x = rawKey.toLowerCase()
  if (x === 'author' || x === 'user') return 'user'
  if (x === 'accomodation') return 'accommodation'
  return x
}

export function parseTripSearchQuery(q: string): { facets: ParsedFacet[]; freeText: string } {
  if (!q) {
    return { facets: [], freeText: '' }
  }
  /** Trailing spaces must survive round-trip so users can type multiple words. */
  const trailingMatch = q.match(/\s+$/)
  const trailingWs = trailingMatch ? trailingMatch[0] : ''
  const core = trailingWs ? q.slice(0, q.length - trailingWs.length) : q
  if (!core.trim()) {
    return { facets: [], freeText: q }
  }

  const facets: ParsedFacet[] = []
  const freeParts: string[] = []
  for (const token of core.trim().split(/\s+/)) {
    const m = token.match(FACET_TOKEN)
    if (m) {
      facets.push({
        key: canonicalFacetKey(m[1]),
        value: m[2].toLowerCase(),
      })
    } else {
      freeParts.push(token)
    }
  }
  const freeCore = freeParts.join(' ')
  const freeText = freeCore + trailingWs
  return { facets, freeText }
}

export function serializeTripSearchQuery(facets: ParsedFacet[], freeText: string): string {
  const facetTokens = facets.map((f) => `${f.key}:${f.value}`)
  const parts = [...facetTokens]
  if (freeText.length > 0) parts.push(freeText)
  return parts.join(' ')
}

const RESERVED_FACET_KEYS = new Set([
  'transport',
  'location',
  'accommodation',
  'accomodation',
  'destination',
  'user',
  'author',
])

/**
 * Last whitespace-delimited token in free text, for bundled `/suggest/filters` prefix.
 * Returns null when not suitable (colon context handled separately via {@link matchSuggestTail}).
 */
export function getSuggestPrefixToken(freeText: string): string | null {
  const withoutTrailing = freeText.replace(/\s+$/, '')
  if (!withoutTrailing) return null
  if (/:$/.test(withoutTrailing)) return null
  const tokens = withoutTrailing.split(/\s+/).filter(Boolean)
  const last = tokens[tokens.length - 1]
  if (!last || last.includes(':')) return null
  if (RESERVED_FACET_KEYS.has(last.toLowerCase())) return null
  return last
}

/** Detect incomplete suggest tail: {@code transport:pre} at end of free text. */
export type SuggestKind = 'transport' | 'location' | 'accommodation'

export function matchSuggestTail(freeText: string): {
  kind: SuggestKind
  prefix: string
  replaceFrom: number
} | null {
  const re =
    /(transport|location|accommodation|accomodation):([^:\s]*)$/i
  const m = freeText.match(re)
  if (!m) return null
  const kindRaw = m[1].toLowerCase()
  const kind: SuggestKind | null =
    kindRaw === 'transport'
      ? 'transport'
      : kindRaw === 'location'
        ? 'location'
        : kindRaw === 'accommodation' || kindRaw === 'accomodation'
          ? 'accommodation'
          : null
  if (!kind) return null
  const replaceFrom = freeText.length - m[0].length
  return { kind, prefix: m[2] ?? '', replaceFrom }
}
