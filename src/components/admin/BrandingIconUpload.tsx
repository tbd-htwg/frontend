import { useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faUpload } from '@fortawesome/free-solid-svg-icons'
import { uploadTenantBrandingIcon } from '../../api/tenants'
import { ApiError } from '../../api/client'
import { APP_ICON_SRC } from '../../branding'

type BrandingIconUploadProps = {
  tenantId: string
  iconUrl: string
  onIconUrlChange: (url: string) => void
  onUploaded?: () => void | Promise<void>
}

export function BrandingIconUpload({
  tenantId,
  iconUrl,
  onIconUrlChange,
  onUploaded,
}: BrandingIconUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewUrl = iconUrl.trim() || APP_ICON_SRC

  async function handleFileSelected(file: File | undefined) {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const signedReadUrl = await uploadTenantBrandingIcon(tenantId, file)
      if (signedReadUrl) {
        onIconUrlChange(signedReadUrl)
      }
      await onUploaded?.()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.body?.trim() || err.message || 'Failed to upload icon')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to upload icon')
      }
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleRemove() {
    setError(null)
    onIconUrlChange('')
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-slate-900">Brand icon</legend>
      <div className="group relative inline-block h-20 w-20">
        <img
          src={previewUrl}
          alt=""
          className="h-20 w-20 rounded-lg border border-slate-300 bg-white object-contain p-2"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-900 hover:bg-slate-100">
            <FontAwesomeIcon icon={faUpload} aria-hidden="true" />
            {uploading ? 'Uploading…' : 'Upload'}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => void handleFileSelected(e.target.files?.[0])}
            />
          </label>
          {iconUrl.trim() ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
              Remove
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-slate-500">PNG, JPG, or SVG. Uploaded to the tenant GCS bucket.</p>
    </fieldset>
  )
}
