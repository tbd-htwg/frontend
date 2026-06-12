import { useEffect, useState } from 'react'
import { fetchPlatformInfo } from '../../api/tenants'
import { isDemoMode } from '../../demo/demoMode'

export function StubProvisioningBanner() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isDemoMode()) {
      setMessage('Demo mode — tenant data is mocked in the browser (no backend provisioning).')
      return
    }
    fetchPlatformInfo().then((info) => {
      if (info?.stubProvisioning) {
        setMessage(info.message)
      } else {
        setMessage(null)
      }
    })
  }, [])

  if (!message) return null

  return (
    <div
      className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      role="status"
    >
      <strong className="font-semibold">Stub provisioning:</strong> {message}
    </div>
  )
}
