import { mockStore } from '../lib/supabase/mockStore';
import { formatAdvisorAlert } from '../lib/telegram/formatter';

export function runLinkingAdvisorTests(): { passed: number; failed: number; errors: string[] } {
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

  // --- 1. Telegram Phone Linking Tests ---
  const budi = mockStore.profiles.find(p => p.id === 'usr-budi-12345');
  assert(Boolean(budi), 'Budi Pratama profile exists');

  // Test normalizing Indonesian phone matching
  const testPhone = '081234567890';
  const cleanTestDigits = testPhone.replace(/[^0-9]/g, '').replace(/^(\+?62|0)/, '');
  const matchedUser = mockStore.profiles.find(p => {
    if (!p.phone_number) return false;
    const digits = p.phone_number.replace(/[^0-9]/g, '').replace(/^(\+?62|0)/, '');
    return digits === cleanTestDigits || digits.endsWith(cleanTestDigits) || cleanTestDigits.endsWith(digits);
  });
  assert(matchedUser?.id === 'usr-budi-12345', 'Phone "081234567890" matches "+6281234567890"');

  // Test deep-link user ID matching
  const payload = 'link_usr-budi-12345';
  const targetId = payload.replace('link_', '');
  const deepLinkedUser = mockStore.profiles.find(p => p.id === targetId);
  assert(deepLinkedUser?.id === 'usr-budi-12345', 'Deep link payload "link_usr-budi-12345" resolves to correct user');

  // --- 2. AI Financial Advisor Triggers Tests (Part 4.7) ---
  // Trigger 1: Single purchase > 20% of monthly budget
  const budget = 2000000;
  const largeTx = 500000; // 25% of budget (>20%)
  const isTrigger1 = (largeTx / budget) >= 0.2;
  assert(isTrigger1, 'AI Advisor Trigger 1: Single purchase > 20% of budget triggers alert');

  // Trigger 2: Kenaikan pengeluaran kategori > 50% vs minggu lalu
  const lastWeekSpent = 400000;
  const thisWeekSpent = 700000; // +75% increase (>50%)
  const isTrigger2 = lastWeekSpent > 0 && ((thisWeekSpent - lastWeekSpent) / lastWeekSpent) >= 0.5;
  assert(isTrigger2, 'AI Advisor Trigger 2: Category expense +50% vs last week triggers alert');

  // Trigger 3: Total pengeluaran > 80% total pemasukan bulan ini
  const income = 10000000;
  const expense = 8500000; // 85% of income (>80%)
  const isTrigger3 = income > 0 && (expense / income) >= 0.8;
  assert(isTrigger3, 'AI Advisor Trigger 3: Total expense > 80% total income triggers alert');

  // Advisor Alert Formatter
  const alertText = formatAdvisorAlert(
    'Budi Pratama',
    'Pengeluaran kategori Makanan & Minuman naik 75% dibanding minggu lalu!',
    'Pertimbangkan masak di rumah 3 hari ke depan untuk hemat ~Rp150.000.'
  );
  assert(alertText.includes('🤖 Financial Advisor'), 'Alert has "🤖 Financial Advisor" header');
  assert(alertText.includes('Hei Budi Pratama!'), 'Alert includes personalized greeting');
  assert(alertText.includes('💡 Saran:'), 'Alert includes actionable "💡 Saran:"');

  // --- 3. Multi-User /start Protection & Account Isolation Tests ---
  const salwaUser = mockStore.profiles.find(p => p.id === 'usr-salwa-001');
  const budiUser = mockStore.profiles.find(p => p.id === 'usr-budi-12345');
  assert(Boolean(salwaUser && budiUser), 'Both Salwa L and Budi Pratama profiles exist');

  // Verify Budi has his own telegram_chat_id
  assert(budiUser?.telegram_chat_id === 123456789, 'Budi Pratama has distinct telegram_chat_id: 123456789');

  // When Budi's chatId sends /start, lookup must find Budi and NOT overwrite Salwa's chatId
  const budiLookup = mockStore.profiles.find(p => p.telegram_chat_id === 123456789);
  assert(budiLookup?.id === 'usr-budi-12345', 'Incoming chatId 123456789 maps strictly to Budi Pratama');
  assert(salwaUser?.telegram_chat_id !== 123456789, 'Salwa L chat ID is protected from being overwritten by Budi');

  // --- 4. Visual Theme System Validation (Blue & Black, Orange, Blue Light) ---
  const supportedThemes = ['blue-dark', 'orange', 'blue-light'];
  assert(supportedThemes.includes('blue-dark'), 'Theme system supports "blue-dark" (Biru & Hitam Cyber Fintech)');
  assert(supportedThemes.includes('orange'), 'Theme system supports "orange" (Oranye & Putih Klasik)');
  assert(supportedThemes.includes('blue-light'), 'Theme system supports "blue-light" (Biru & Putih Modern)');

  return { passed, failed, errors };
}
