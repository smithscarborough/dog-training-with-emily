/** US phone as 713-555-0148. Drops a leading 1. Extra digits are ignored. */
export function phoneDigits(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function formatUsPhone(value: string): string {
  const digits = phoneDigits(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function normalizeUsPhone(value: string, required: boolean): string {
  const formatted = formatUsPhone(value);
  const digits = phoneDigits(formatted);
  if (!digits) {
    if (required) throw new Error("Phone is required.");
    return "";
  }
  if (digits.length !== 10) {
    throw new Error("Enter a 10-digit phone number, like 713-555-0148.");
  }
  return formatted;
}
