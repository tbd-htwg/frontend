import type { HalCollection, HalEntity, PaginatedResponse } from '../types/api'

export function idFromHref(href: string | undefined): number {
  if (!href) return NaN
  const path = href.split('?')[0].replace(/\{.*$/, '').replace(/\/$/, '')
  const raw = path.split('/').at(-1)
  if (!raw) return NaN
  const direct = Number(raw)
  if (Number.isFinite(direct)) return direct
  const match = raw.match(/(\d+)$/)
  if (!match) return NaN
  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : NaN
}

export function idFromEntity<T>(entity: HalEntity<T>): number {
  return idFromHref(entity._links?.self?.href)
}

/** Last path segment of `self` href — use for Firestore-backed HAL resources with non-numeric ids. */
export function documentIdFromSelfHref(href: string | undefined): string {
  if (!href) return ''
  try {
    const pathOnly = href.split('?')[0].replace(/\{.*$/, '').replace(/\/$/, '')
    const segment = pathOnly.split('/').filter(Boolean).at(-1)
    return segment ? decodeURIComponent(segment) : ''
  } catch {
    return ''
  }
}

export function hrefForResource(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

export function pathFromHref(href: string): string {
  const cleaned = href.replace(/\{.*$/, '').split('?')[0]
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return new URL(cleaned).pathname
  }
  return cleaned
}

export function embeddedItems<T>(
  model: HalCollection<T> | undefined,
  key: string,
): T[] {
  if (!model?._embedded) return []
  const value = model._embedded[key]
  return Array.isArray(value) ? value : []
}

export function paginatedItems<T>(
  model: HalCollection<T> | undefined,
  key: string,
): PaginatedResponse<T> {
  const items = embeddedItems(model, key)
  const page = model?.page

  return {
    items,
    currentPage: (page?.number ?? 0) + 1,
    pageSize: page?.size ?? items.length,
    totalItems: page?.totalElements ?? items.length,
    totalPages: page?.totalPages ?? 1,
  }
}
