/**
 * Timezone utilities for TataDana (WIB - Asia/Jakarta, UTC+7)
 */

export const WIB_TIMEZONE = 'Asia/Jakarta';

/**
 * Get current Date converted to Asia/Jakarta (WIB) ISO-like representation
 */
export function getNowWIB(): Date {
  const now = new Date();
  // Formatter to WIB
  const wibString = now.toLocaleString('en-US', { timeZone: WIB_TIMEZONE });
  return new Date(wibString);
}

/**
 * Format a date to standard Indonesian WIB display
 * Example: "Sabtu, 10 Okt 2026 — 12:15 WIB"
 */
export function formatIndonesianWIB(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: WIB_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  // Calculate day of week safely in UTC+7
  const utcMs = date.getTime();
  const wibMs = utcMs + (7 * 60 * 60 * 1000);
  const wibDateObj = new Date(wibMs);
  const dayIndex = wibDateObj.getUTCDay();
  const dayName = days[dayIndex] || 'Hari';

  const monthIndex = Math.max(0, Math.min(11, parseInt(partMap['month'] || '1', 10) - 1));
  const monthName = months[monthIndex] || 'Bln';
  const dayNum = String(partMap['day'] || '01').padStart(2, '0');
  const yearNum = partMap['year'] || '2026';
  const hour = String(partMap['hour'] || '00').padStart(2, '0');
  const minute = String(partMap['minute'] || '00').padStart(2, '0');

  return `${dayName}, ${dayNum} ${monthName} ${yearNum} — ${hour}:${minute} WIB`;
}

/**
 * Format short time in WIB e.g. "12:15 WIB"
 */
export function formatShortTimeWIB(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: WIB_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${formatter.format(date)} WIB`;
}

/**
 * Format date only in WIB e.g. "10 Okt 2026"
 */
export function formatDateOnlyWIB(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: WIB_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }
  const day = partMap['day'] || '01';
  const monthIdx = parseInt(partMap['month'] || '1', 10) - 1;
  const year = partMap['year'] || '2026';
  return `${day} ${months[monthIdx]} ${year}`;
}

/**
 * Get ISO string representing current time in WIB
 */
export function getWIBISOString(): string {
  return new Date().toISOString();
}
