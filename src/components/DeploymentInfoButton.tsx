import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleInfo, faSpinner, faXmark } from '@fortawesome/free-solid-svg-icons'
import { getBackendDeploymentInfo, getFrontendVersionInfo } from '../api/deploymentInfo'
import type { BackendDeploymentInfo, FrontendVersionInfo } from '../api/deploymentInfo'

type InfoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'ready'
      frontend: FrontendVersionInfo
      backend: BackendDeploymentInfo
    }
  | { status: 'error'; message: string }

type DeploymentInfoButtonProps = {
  className?: string
}

export function DeploymentInfoButton({ className = '' }: DeploymentInfoButtonProps) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<InfoState>({ status: 'idle' })

  useEffect(() => {
    if (!open || state.status !== 'idle') return

    let cancelled = false
    setState({ status: 'loading' })
    Promise.all([getFrontendVersionInfo(), getBackendDeploymentInfo()])
      .then(([frontend, backend]) => {
        if (!cancelled) setState({ status: 'ready', frontend, backend })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Deployment info unavailable',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [open, state.status])

  return (
    <>
      <button
        type="button"
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md opacity-80 transition-[opacity,background-color] hover:bg-[color-mix(in_srgb,var(--tenant-surface-text)_14%,transparent)] hover:opacity-100 ${className}`}
        aria-label="Show deployment info"
        title="Deployment info"
        onClick={() => setOpen(true)}
      >
        <FontAwesomeIcon icon={faCircleInfo} className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deployment-info-title"
        >
          <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-5 text-slate-900 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h2 id="deployment-info-title" className="text-base font-semibold">
                Deployment info
              </h2>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close deployment info"
                onClick={() => setOpen(false)}
              >
                <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4">
              {state.status === 'loading' && (
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <FontAwesomeIcon icon={faSpinner} spin aria-hidden="true" />
                  Loading deployment info
                </p>
              )}
              {state.status === 'error' && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {state.message}
                </p>
              )}
              {state.status === 'ready' && <DeploymentInfoContent {...state} />}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DeploymentInfoContent({
  frontend,
  backend,
}: {
  frontend: FrontendVersionInfo
  backend: BackendDeploymentInfo
}) {
  const services = backend.services ?? {}

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-semibold text-slate-700">Frontend</h3>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <InfoRow label="Environment" value={frontend.environment} />
          <InfoRow label="Branch" value={frontend.branch} />
          <InfoRow label="Commit" value={frontend.shortCommit ?? shortHash(frontend.commit)} />
          <InfoRow label="Built" value={frontend.builtAt} />
        </dl>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-700">Backend</h3>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <InfoRow label="Environment" value={backend.environment} />
          <InfoRow label="Branch" value={backend.branch} />
          <InfoRow label="Commit" value={shortHash(backend.commit)} />
          <InfoRow label="Tenant" value={[backend.tier, backend.tenantId].filter(Boolean).join(' / ')} />
        </dl>
        <div className="mt-3 overflow-hidden rounded-md border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Service
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Image
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(services).map(([name, service]) => (
                <tr key={name}>
                  <td className="px-3 py-2 font-medium text-slate-700">
                    {name}
                    {service.enabled === false ? ' (disabled)' : ''}
                  </td>
                  <td className="break-all px-3 py-2 font-mono text-xs text-slate-600">
                    {service.image ?? service.tag ?? 'unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <dt className="text-xs font-medium uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 break-all font-mono text-xs text-slate-800">{value || 'unknown'}</dd>
    </div>
  )
}

function shortHash(value?: string) {
  return value ? value.slice(0, 12) : undefined
}
