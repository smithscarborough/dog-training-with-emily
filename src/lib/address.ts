const STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "IA", "ID", "IL", "IN",
  "KS", "KY", "LA", "MA", "MD", "ME", "MI", "MN", "MO", "MS", "MT", "NC", "ND", "NE", "NH", "NJ",
  "NM", "NV", "NY", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VA", "VT", "WA",
  "WI", "WV", "WY",
]);

const DIRECTIONALS = new Set(["N", "S", "E", "W", "NE", "NW", "SE", "SW"]);

const SUFFIXES: Record<string, string> = {
  street: "St",
  st: "St",
  road: "Rd",
  rd: "Rd",
  avenue: "Ave",
  ave: "Ave",
  boulevard: "Blvd",
  blvd: "Blvd",
  drive: "Dr",
  dr: "Dr",
  lane: "Ln",
  ln: "Ln",
  court: "Ct",
  ct: "Ct",
  place: "Pl",
  pl: "Pl",
  parkway: "Pkwy",
  pkwy: "Pkwy",
  highway: "Hwy",
  hwy: "Hwy",
  terrace: "Ter",
  ter: "Ter",
  circle: "Cir",
  cir: "Cir",
  apartment: "Apt",
  apt: "Apt",
  suite: "Ste",
  ste: "Ste",
  unit: "Unit",
  floor: "Fl",
  fl: "Fl",
  way: "Way",
  po: "PO",
  "p.o": "PO",
  box: "Box",
};

function tidyWord(word: string) {
  const lower = word.toLowerCase().replace(/\.$/, "");
  const suffix = SUFFIXES[lower];
  if (suffix) return suffix;
  const upper = word.replace(/\.$/, "").toUpperCase();
  if (STATES.has(upper) || DIRECTIONALS.has(upper)) return upper;
  if (/^\d+(st|nd|rd|th)$/i.test(word)) return word.toLowerCase();
  if (/\d/.test(word) && /[a-z]/i.test(word)) return word.toUpperCase();
  if (/^\d{5}(?:-?\d{4})?$/.test(word)) {
    const digits = word.replace("-", "");
    return digits.length === 9 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  }
  if (word.includes("'")) {
    return word
      .split("'")
      .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part))
      .join("'");
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Tidies a US address after the field is left. Does not look anything up. */
export function formatUsAddress(value: string) {
  const cleaned = value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/,+/g, ",")
    .replace(/,\s*$/, "");
  if (!cleaned) return "";
  return cleaned
    .split(" ")
    .map((token) => (token.endsWith(",") ? `${tidyWord(token.slice(0, -1))},` : tidyWord(token)))
    .join(" ");
}
