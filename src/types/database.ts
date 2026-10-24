export type UserRole = 'user' | 'superadmin';
export type SubscriptionTier = 'starter' | 'pro';
export type WalletType = 'bank' | 'ewallet' | 'cash' | 'deposit' | 'credit_card' | 'other';
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionSource = 'telegram_text' | 'telegram_voice' | 'telegram_receipt' | 'web_manual';
export type BotWebhookStatus = 'connected' | 'disconnected' | 'testing' | 'error';
export type TelegramMessageType = 'text' | 'photo' | 'voice' | 'audio' | 'command';
export type UpdateStatus = 'processed' | 'failed' | 'skipped_duplicate';
export type AiProviderName = 'gemini' | 'openai' | 'deepseek';
export type AiExecutionMode = 'single' | 'failover' | 'parallel';
export type SubscriptionStatus = 'active' | 'pending_approval' | 'expired' | 'rejected';
export type PaymentMethod = 'midtrans' | 'manual_transfer' | 'free';

export type UserApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  full_name: string;
  email?: string | null;
  phone_number: string | null;
  phone_verified: boolean;
  avatar_url?: string | null;
  default_currency: string;
  role: UserRole;
  telegram_chat_id: number | null;
  telegram_username?: string | null;
  subscription_tier: SubscriptionTier;
  approval_status?: UserApprovalStatus;
  approval_notes?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number;
  is_default: boolean;
  color: string;
  institution?: string;
  account_number?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  type: 'income' | 'expense';
  color: string;
  monthly_budget: number;
  daily_budget?: number;
  weekly_budget?: number;
  yearly_budget?: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringBill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number;
  category_id?: string | null;
  wallet_id?: string | null;
  is_active: boolean;
  frequency: 'monthly' | 'weekly' | 'yearly';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedActions?: string[];
}

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  category?: string;
}

export interface ReceiptData {
  merchant?: string;
  date?: string;
  items: ReceiptItem[];
  subtotal?: number;
  tax?: number;
  total: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id: string | null;
  destination_wallet_id?: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  source: TransactionSource;
  receipt_data?: ReceiptData | null;
  transaction_time: string; // ISO String in WIB
  created_at: string;
  // joined fields
  wallet?: Wallet;
  category?: Category;
  destination_wallet?: Wallet;
}

export interface TelegramBotRecord {
  id: string;
  user_id: string;
  bot_token: string;
  bot_username?: string | null;
  is_active: boolean;
  webhook_url?: string | null;
  webhook_status: BotWebhookStatus;
  last_tested_at?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TelegramUpdateRecord {
  update_id: number;
  user_id?: string | null;
  chat_id: number;
  message_text?: string | null;
  message_type: TelegramMessageType;
  status: UpdateStatus;
  error_message?: string | null;
  processed_at: string;
}

export interface ReminderSetting {
  id: string;
  user_id: string;
  is_enabled: boolean;
  frequency: 1 | 2;
  time_1: string; // e.g. "12:00:00"
  time_2: string | null; // e.g. "20:00:00"
  preview_message: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  plan: SubscriptionTier;
  status: SubscriptionStatus;
  payment_method: PaymentMethod;
  midtrans_order_id?: string | null;
  midtrans_transaction_id?: string | null;
  amount: number;
  approved_by?: string | null;
  proof_image_url?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExportHistoryRecord {
  id: string;
  user_id: string;
  file_type: 'pdf' | 'excel';
  period_start: string;
  period_end: string;
  file_name: string;
  storage_path: string;
  download_url?: string | null;
  file_size_kb: number;
  created_at: string;
}

export interface AiConfigRecord {
  id: string;
  provider: AiProviderName;
  display_name: string;
  model_name: string;
  api_key_encrypted: string;
  is_active: boolean;
  priority: number;
  mode: AiExecutionMode;
  created_at: string;
  updated_at: string;
}

export interface AiLogRecord {
  id: string;
  user_id?: string | null;
  provider: string;
  feature: 'nlp_parser' | 'voice_stt' | 'receipt_ocr' | 'advisor' | 'onboarding_category';
  prompt_summary?: string | null;
  response_status: 'success' | 'failed';
  latency_ms: number;
  tokens_used: number;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  admin_id: string;
  target_user_id: string;
  action: string;
  metadata?: Record<string, unknown>;
  ip_address?: string | null;
  created_at: string;
}

export interface BudgetRecord {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: string;
  alert_threshold_percent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionItemRecord {
  id: string;
  transaction_id: string;
  name: string;
  quantity: number;
  price: number;
  category_id?: string | null;
  created_at: string;
}

// Aliases for 12 core table models
export type BotConnectionRecord = TelegramBotRecord;
export type OrderPaymentRecord = SubscriptionRecord;
export type AiProviderRecord = AiConfigRecord;

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'treasurer' | 'member';
  avatar_url: string;
  joined_at: string;
}

export interface Team {
  id: string;
  name: string;
  category: 'Keluarga' | 'SaaS & Startup' | 'Bisnis & UMKM' | 'Event & Komunitas' | 'Investasi & Proyek';
  emoji: string;
  description: string;
  shared_balance: number;
  monthly_budget: number;
  spent_this_month: number;
  members_count: number;
  members: TeamMember[];
  status: 'active' | 'warning' | 'audit';
  created_at: string;
}

export interface BroadcastRecord {
  id: string;
  title: string;
  message: string;
  target: 'all' | 'pro' | 'starter' | 'pending';
  channel: 'all' | 'telegram' | 'whatsapp';
  sent_by: string;
  recipient_count: number;
  status: 'sent' | 'draft' | 'scheduled';
  created_at: string;
}

export interface SystemSettingsRecord {
  site_name: string;
  admin_name: string;
  admin_phone: string;
  admin_email: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  starter_tx_limit: number;
  pro_price_idr: number;
  ocr_receipt_daily_limit: number;
  ai_daily_limit_starter: number;
  auto_backup_enabled: boolean;
  updated_at: string;
}

