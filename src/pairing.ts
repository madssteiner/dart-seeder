export function parseNames(draft: string): string[] {
  return draft.split(/\r?\n/).map(name => name.trim()).filter(Boolean)
}

export function hasMarkupDelimiters(names: readonly string[]): boolean {
  return names.some(name => /[<>]/u.test(name))
}

export function duplicateNames(names: readonly string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Map<string, string>()
  for (const name of names) {
    const key = name.trim().replace(/\s+/gu, ' ').toLowerCase().normalize('NFC')
    if (seen.has(key) && !duplicates.has(key)) duplicates.set(key, name)
    seen.add(key)
  }
  return [...duplicates.values()]
}
