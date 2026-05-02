import type { FacetFilterSuggestResponse, SearchSuggestion } from '../types/api'
import { requestJson } from './client'

export type FetchFilterSuggestionsOptions = RequestInit & {
  scope?: 'transport' | 'location' | 'accommodation'
  limit?: number
}

/** Aggregate Hibernate Search suggests for strict facet filters (one HTTP round-trip). */
export async function fetchFilterSuggestions(
  prefix: string,
  init?: FetchFilterSuggestionsOptions,
): Promise<FacetFilterSuggestResponse> {
  const params = new URLSearchParams()
  params.set('prefix', prefix)
  if (init?.scope) params.set('scope', init.scope)
  if (init?.limit != null) params.set('limit', String(init.limit))
  const { scope: _s, limit: _l, ...rest } = init ?? {}
  return requestJson<FacetFilterSuggestResponse>(
    `/api/search/suggest/filters?${params.toString()}`,
    { method: 'GET', ...rest },
  )
}

export async function suggestTransport(
  prefix: string,
  init?: RequestInit,
): Promise<SearchSuggestion[]> {
  const params = new URLSearchParams()
  if (prefix.trim()) params.set('prefix', prefix.trim())
  const q = params.toString()
  return requestJson<SearchSuggestion[]>(
    `/api/search/suggest/transport${q ? `?${q}` : ''}`,
    { method: 'GET', ...init },
  )
}

export async function suggestLocation(
  prefix: string,
  init?: RequestInit,
): Promise<SearchSuggestion[]> {
  const params = new URLSearchParams()
  if (prefix.trim()) params.set('prefix', prefix.trim())
  const q = params.toString()
  return requestJson<SearchSuggestion[]>(
    `/api/search/suggest/location${q ? `?${q}` : ''}`,
    { method: 'GET', ...init },
  )
}

export async function suggestAccommodation(
  prefix: string,
  init?: RequestInit,
): Promise<SearchSuggestion[]> {
  const params = new URLSearchParams()
  if (prefix.trim()) params.set('prefix', prefix.trim())
  const q = params.toString()
  return requestJson<SearchSuggestion[]>(
    `/api/search/suggest/accommodation${q ? `?${q}` : ''}`,
    { method: 'GET', ...init },
  )
}
