/** Browser-restricted Maps JavaScript API key (separate from server GOOGLE_MAPS_API_KEY). */
export function getGoogleMapsApiKey(): string | undefined {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key || !key.trim()) return undefined
  return key.trim()
}

export function isGoogleMapsConfigured(): boolean {
  return getGoogleMapsApiKey() != null
}
