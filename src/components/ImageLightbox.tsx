import { useCallback, useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight, faXmark } from '@fortawesome/free-solid-svg-icons'

export type LightboxImage = {
  url: string
  alt: string
  caption?: string
}

type ImageLightboxProps = {
  images: LightboxImage[]
  initialIndex: number
  open: boolean
  onClose: () => void
}

export function ImageLightbox({ images, initialIndex, open, onClose }: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const touchStartX = useRef<number | null>(null)
  const n = images.length
  const safeIndex = n > 0 ? ((index % n) + n) % n : 0
  const current = images[safeIndex]

  useEffect(() => {
    if (open) setIndex(initialIndex)
  }, [open, initialIndex])

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  const goNext = useCallback(() => {
    if (n <= 1) return
    setIndex((i) => (i + 1) % n)
  }, [n])

  const goPrev = useCallback(() => {
    if (n <= 1) return
    setIndex((i) => (i - 1 + n) % n)
  }, [n])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, goNext, goPrev])

  if (!open || !current) return null

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/90"
        aria-label="Close image viewer"
        onClick={onClose}
      />
      <div className="relative z-10 flex h-full flex-col">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <FontAwesomeIcon icon={faXmark} className="h-5 w-5" aria-hidden />
        </button>

        <div
          className="relative flex flex-1 items-center justify-center px-4 py-16 sm:px-16"
          role="region"
          aria-roledescription="carousel"
          aria-label="Location photos"
          onTouchStart={(e) => {
            touchStartX.current = e.changedTouches[0]?.clientX ?? null
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current
            touchStartX.current = null
            const end = e.changedTouches[0]?.clientX
            if (start == null || end == null || n <= 1) return
            const dx = end - start
            if (dx < -48) goNext()
            else if (dx > 48) goPrev()
          }}
        >
          <img
            src={current.url}
            alt={current.alt}
            className="max-h-[85vh] max-w-full object-contain"
          />

          {n > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-4"
              >
                <FontAwesomeIcon icon={faChevronRight} className="h-5 w-5" aria-hidden />
              </button>
            </>
          ) : null}
        </div>

        <div className="pointer-events-none absolute bottom-6 left-0 right-0 z-20 text-center text-sm text-white/90">
          {current.caption ? (
            <p className="mb-1 font-medium">{current.caption}</p>
          ) : null}
          {n > 1 ? (
            <p>
              {safeIndex + 1} of {n}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
