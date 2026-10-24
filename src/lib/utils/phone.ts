/**
 * Indonesian Phone Number Normalizer & Validator for TataDana Fintech
 */

export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '').trim();
  if (cleaned.startsWith('08')) {
    cleaned = '+62' + cleaned.slice(1);
  } else if (cleaned.startsWith('628')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+') && cleaned.startsWith('8')) {
    cleaned = '+62' + cleaned;
  }
  return cleaned;
}

export function isValidIndonesianPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^\+628[1-9][0-9]{7,11}$/.test(normalized);
}
