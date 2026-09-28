/** Capitalizes a lowercase letter at the start of a name, including after a space, hyphen, or apostrophe. */
export function formatProperName(value: string) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";
  return cleaned.replace(/(^|[\s\-'])([a-z])/g, (_, lead: string, letter: string) => lead + letter.toUpperCase());
}

/** Capitalizes the first letter of a note. Leaves the rest of the sentence alone. */
export function formatSentenceStart(value: string) {
  const cleaned = value
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return cleaned.replace(/^[a-z]/, (letter) => letter.toUpperCase());
}

export function formatEmail(value: string) {
  return value.trim().toLowerCase();
}
