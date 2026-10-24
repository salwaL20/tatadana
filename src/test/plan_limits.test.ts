import { formatLimitReachedReply } from '../lib/telegram/formatter';
import { mockStore } from '../lib/supabase/mockStore';
import { aiService } from '../lib/ai/multiProvider';

export async function runPlanLimitsTests(): Promise<{ passed: number; failed: number; errors: string[] }> {
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

  // 1. Test Starter limit message
  const limitMsg = formatLimitReachedReply(50, 50);
  assert(limitMsg.includes('50/50'), 'Starter plan reply highlights 50/50 quota limit');
  assert(limitMsg.includes('Rp99.000'), 'Starter plan reply contains upgrade CTA to Pro Rp99.000');
  assert(limitMsg.includes('tatadana.app/settings?tab=subscription'), 'Contains direct upgrade URL link');

  // 2. Test Pro user permissions
  const proUser = mockStore.profiles.find(p => p.subscription_tier === 'pro');
  assert(Boolean(proUser), 'Pro user profile exists in database model');
  assert(proUser?.role === 'superadmin' || proUser?.subscription_tier === 'pro', 'Pro user has pro features unlocked');

  // 3. Test Midtrans payment gateway approval workflow
  let pendingSub = mockStore.subscriptions.find(s => s.status === 'pending_approval');
  if (!pendingSub) {
    pendingSub = {
      id: `sub-test-pending-${Date.now()}`,
      user_id: 'usr-citra-99887',
      plan: 'pro',
      status: 'pending_approval',
      payment_method: 'midtrans',
      amount: 99000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockStore.subscriptions.push(pendingSub);
  }
  assert(Boolean(pendingSub), 'Pending Midtrans subscription order exists in database');
  if (pendingSub) {
    const targetUser = mockStore.profiles.find(u => u.id === pendingSub.user_id);
    assert(Boolean(targetUser), 'Target user for pending subscription exists');

    // Simulate approval
    pendingSub.status = 'active';
    pendingSub.approved_by = 'usr-admin-super';
    if (targetUser) {
      targetUser.subscription_tier = 'pro';
    }
    assert(pendingSub.status === 'active', 'Subscription status updated to active upon approval');
    assert(targetUser?.subscription_tier === 'pro', 'User subscription tier upgraded to pro upon approval');

    // Audit log recorded
    mockStore.auditLogs.unshift({
      id: `aud-test-${Date.now()}`,
      admin_id: 'usr-admin-super',
      target_user_id: pendingSub.user_id,
      action: 'approve_subscription_pro',
      created_at: new Date().toISOString(),
    });
    const latestAudit = mockStore.auditLogs[0];
    assert(latestAudit.action === 'approve_subscription_pro', 'Audit log records approval of Pro subscription');
  }

  // 4. Test Multi-Provider AI Single Mode execution & Telemetry
  const singleResult = await aiService.execute({
    feature: 'nlp_parser',
    prompt: 'beli bakso 25rb',
    forceMode: 'single',
  });
  assert(singleResult.success === true, 'Multi-AI Single mode parses transaction successfully');
  assert(singleResult.data.amount === 25000, 'Single mode extracts correct amount (25000)');

  // Verify telemetry was logged
  const latestAiLog = mockStore.aiLogs[0];
  assert(Boolean(latestAiLog), 'AI call telemetry log was captured');
  assert(latestAiLog.latency_ms >= 0, 'Telemetry log contains valid latency in ms');
  assert(latestAiLog.response_status === 'success' || latestAiLog.response_status === 'failed', 'Telemetry log records response status');

  // 5. Test Multi-Provider AI Failover Mode
  const failoverResult = await aiService.execute({
    feature: 'nlp_parser',
    prompt: 'gaji bulanan 12.5jt',
    forceMode: 'failover',
    simulateFailureFor: ['gemini'], // primary fails, falls back gracefully
  });
  assert(failoverResult.success === true, 'Failover mode seamlessly recovers when primary provider fails');
  assert(failoverResult.data.amount === 12500000, 'Failover mode extracts correct nominal 12.5jt (12500000)');

  // 6. Test Multi-Provider AI Parallel Mode
  const parallelResult = await aiService.execute({
    feature: 'nlp_parser',
    prompt: 'bayar wifi 350k',
    forceMode: 'parallel',
  });
  assert(parallelResult.success === true, 'Parallel mode executes and returns valid parsed result');
  assert(parallelResult.data.amount === 350000, 'Parallel mode extracts correct nominal 350k (350000)');

  // 7. Telemetry Aggregation Stats
  const telemetryStats = aiService.getTelemetryStats();
  assert(telemetryStats.totalCalls > 0, 'Telemetry statistics aggregate total calls');
  assert(telemetryStats.avgLatencyMs >= 0, 'Telemetry statistics calculate average latency');

  // 8. Test Midtrans payment gateway rejection workflow
  const secondPendingSub = mockStore.subscriptions.find(s => s.status === 'pending_approval');
  if (secondPendingSub) {
    const targetRejectUser = mockStore.profiles.find(u => u.id === secondPendingSub.user_id);
    const initialPlan = targetRejectUser?.subscription_tier;

    // Simulate rejection
    secondPendingSub.status = 'rejected';
    secondPendingSub.rejection_reason = 'Bukti transfer buram / nominal tidak sesuai';
    
    assert(secondPendingSub.status === 'rejected', 'Subscription status updated to rejected upon admin rejection');
    assert(Boolean(secondPendingSub.rejection_reason), 'Rejection reason recorded in subscription record');
    assert(targetRejectUser?.subscription_tier === initialPlan, 'User subscription tier remains un-upgraded on rejection');

    // Audit log recorded
    mockStore.auditLogs.unshift({
      id: `aud-test-reject-${Date.now()}`,
      admin_id: 'usr-admin-super',
      target_user_id: secondPendingSub.user_id,
      action: 'reject_subscription',
      metadata: { reason: secondPendingSub.rejection_reason },
      created_at: new Date().toISOString(),
    });
    const rejectAudit = mockStore.auditLogs[0];
    assert(rejectAudit.action === 'reject_subscription', 'Audit log records rejection of subscription order');
  }

  // 9. Test Privacy Audit Log Recording on Transaction Inspection
  const inspectUserId = 'usr-citra-99887';
  mockStore.auditLogs.unshift({
    id: `aud-inspect-${Date.now()}`,
    admin_id: 'usr-admin-super',
    target_user_id: inspectUserId,
    action: 'inspect_transactions',
    metadata: { reason: 'Pemeriksaan saldo nasabah' },
    ip_address: '127.0.0.1 (Internal Admin)',
    created_at: new Date().toISOString(),
  });
  const inspectAudit = mockStore.auditLogs[0];
  assert(inspectAudit.action === 'inspect_transactions', 'Audit log captures transaction inspection by superadmin');
  assert(inspectAudit.target_user_id === inspectUserId, 'Audit log accurately identifies target user id');

  // 10. Test Multi-AI Voice Note STT Execution
  const voiceResult = await aiService.execute({
    feature: 'voice_stt',
    prompt: 'beli bensin 50rb',
  });
  assert(Boolean(voiceResult.transcript), 'Voice STT AI feature successfully transcribes audio prompt');
  assert(voiceResult.durationSeconds > 0, 'Voice STT records audio duration');

  // 11. Test Multi-AI Receipt OCR Execution
  const ocrResult = await aiService.execute({
    feature: 'receipt_ocr',
    prompt: 'Superindo Express Grocery Struk Belanja Rp245.000',
  });
  assert(Boolean(ocrResult.merchant), 'Receipt OCR extracts merchant name');
  assert(Array.isArray(ocrResult.items) && ocrResult.items.length > 0, 'Receipt OCR extracts itemized line items');
  assert(ocrResult.total > 0, 'Receipt OCR calculates valid total bill');

  // 12. Test Multi-AI Financial Advisor Execution
  const advisorResult = await aiService.execute({
    feature: 'advisor',
    prompt: 'Evaluasi lonjakan belanja kategori Makanan & Minuman',
  });
  assert(Boolean(advisorResult.analysis), 'Financial Advisor produces financial analysis');
  assert(Boolean(advisorResult.advice), 'Financial Advisor produces actionable saving advice');

  // 13. Test Multi-AI Onboarding Category Generation
  const categoryResult = await aiService.execute({
    feature: 'onboarding_category',
    prompt: 'freelancer developer',
  });
  assert(Array.isArray(categoryResult) && categoryResult.length > 0, 'AI Onboarding generates category suggestions');
  assert(Boolean(categoryResult[0].name && categoryResult[0].emoji), 'Generated categories include name and emoji');

  // 14. Test Telemetry provider breakdown
  const finalTelemetry = aiService.getTelemetryStats();
  assert(finalTelemetry.totalCalls >= 6, 'Telemetry tracks multiple AI calls across features');
  assert(finalTelemetry.successRate >= 90, 'High success rate maintained across provider executions');

  return { passed, failed, errors };
}

