import { runTelegramParserTests } from './telegram_parser.test';
import { runIdempotencyTests } from './idempotency.test';
import { runTimezoneWibTests } from './timezone_wib.test';
import { runPlanLimitsTests } from './plan_limits.test';
import { runReportGeneratorTests } from './report_generator.test';
import { runLinkingAdvisorTests } from './linking_advisor.test';
import { runBotClientTests } from './bot_client.test';
import { runDatabaseMigrationsTests } from './database_migrations.test';
import { runPart9FeaturesTests } from './part9_features.test';
import { runAdminTataAiTeamworkTests } from './admin_tataai_teamwork.test';
import { runAdminAccessRegistrationTests } from './admin_access_registration.test';
import { runUserApprovalTests } from './user_approval.test';
import { runAdminPanelsTests } from './admin_panels.test';
import { runDirectLoginTests } from './direct_login.test';

export async function runAllTestSuite() {
  console.log('====================================================');
  console.log('TATADANA FINTECH SAAS — COMPREHENSIVE TEST SUITE');
  console.log('====================================================');

  const suites = [
    { name: '1. Telegram Natural Language & Nominal Parser', fn: runTelegramParserTests },
    { name: '2. Telegram Webhook Idempotency (update_id)', fn: runIdempotencyTests },
    { name: '3. Asia/Jakarta Timezone (WIB) Accuracy', fn: runTimezoneWibTests },
    { name: '4. Subscription Plan Restrictions & Gates', fn: runPlanLimitsTests },
    { name: '5. In-App Laporan & Export Generation (PDF/Excel)', fn: runReportGeneratorTests },
    { name: '6. Telegram Phone Linking & AI Advisor Triggers', fn: runLinkingAdvisorTests },
    { name: '7. Telegram Bot Connection & setWebhook API', fn: runBotClientTests },
    { name: '8. Supabase Database Migrations, RLS & Schema Integrity', fn: runDatabaseMigrationsTests },
    { name: '9. Part 9 Features: Multi-Wallet, Multi-Period Budget, Calendar & Tata AI', fn: runPart9FeaturesTests },
    { name: '10. Part 10 Features: Admin Salwa L, Payment Approval, Tata AI Wallets & 10 Teams', fn: runAdminTataAiTeamworkTests },
    { name: '11. Part 11 Features: Admin Access Restriction, Mandatory WhatsApp OTP Registration & Admin Profile Viewer', fn: runAdminAccessRegistrationTests },
    { name: '12. Part 12 Features: User Approval System, WhatsApp Verification & Admin Decisive Controls', fn: runUserApprovalTests },
    { name: '13. Part 13 Features: Broadcast Panel, Global Transactions Monitor & System Settings', fn: runAdminPanelsTests },
    { name: '14. Part 14 Features: Direct WhatsApp Login & Auto-Approval Bypass Feature', fn: runDirectLoginTests },
  ];

  let totalPassed = 0;
  let totalFailed = 0;
  const allErrors: string[] = [];

  for (const suite of suites) {
    const res = await suite.fn();
    totalPassed += res.passed;
    totalFailed += res.failed;
    allErrors.push(...res.errors);

    const statusIcon = res.failed === 0 ? '✓' : '✗';
    console.log(`${statusIcon} ${suite.name}: ${res.passed} passed, ${res.failed} failed`);
    if (res.errors.length > 0) {
      res.errors.forEach(err => console.log(`   - ${err}`));
    }
  }

  console.log('----------------------------------------------------');
  console.log(`TOTAL RESULT: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log('====================================================');

  return { totalPassed, totalFailed, allErrors };
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllTestSuite().then(res => {
    process.exit(res.totalFailed === 0 ? 0 : 1);
  });
}
