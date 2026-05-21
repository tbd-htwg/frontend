export const CURRENCY_OPTIONS = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD'] as const

export type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]
