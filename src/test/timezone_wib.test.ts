import { 
  formatIndonesianWIB, 
  formatShortTimeWIB, 
  formatDateOnlyWIB,
  getNowWIB,
  WIB_TIMEZONE,
  getWIBISOString
} from '../lib/utils/timezone';

export function runTimezoneWibTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(`FAIL: ${testName}`);
    }
  }

  // Test 1: Standard UTC to WIB conversion (UTC+7)
  // 2026-10-10 05:00:00 UTC corresponds to 2026-10-10 12:00:00 WIB
  const testUtcDate = new Date('2026-10-10T05:00:00.000Z');

  const fullWib = formatIndonesianWIB(testUtcDate);
  assert(fullWib.includes('12:00 WIB'), `Full format converts UTC 05:00 to 12:00 WIB (got: ${fullWib})`);
  assert(fullWib.includes('10 Okt 2026') || fullWib.includes('10 Oct 2026'), 'Full format contains date 10 Okt 2026');

  const shortWib = formatShortTimeWIB(testUtcDate);
  assert(shortWib.includes('12.00 WIB') || shortWib.includes('12:00 WIB'), `Short format shows 12:00 WIB (got: ${shortWib})`);

  const dateOnly = formatDateOnlyWIB(testUtcDate);
  assert(dateOnly.includes('10 Okt 2026') || dateOnly.includes('10 Oct 2026'), `Date only format shows 10 Okt 2026 (got: ${dateOnly})`);

  // Test 2: Midnight UTC boundary: UTC 00:00:00 is 07:00:00 WIB
  const midnightUtc = new Date('2026-10-10T00:00:00.000Z');
  const midnightShort = formatShortTimeWIB(midnightUtc);
  assert(midnightShort.includes('07.00 WIB') || midnightShort.includes('07:00 WIB'), `Midnight UTC becomes 07:00 WIB (got: ${midnightShort})`);

  // Test 3: Day rollover boundary: UTC 18:00:00 rolls over to next day 01:00:00 WIB
  const eveningUtc = new Date('2026-10-10T18:00:00.000Z');
  const rolloverDate = formatDateOnlyWIB(eveningUtc);
  assert(rolloverDate.includes('11 Okt 2026') || rolloverDate.includes('11 Oct 2026'), `UTC 18:00 rolls to next day 11 Okt 2026 in WIB (got: ${rolloverDate})`);
  const rolloverTime = formatShortTimeWIB(eveningUtc);
  assert(rolloverTime.includes('01.00 WIB') || rolloverTime.includes('01:00 WIB'), `UTC 18:00 becomes 01:00 WIB (got: ${rolloverTime})`);

  // Test 4: Timezone constant and helper functions
  assert(WIB_TIMEZONE === 'Asia/Jakarta', 'WIB_TIMEZONE constant equals Asia/Jakarta');
  
  const nowWib = getNowWIB();
  assert(nowWib instanceof Date && !isNaN(nowWib.getTime()), 'getNowWIB returns a valid Date object');

  const isoStr = getWIBISOString();
  assert(typeof isoStr === 'string' && isoStr.length > 0, 'getWIBISOString returns valid ISO string');

  return { passed, failed, errors };
}
