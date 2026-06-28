import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheck,
  faCircleNotch,
  faClock,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import type { ProvisioningStep } from '../../types/tenant'

function StepIcon({ status }: { status: ProvisioningStep['status'] }) {
  if (status === 'done') {
    return <FontAwesomeIcon icon={faCheck} className="text-emerald-700" aria-hidden />
  }
  if (status === 'running') {
    return <FontAwesomeIcon icon={faCircleNotch} spin className="text-blue-700" aria-hidden />
  }
  if (status === 'failed') {
    return <FontAwesomeIcon icon={faXmark} className="text-red-700" aria-hidden />
  }
  return <FontAwesomeIcon icon={faClock} className="text-slate-400" aria-hidden />
}

const stepCardClass: Record<ProvisioningStep['status'], string> = {
  running: 'border-blue-300 bg-blue-50',
  failed: 'border-red-300 bg-red-50',
  done: 'border-emerald-200 bg-emerald-50',
  pending: 'border-slate-200 bg-white',
}

const stepStatusTextClass: Record<ProvisioningStep['status'], string> = {
  running: 'text-blue-700',
  failed: 'text-red-700',
  done: 'text-emerald-700',
  pending: 'text-slate-500',
}

export function ProvisioningTimeline({ steps }: { steps: ProvisioningStep[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step) => (
        <li
          key={step.key}
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${stepCardClass[step.status]}`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center">
            <StepIcon status={step.status} />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-900">{step.label}</p>
            <p className={`text-xs capitalize ${stepStatusTextClass[step.status]}`}>{step.status}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
