import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope,
  faTrash,
  faUpload,
  faUserAstronaut,
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
  const bioText = description.trim() || 'No profile description yet.'
  const imageBusy = uploadingImage || removingProfileImage

  const profileFields: {
    id: string
    label: string
    value: string
    icon: IconDefinition
  }[] = []
  if (emailText.length > 0) {
    profileFields.push({
      id: 'email',
      label: 'Email',
      value: emailText,
      icon: faEnvelope,
    })
  }
  profileFields.push({
    id: 'bio',
    label: 'Bio',
    value: bioText,
    icon: faUserAstronaut,
  })

  return (
    <section className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
      <div className="group relative mx-auto h-40 w-40 shrink-0 sm:mx-0">
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

      <ul className="m-0 w-full min-w-0 list-none space-y-3 text-left text-slate-700 sm:flex-1">
        {profileFields.map((field) => (
          <li key={field.id} className="flex items-center gap-2 break-words">
            <FontAwesomeIcon
              icon={field.icon}
              className="shrink-0"
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="sr-only">{field.label}: </span>
              {field.value}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
