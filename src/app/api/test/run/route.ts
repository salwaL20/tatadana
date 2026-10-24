import { NextResponse } from 'next/server';
import { runTelegramParserTests } from '@/test/telegram_parser.test';
import { runIdempotencyTests } from '@/test/idempotency.test';
import { runTimezoneWibTests } from '@/test/timezone_wib.test';
import { runPlanLimitsTests } from '@/test/plan_limits.test';
import { runReportGeneratorTests } from '@/test/report_generator.test';
import { runLinkingAdvisorTests } from '@/test/linking_advisor.test';
import { runBotClientTests } from '@/test/bot_client.test';
import { runDatabaseMigrationsTests } from '@/test/database_migrations.test';
import { runPart9FeaturesTests } from '@/test/part9_features.test';
import { runAdminTataAiTeamworkTests } from '@/test/admin_tataai_teamwork.test';
import { runAdminAccessRegistrationTests } from '@/test/admin_access_registration.test';

export const dynamic = 'force-dynamic';

export async function GET() {
  const t1 = runTelegramParserTests();
  const t2 = await runIdempotencyTests();
  const t3 = runTimezoneWibTests();
  const t4 = await runPlanLimitsTests();
  const t5 = await runReportGeneratorTests();
  const t6 = runLinkingAdvisorTests();
  const t7 = await runBotClientTests();
  const t8 = await runDatabaseMigrationsTests();
  const t9 = await runPart9FeaturesTests();
  const t10 = await runAdminTataAiTeamworkTests();
  const t11 = await runAdminAccessRegistrationTests();

  const totalPassed = t1.passed + t2.passed + t3.passed + t4.passed + t5.passed + t6.passed + t7.passed + t8.passed + t9.passed + t10.passed + t11.passed;
  const totalFailed = t1.failed + t2.failed + t3.failed + t4.failed + t5.failed + t6.failed + t7.failed + t8.failed + t9.failed + t10.failed + t11.failed;
  const allErrors = [...t1.errors, ...t2.errors, ...t3.errors, ...t4.errors, ...t5.errors, ...t6.errors, ...t7.errors, ...t8.errors, ...t9.errors, ...t10.errors, ...t11.errors];

  return NextResponse.json({
    status: totalFailed === 0 ? 'ALL_TESTS_PASSED' : 'SOME_TESTS_FAILED',
    summary: {
      totalPassed,
      totalFailed,
      successRate: `${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`,
    },
    suites: [
      { name: '1. Telegram Natural Language & Nominal Parser', ...t1 },
      { name: '2. Telegram Webhook Idempotency', ...t2 },
      { name: '3. Asia/Jakarta Timezone (WIB)', ...t3 },
      { name: '4. Subscription Plan Restrictions', ...t4 },
      { name: '5. In-App Laporan & Export Generation', ...t5 },
      { name: '6. Telegram Phone Linking & AI Advisor Triggers', ...t6 },
      { name: '7. Telegram Bot Connection & setWebhook API', ...t7 },
      { name: '8. Supabase Database Migrations, RLS & Schema Integrity', ...t8 },
      { name: '9. Part 9 Features: Multi-Wallet, Multi-Period Budget, Calendar & Tata AI', ...t9 },
      { name: '10. Part 10 Features: Admin Salwa L, Payment Approval & 10 Teams', ...t10 },
      { name: '11. Part 11 Features: Admin Access Restriction & WhatsApp OTP Registration', ...t11 },
    ],
    errors: allErrors,
  });
}

