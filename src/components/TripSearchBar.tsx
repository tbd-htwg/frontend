import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getSuggestPrefixToken,
  matchSuggestTail,
  parseTripSearchQuery,
  serializeTripSearchQuery,
  type ParsedFacet,
} from '../search/parseTripSearchQuery'
import type { FacetFilterSuggestResponse, SearchSuggestion } from '../types/api'
import { fetchFilterSuggestions } from '../api/search'
import { ApiError } from '../api/client'

const EMPTY_BUNDLE: FacetFilterSuggestResponse = {
  transports: [],
  locations: [],
  accommodations: [],
}

const SUGGEST_DEBOUNCE_MS = 300

const FACET_WRAP: Record<string, string> = {
  transport: 'border-sky-300 bg-sky-50',
  location: 'border-emerald-300 bg-emerald-50',
  accommodation: 'border-amber-300 bg-amber-50',
  destination: 'border-violet-300 bg-violet-50',
  user: 'border-slate-300 bg-slate-100',
}

const VALUE_CHIP: Record<string, string> = {
  transport: 'bg-sky-200 text-sky-950',
  location: 'bg-emerald-200 text-emerald-950',
  accommodation: 'bg-amber-200 text-amber-950',
  destination: 'bg-violet-200 text-violet-950',
  user: 'bg-slate-200 text-slate-900',
}

function bundleHitCount(b: FacetFilterSuggestResponse): number {
  return (
    b.transports.length + b.locations.length + b.accommodations.length
  )
}

function colonSuggestions(
  bundle: FacetFilterSuggestResponse,
  kind: 'transport' | 'location' | 'accommodation',
): SearchSuggestion[] {
  switch (kind) {
    case 'transport':
      return bundle.transports
    case 'location':
      return bundle.locations
    case 'accommodation':
      return bundle.accommodations
  }
}

type Props = {
  value: string
  onChange: (q: string) => void
}

