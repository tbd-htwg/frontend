import type { CustomFieldType } from '../types/customField'

const MAX_VALUE_LENGTH = 8192

/** Align with backend CustomFieldValidation.validateValue (tripplanning-customfield-service). */
export function normalizeCustomFieldValue(type: CustomFieldType, value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (type === 'URL' && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`
  }
  return trimmed
}

export function validateCustomFieldValue(
  type: CustomFieldType,
  value: string,
): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > MAX_VALUE_LENGTH) {
    return `Must be at most ${MAX_VALUE_LENGTH} characters`
  }
  switch (type) {
    case 'URL':
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return 'URL must start with http:// or https://'
      }
      return null
    case 'NUMBER':
      return Number.isFinite(Number(trimmed)) ? null : 'Enter a valid number'
    default:
      return null
  }
}

/** Keeps only characters valid in a decimal number (optional leading minus). */
export function sanitizeNumberInput(raw: string): string {
  if (raw === '') return ''
  let result = ''
  let seenDot = false
  for (const ch of raw) {
    if (ch === '-' && result === '') {
      result += ch
    } else if (ch === '.' && !seenDot) {
      result += ch
      seenDot = true
    } else if (ch >= '0' && ch <= '9') {
      result += ch
    }
  }
  return result
}

export function validateTripCustomFieldDraft(
  fields: { fieldId: string; name: string; type: CustomFieldType }[],
  draft: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of fields) {
    const raw = draft[field.fieldId] ?? ''
    const normalized = normalizeCustomFieldValue(field.type, raw)
    const message = validateCustomFieldValue(field.type, normalized)
    if (message) errors[field.fieldId] = message
  }
  return errors
}
