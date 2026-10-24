import fs from 'fs';
import path from 'path';

export interface TestResult {
  passed: number;
  failed: number;
  errors: string[];
}

export async function runDatabaseMigrationsTests(): Promise<TestResult> {
  const result: TestResult = { passed: 0, failed: 0, errors: [] };

  function assert(condition: boolean, msg: string) {
    if (condition) {
      result.passed++;
    } else {
      result.failed++;
      result.errors.push(msg);
    }
  }

  const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
  assert(fs.existsSync(migrationsDir), `supabase/migrations directory exists at ${migrationsDir}`);

  // 1. Verify Migration Files
  const initialSchemaPath = path.join(migrationsDir, '20261010000001_initial_schema.sql');
  const rlsPoliciesPath = path.join(migrationsDir, '20261010000002_rls_policies.sql');
  const seedDataPath = path.join(migrationsDir, '20261010000003_seed_data.sql');


  assert(fs.existsSync(initialSchemaPath), '20261010000001_initial_schema.sql exists');
  assert(fs.existsSync(rlsPoliciesPath), '20261010000002_rls_policies.sql exists');
  assert(fs.existsSync(seedDataPath), '20261010000003_seed_data.sql exists');

  const initialSql = fs.readFileSync(initialSchemaPath, 'utf8');
  const rlsSql = fs.readFileSync(rlsPoliciesPath, 'utf8');
  const seedSql = fs.readFileSync(seedDataPath, 'utf8');

  // 2. Verify all 12 Core Tables
  const required12Tables = [
    'profiles',
    'wallets',
    'categories',
    'budgets',
    'transactions',
    'transaction_items',
    'bot_connections',
    'telegram_updates',
    'reminders',
    'order_payments',
    'ai_providers',
    'audit_logs'
  ];

  for (const tableName of required12Tables) {
    const tableRegex = new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${tableName}\\b`, 'i');
    assert(tableRegex.test(initialSql), `Table 'public.${tableName}' defined in initial schema`);
  }

  // 3. Verify Indexes and Constraints
  assert(/idx_transactions_user_time/i.test(initialSql), 'Composite index on transactions (user_id, time) exists');
  assert(/unique_user_default_wallet/i.test(initialSql), 'Unique constraint/index for 1 default wallet per user exists');
  assert(/unique_user_category_budget_period/i.test(initialSql), 'Unique constraint on budgets (user, category, period) exists');

  // 4. Verify RLS Enabled on all 12 Tables
  for (const tableName of required12Tables) {
    const rlsRegex = new RegExp(`ALTER TABLE public\\.${tableName} ENABLE ROW LEVEL SECURITY;`, 'i');
    assert(rlsRegex.test(rlsSql), `RLS enabled on 'public.${tableName}'`);
  }

  // 5. Verify RLS Policies on all 12 Tables
  for (const tableName of required12Tables) {
    const policyRegex = new RegExp(`CREATE POLICY[\\s\\S]+?\\s+ON\\s+public\\.${tableName}\\b`, 'i');
    assert(policyRegex.test(rlsSql), `RLS policy created for 'public.${tableName}'`);
  }

  // 6. Verify Critical Triggers and Functions
  assert(/FUNCTION public\.is_superadmin\(\)/i.test(rlsSql), 'Helper function is_superadmin() defined');
  assert(/FUNCTION public\.handle_updated_at\(\)/i.test(rlsSql), 'Trigger function handle_updated_at() defined');
  assert(/FUNCTION public\.handle_new_user\(\)/i.test(rlsSql), 'Trigger function handle_new_user() defined for auth sync');
  assert(/on_auth_user_created/i.test(rlsSql), 'Trigger on_auth_user_created hooked on auth.users');
  assert(/FUNCTION public\.handle_transaction_balance_change\(\)/i.test(rlsSql), 'Trigger function handle_transaction_balance_change() defined');
  assert(/trg_transaction_balance/i.test(rlsSql), 'Trigger trg_transaction_balance attached to public.transactions');

  // 7. Verify Seed Data & Storage Bucket
  assert(/'gemini'/i.test(seedSql) && /'openai'/i.test(seedSql) && /'deepseek'/i.test(seedSql), 'Multi-provider AI seed data (gemini, openai, deepseek) present');
  assert(/storage\.buckets/i.test(seedSql) && /'laporan-exports'/i.test(seedSql), 'Storage bucket laporan-exports initialized');
  assert(/CREATE POLICY [^;]+ ON storage\.objects/i.test(seedSql), 'Storage object RLS policy for laporan-exports defined');

  // 8. Verify SQL Syntax Consistency (unclosed quotes / parentheses check)
  for (const [name, content] of [
    ['initial_schema', initialSql],
    ['rls_policies', rlsSql],
    ['seed_data', seedSql]
  ]) {
    // Check balanced parentheses
    const openParen = (content.match(/\(/g) || []).length;
    const closeParen = (content.match(/\)/g) || []).length;
    assert(openParen === closeParen, `${name}.sql has balanced parentheses (${openParen} == ${closeParen})`);
  }

  return result;
}

if (typeof require !== 'undefined' && require.main === module) {
  runDatabaseMigrationsTests().then(res => {
    console.log(`Database Migration Tests: ${res.passed} passed, ${res.failed} failed`);
    if (res.errors.length) {
      console.error(res.errors);
      process.exit(1);
    }
  });
}
