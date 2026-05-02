// Normalizes Dominican Republic phone numbers to E.164 (+1XXXXXXXXXX).
// Handles: 8091234567 / 809-123-4567 / (809) 123-4567 / 1-809-123-4567
export function formatDRPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  // Already E.164 with country code
  if (digits.startsWith('1') && digits.length === 11) return '+' + digits;

  // 10-digit local number
  if (digits.length === 10) return '+1' + digits;

  // 7-digit (missing area code) — can't reliably fix, return as-is
  return raw.trim();
}

// Returns true if the number looks like a valid DR number after formatting
export function isValidDRPhone(raw: string): boolean {
  const formatted = formatDRPhone(raw);
  if (!formatted.startsWith('+1')) return false;
  const digits = formatted.slice(2);
  if (digits.length !== 10) return false;
  const area = digits.slice(0, 3);
  return ['809', '829', '849'].includes(area);
}
