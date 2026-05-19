import { useEffect, useId, useRef, type ReactNode } from 'react'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  maxWidth?: 'lg' | '2xl'
}

const maxWidthClass = {
  lg: 'max-w-lg',
  '2xl': 'max-w-2xl',
} as const

/** Dropdown lists in modals use this so they paint above the dialog border. */
export const modalDropdownClassName =
  'absolute left-0 right-0 top-full z-[60] mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-slate-300 bg-white shadow-lg'

export function Modal({ open, title, onClose, children, maxWidth = 'lg' }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => panelRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4" role="presentation">
      <button
        type="button"
        className="fixed inset-0 bg-black/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={`relative z-10 w-full ${maxWidthClass[maxWidth]} overflow-visible rounded-lg border border-slate-300 bg-white p-6 shadow-xl outline-none`}
        >
          <h2 id={titleId} className="text-xl font-semibold text-slate-900">
            {title}
          </h2>
          <div className="mt-4 overflow-visible">{children}</div>
        </div>
      </div>
    </div>
  )
}
