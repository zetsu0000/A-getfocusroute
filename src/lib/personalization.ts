export function safeName(name: string | null | undefined, fallback = 'there'): string {
  if (!name) return fallback
  const trimmed = name.trim()
  if (trimmed.length < 2 || !/[aeiouàáâãäéèêíìîóòôõöúùûü]/i.test(trimmed)) {
    return fallback
  }
  return trimmed
}
