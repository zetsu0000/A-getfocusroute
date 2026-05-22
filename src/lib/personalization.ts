export function safeName(name: string | null | undefined, fallback = 'there'): string {
  if (!name) return fallback
  const trimmed = name.trim()
  if (trimmed.length < 2 || !/[aeiou\u00e0\u00e1\u00e2\u00e3\u00e4\u00e9\u00e8\u00ea\u00ed\u00ec\u00ee\u00f3\u00f2\u00f4\u00f5\u00f6\u00fa\u00f9\u00fb\u00fc]/i.test(trimmed)) {
    return fallback
  }
  return trimmed
}