export function TripSearchBar({ value, onChange }: Props) {
  const { facets, freeText } = parseTripSearchQuery(value)
  const [filterBundle, setFilterBundle] =
    useState<FacetFilterSuggestResponse>(EMPTY_BUNDLE)
  const [panelDismissed, setPanelDismissed] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const ctx = matchSuggestTail(freeText)
  const prefixToken = useMemo(() => getSuggestPrefixToken(freeText), [freeText])

  const fetchSuggestions = useCallback(async () => {
    setSuggestError(null)
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    try {
      if (ctx) {
        const data = await fetchFilterSuggestions(ctx.prefix, {
          signal: ac.signal,
          scope: ctx.kind,
        })
        if (!ac.signal.aborted) setFilterBundle(data)
        return
      }
      if (!prefixToken || prefixToken.length < 2) {
        if (!ac.signal.aborted) setFilterBundle(EMPTY_BUNDLE)
        return
      }
      const data = await fetchFilterSuggestions(prefixToken, { signal: ac.signal })
      if (!ac.signal.aborted) setFilterBundle(data)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setFilterBundle(EMPTY_BUNDLE)
      if (e instanceof ApiError) setSuggestError(e.message)
    }
  }, [ctx, prefixToken])

  const panelOpen = bundleHitCount(filterBundle) > 0

  useEffect(() => {
    setPanelDismissed(false)
  }, [freeText])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchSuggestions()
    }, SUGGEST_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [fetchSuggestions])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setPanelDismissed(true)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function removeFacet(index: number) {
    const next = facets.filter((_, i) => i !== index)
    onChange(serializeTripSearchQuery(next, freeText))
  }

  function setFreeText(nextTail: string) {
    onChange(serializeTripSearchQuery(facets, nextTail))
  }

  /**
   * Add strict facet and drop the last free-text token when it matches the chosen value
   * (same word the user typed for suggests).
   */
  function applyFacetPick(facetKey: string, label: string) {
    const value = label.toLowerCase()
    const withoutTrailing = freeText.replace(/\s+$/, '')
    const tokens = withoutTrailing.split(/\s+/).filter(Boolean)
    const last = tokens[tokens.length - 1]?.toLowerCase()
    const remainder =
      tokens.length > 0 && last === value
        ? tokens.slice(0, -1).join(' ')
        : withoutTrailing
    const trailingSpace = freeText.slice(withoutTrailing.length)
    onChange(
      serializeTripSearchQuery(
        [...facets, { key: facetKey, value }],
        remainder + trailingSpace,
      ),
    )
    setPanelDismissed(true)
    setFilterBundle(EMPTY_BUNDLE)
  }

  /** Complete {@code transport:pre} style tail (colon mode). */
  function applySuggestion(item: SearchSuggestion) {
    if (!ctx) return
    const label = item.label.toLowerCase()
    const before = freeText.slice(0, ctx.replaceFrom)
    const key =
      ctx.kind === 'transport'
        ? 'transport'
        : ctx.kind === 'location'
          ? 'location'
          : 'accommodation'
    const completed = `${before}${key}:${label} `
    onChange(serializeTripSearchQuery(facets, completed))
    setPanelDismissed(true)
    setFilterBundle(EMPTY_BUNDLE)
  }

  const visiblePanel = panelOpen && !panelDismissed

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && freeText === '' && facets.length > 0) {
      e.preventDefault()
      removeFacet(facets.length - 1)
    }
    if (e.key === 'Escape') setPanelDismissed(true)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <div
        className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1.5 shadow-sm focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-200"
        role="search"
      >
        {facets.map((f: ParsedFacet, i: number) => (
          <FacetPill key={`${f.key}:${f.value}:${i}`} facet={f} onRemove={() => removeFacet(i)} />
        ))}
        <input
          type="text"
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setPanelDismissed(false)}
          placeholder={
            facets.length === 0 && !freeText
              ? 'Search or filter: transport:train location:Paris …'
              : ''
          }
          aria-label="Trip search and filters"
          aria-autocomplete="list"
          aria-expanded={visiblePanel}
          className="min-w-[12rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-400"
        />
      </div>
      {suggestError && (
        <p className="mt-1 text-xs text-amber-700">{suggestError}</p>
      )}
      {visiblePanel &&
        (ctx ? (
          <ul
            className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
            role="listbox"
          >
            {colonSuggestions(filterBundle, ctx.kind).map((s) => (
              <li key={`${ctx.kind}-${s.id}`}>
                <button
                  type="button"
                  role="option"
                  className="flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySuggestion(s)}
                >
                  <span className="font-medium text-slate-900">{s.label}</span>
                  {s.secondary ? (
                    <span className="truncate text-slate-500">{s.secondary}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div
            className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-md border border-slate-200 bg-white py-2 shadow-lg"
            role="listbox"
          >
            {filterBundle.locations.length > 0 && (
              <SuggestSection title="Locations">
                {filterBundle.locations.map((s) => (
                  <SuggestRow
                    key={`loc-${s.id}`}
                    monoTitle={`location:${s.label.toLowerCase()}`}
                    primary={s.label}
                    secondary={s.secondary}
                    onPick={() => applyFacetPick('location', s.label)}
                  />
                ))}
              </SuggestSection>
            )}
            {filterBundle.transports.length > 0 && (
              <SuggestSection title="Transport">
                {filterBundle.transports.map((s) => (
                  <SuggestRow
                    key={`tr-${s.id}`}
                    monoTitle={`transport:${s.label.toLowerCase()}`}
                    primary={s.label}
                    secondary={s.secondary}
                    onPick={() => applyFacetPick('transport', s.label)}
                  />
                ))}
              </SuggestSection>
            )}
            {filterBundle.accommodations.length > 0 && (
              <SuggestSection title="Accommodations">
                {filterBundle.accommodations.map((s) => (
                  <SuggestRow
                    key={`ac-${s.id}`}
                    monoTitle={`accommodation:${s.label.toLowerCase()}`}
                    primary={s.label}
                    secondary={s.secondary}
                    onPick={() => applyFacetPick('accommodation', s.label)}
                  />
                ))}
              </SuggestSection>
            )}
          </div>
        ))}
    </div>
  )
}

function SuggestSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
      <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  )
}

function SuggestRow({
  monoTitle,
  primary,
  secondary,
  onPick,
}: {
  monoTitle: string
  primary: string
  secondary?: string | null
  onPick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        role="option"
        className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-slate-100"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onPick}
      >
        <span className="font-mono text-xs font-medium text-slate-700">{monoTitle}</span>
        <span className="flex flex-wrap items-baseline gap-2">
          <span className="font-medium text-slate-900">{primary}</span>
          {secondary ? (
            <span className="truncate text-slate-500">{secondary}</span>
          ) : null}
        </span>
      </button>
    </li>
  )
}

function FacetPill({
  facet,
  onRemove,
}: {
  facet: ParsedFacet
  onRemove: () => void
}) {
  const wrap = FACET_WRAP[facet.key] ?? 'border-slate-300 bg-slate-50'
  const chip = VALUE_CHIP[facet.key] ?? 'bg-slate-200 text-slate-900'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs ${wrap}`}
    >
      <span className="text-slate-600">{facet.key}:</span>
      <span className={`rounded px-1 font-medium ${chip}`}>{facet.value}</span>
      <button
        type="button"
        className="ml-0.5 rounded px-0.5 text-slate-500 hover:bg-black/5 hover:text-slate-800"
        aria-label={`Remove ${facet.key} filter`}
        onClick={onRemove}
      >
        ×
      </button>
    </span>
  )
}
