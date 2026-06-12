import { useEffect, useState } from 'react'
import { isDemoMode } from '../demo/demoMode'
import { mockTenantStore } from '../mocks/mockTenantStore'

/** Re-render when mock store mutates (provisioning simulation). */
export function useMockTenantRefresh(): number {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isDemoMode()) return undefined
    return mockTenantStore.subscribe(() => setTick((t) => t + 1))
  }, [])

  return tick
}
