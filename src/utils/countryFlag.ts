/** Regional indicator symbol letter pair for ISO 3166-1 alpha-2 (e.g. DE → 🇩🇪). */
export function flagEmojiForCountryCode(countryCode: string): string {
  const code = countryCode.trim().toUpperCase()
  if (code.length !== 2 || !/^[A-Z]{2}$/.test(code)) {
    return '🏳️'
  }
  const codePoints = [...code].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65)
  return String.fromCodePoint(...codePoints)
}
