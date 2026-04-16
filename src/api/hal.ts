import type { HalCollection, HalEntity, PaginatedResponse } from '../types/api'

export function idFromHref(href: string | undefined): number {
  if (!href) return NaN
  const cleaned = href.replace(/\/$/, '')
  const raw = cleaned.split('/').at(-1)
  const id = Number(raw)
  return Number.isFinite(id) ? id : NaN
}

export function idFromEntity<T>(entity: HalEntity<T>): number {
  return idFromHref(entity._links?.self?.href)
}

export function hrefForResource(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

export function pathFromHref(href: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return new URL(href).pathname
  }
  return href
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
