/** Site / product title shown in the header and browser tab. */
export const APP_TITLE = 'Trip Blänner Deluxe'

/** When true, the header title animates to word initials after load (e.g. TBD). */
export const APP_TITLE_RETRACT_TO_INITIALS = true

/** When true, invert the header icon on light header text (free pool default). */
export const APP_INVERT_HEADER_ICON = true

export const APP_ICON_SRC = '/cloud-regular-full.svg'

/** First letter of each word in {@link APP_TITLE}. */
export function appTitleInitials(title: string = APP_TITLE): string {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
}
