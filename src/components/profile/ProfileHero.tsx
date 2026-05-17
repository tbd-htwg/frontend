import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleInfo,
  faEnvelope,
  faTrash,
  faUpload,
} from '@fortawesome/free-solid-svg-icons'

type ProfileHeroProps = {
  email?: string
  description: string
  imageUrl?: string | null
  imageAlt: string
  avatarEditable?: boolean
  showPlaceholderWhenNoImage?: boolean
  loggedOutImagePlaceholder?: string
  uploadingImage?: boolean
  removingProfileImage?: boolean
  onImageSelected?: (file: File) => void
  onRemoveImage?: () => void
}

export function ProfileHero({
  email,
  description,
  imageUrl,
  imageAlt,
  avatarEditable = false,
  showPlaceholderWhenNoImage = true,
  loggedOutImagePlaceholder = 'Log in to view profile pictures',
  uploadingImage = false,
  removingProfileImage = false,
  onImageSelected,
  onRemoveImage,
}: ProfileHeroProps) {
  const emailText = email?.trim() ?? ''
  const showEmail = emailText.length > 0
  const bioText = description.trim() || 'No profile description yet.'
  const imageBusy = uploadingImage || removingProfileImage

  return (
    <section className="mt-6 flex flex-col items-center text-center">
      <div className="group relative mx-auto h-40 w-40 shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            className="h-40 w-40 rounded-full border border-slate-300 object-cover"
            loading="lazy"
          />
        ) : showPlaceholderWhenNoImage ? (
          <div className="flex h-40 w-40 items-center justify-center rounded-full border border-dashed border-slate-400 px-3 text-center text-sm text-slate-500">
            {loggedOutImagePlaceholder}
          </div>
        ) : null}

        {avatarEditable ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100">
              <FontAwesomeIcon icon={faUpload} aria-hidden="true" />
              {uploadingImage ? 'Uploading…' : 'Upload'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={imageBusy}
                aria-label="Upload profile picture"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onImageSelected?.(file)
                  e.currentTarget.value = ''
                }}
              />
            </label>
            {imageUrl ? (
              <button
                type="button"
                disabled={imageBusy}
                onClick={() => onRemoveImage?.()}
                aria-label="Remove profile picture"
                className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-2.5 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                {removingProfileImage ? 'Removing…' : 'Remove'}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 w-full max-w-md space-y-3 text-left">
        {showEmail ? (
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faEnvelope}
              className="shrink-0 text-slate-500"
              aria-hidden="true"
            />
            <p className="m-0 min-w-0 text-slate-700">{emailText}</p>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <FontAwesomeIcon
            icon={faCircleInfo}
            className="shrink-0 text-slate-500"
            aria-hidden="true"
          />
          <p className="m-0 min-w-0 break-words text-slate-700">{bioText}</p>
        </div>
      </div>
    </section>
  )
}
