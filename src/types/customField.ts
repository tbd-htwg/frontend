export type CustomFieldType = 'TEXT_SHORT' | 'TEXT_LONG' | 'URL' | 'NUMBER'

export type CustomFieldDeclaration = {
  id: string
  name: string
  type: CustomFieldType
  archived: boolean
  createdAt: number
}

export type TripCustomFieldValue = {
  fieldId: string
  name: string
  type: CustomFieldType
  value: string
}

export const CUSTOM_FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  TEXT_SHORT: 'Short text',
  TEXT_LONG: 'Long text',
  URL: 'URL',
  NUMBER: 'Number',
}

export const CUSTOM_FIELD_TYPES: CustomFieldType[] = [
  'TEXT_SHORT',
  'TEXT_LONG',
  'URL',
  'NUMBER',
]
