import type { TransportResponse } from '../types/api'

export function transportRouteLabel(t: TransportResponse): string {
  if (t.startAddress && t.endAddress) return `${t.startAddress} → ${t.endAddress}`
  if (t.startAddress) return t.startAddress
  if (t.endAddress) return t.endAddress
  return `Transport #${t.id}`
}
