import { createClient } from '@supabase/supabase-js';
import { mockStore } from './mockStore';
import { 
  Profile, 
  Wallet, 
  Category, 
  Transaction, 
  TelegramBotRecord, 
  SubscriptionRecord, 
  ReminderSetting,
  Team
} from '@/types/database';
import { decryptToken } from '../utils/encryption';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tatadana-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Service Layer that seamlessly proxies data from Supabase if configured,
 * or mockStore for reliable development and offline testing.
 */
export const dataService = {
  // --- Profile ---
  async getProfile(userId: string = 'usr-budi-12345'): Promise<Profile | null> {
    const found = mockStore.profiles.find(p => p.id === userId);
    return found || null;
  },

  async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile> {
    const idx = mockStore.profiles.findIndex(p => p.id === userId);
    if (idx !== -1) {
      mockStore.profiles[idx] = { ...mockStore.profiles[idx], ...data, updated_at: new Date().toISOString() };
      mockStore.saveToFile();
      return mockStore.profiles[idx];
    }
    throw new Error('Profile not found');
  },

  // --- Wallets ---
  async getWallets(userId: string = 'usr-budi-12345'): Promise<Wallet[]> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/wallets?userId=${encodeURIComponent(userId)}`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return mockStore.wallets.filter(w => w.user_id === userId);
  },

  async getDefaultWallet(userId: string = 'usr-budi-12345'): Promise<Wallet | null> {
    const wallets = await this.getWallets(userId);
    return wallets.find(w => w.is_default) || wallets[0] || null;
  },

  async addWallet(wallet: Omit<Wallet, 'id' | 'created_at' | 'updated_at'>): Promise<Wallet> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(wallet),
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    const newWallet: Wallet = {
      ...wallet,
      id: `wlt-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (newWallet.is_default) {
      mockStore.wallets.forEach(w => {
        if (w.user_id === newWallet.user_id) w.is_default = false;
      });
    }
    mockStore.wallets.push(newWallet);
    mockStore.saveToFile();
    return newWallet;
  },

  async updateWallet(id: string, data: Partial<Wallet>): Promise<Wallet> {
    const idx = mockStore.wallets.findIndex(w => w.id === id);
    if (idx === -1) throw new Error('Wallet not found');
    if (data.is_default) {
      mockStore.wallets.forEach(w => {
        if (w.user_id === mockStore.wallets[idx].user_id) w.is_default = false;
      });
    }
    mockStore.wallets[idx] = { ...mockStore.wallets[idx], ...data, updated_at: new Date().toISOString() };
    mockStore.saveToFile();
    return mockStore.wallets[idx];
  },

  // --- Categories ---
  async getCategories(userId: string = 'usr-budi-12345'): Promise<Category[]> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/categories?userId=${encodeURIComponent(userId)}`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return mockStore.categories.filter(c => c.user_id === userId);
  },

  async addCategory(cat: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockStore.categories.push(newCat);
    mockStore.saveToFile();
    return newCat;
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const idx = mockStore.categories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Category not found');
    mockStore.categories[idx] = { ...mockStore.categories[idx], ...data, updated_at: new Date().toISOString() };
    mockStore.saveToFile();
    return mockStore.categories[idx];
  },

  // --- Transactions ---
  async getTransactions(userId: string = 'usr-budi-12345'): Promise<Transaction[]> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/transactions?userId=${encodeURIComponent(userId)}`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    const txs = mockStore.transactions.filter(t => t.user_id === userId);
    return txs.map(t => ({
      ...t,
      wallet: mockStore.wallets.find(w => w.id === t.wallet_id),
      category: mockStore.categories.find(c => c.id === t.category_id),
      destination_wallet: t.destination_wallet_id ? mockStore.wallets.find(w => w.id === t.destination_wallet_id) : undefined
    })).sort((a, b) => new Date(b.transaction_time).getTime() - new Date(a.transaction_time).getTime());
  },

  async addTransaction(tx: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tx),
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    mockStore.transactions.unshift(newTx);

    // Update wallet balance automatically
    const wallet = mockStore.wallets.find(w => w.id === newTx.wallet_id);
    if (wallet) {
      if (newTx.type === 'income') {
        wallet.balance += newTx.amount;
      } else if (newTx.type === 'expense') {
        wallet.balance -= newTx.amount;
      } else if (newTx.type === 'transfer' && newTx.destination_wallet_id) {
        wallet.balance -= newTx.amount;
        const destWallet = mockStore.wallets.find(w => w.id === newTx.destination_wallet_id);
        if (destWallet) destWallet.balance += newTx.amount;
      }
    }

    mockStore.saveToFile();
    return newTx;
  },

  // --- Telegram Bot & Updates ---
  async getBotByToken(token: string): Promise<TelegramBotRecord | null> {
    return mockStore.telegramBots.find(b => {
      const plain = decryptToken(b.bot_token);
      return plain === token || b.bot_token === token;
    }) || null;
  },

  async getBotByUserId(userId: string = 'usr-budi-12345'): Promise<TelegramBotRecord | null> {
    const found = mockStore.telegramBots.find(b => b.user_id === userId);
    if (!found) return null;
    const decrypted = decryptToken(found.bot_token);
    const envToken = process.env.TELEGRAM_BOT_TOKEN;
    const effectiveToken = (decrypted.toLowerCase().includes('example') && envToken && !envToken.toLowerCase().includes('example'))
      ? envToken.trim()
      : decrypted;

    return {
      ...found,
      bot_token: effectiveToken,
    };
  },

  async saveBotConfig(bot: Omit<TelegramBotRecord, 'id' | 'created_at' | 'updated_at'>): Promise<TelegramBotRecord> {
    const existing = mockStore.telegramBots.find(b => b.user_id === bot.user_id);
    if (existing) {
      Object.assign(existing, bot, { updated_at: new Date().toISOString() });
      mockStore.saveToFile();
      return existing;
    }
    const newRecord: TelegramBotRecord = {
      ...bot,
      id: `bot-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockStore.telegramBots.push(newRecord);
    mockStore.saveToFile();
    return newRecord;
  },

  // --- Subscriptions ---
  async getSubscription(userId: string = 'usr-budi-12345'): Promise<SubscriptionRecord | null> {
    return mockStore.subscriptions.find(s => s.user_id === userId) || null;
  },

  // --- Reminders ---
  async getReminder(userId: string = 'usr-budi-12345'): Promise<ReminderSetting | null> {
    return mockStore.reminders.find(r => r.user_id === userId) || null;
  },

  async updateReminder(userId: string, data: Partial<ReminderSetting>): Promise<ReminderSetting> {
    const existing = mockStore.reminders.find(r => r.user_id === userId);
    if (existing) {
      Object.assign(existing, data, { updated_at: new Date().toISOString() });
      return existing;
    }
    const newRem: ReminderSetting = {
      id: `rem-${Date.now()}`,
      user_id: userId,
      is_enabled: true,
      frequency: (data.frequency as 1 | 2) || 1,
      time_1: data.time_1 || '12:00:00',
      time_2: data.time_2 || null,
      preview_message: data.preview_message || '⏰ Reminder Keuangan! Jangan lupa catat pengeluaran hari ini ya 📝',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockStore.reminders.push(newRem);
    return newRem;
  },

  // --- Recurring Bills & Calendar ---
  async getRecurringBills(userId: string = 'usr-budi-12345'): Promise<import('@/types/database').RecurringBill[]> {
    return mockStore.recurringBills.filter(b => b.user_id === userId);
  },

  async addRecurringBill(bill: Omit<import('@/types/database').RecurringBill, 'id'>): Promise<import('@/types/database').RecurringBill> {
    const newBill: import('@/types/database').RecurringBill = {
      ...bill,
      id: `bill-${Date.now()}`,
    };
    mockStore.recurringBills.push(newBill);
    return newBill;
  },

  // --- Wallet Transfers ---
  async transferBetweenWallets(
    userId: string,
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    notes: string = 'Transfer antar dompet'
  ): Promise<{ success: boolean; transaction: Transaction }> {
    if (!fromWalletId || !toWalletId || fromWalletId === toWalletId) {
      throw new Error('Dompet asal dan tujuan tidak boleh sama');
    }
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new Error('Jumlah transfer harus lebih dari 0');
    }

    const fromWallet = mockStore.wallets.find(w => w.id === fromWalletId);
    const toWallet = mockStore.wallets.find(w => w.id === toWalletId);

    if (!fromWallet || !toWallet) {
      throw new Error('Dompet asal atau tujuan tidak ditemukan');
    }
    if (fromWallet.user_id !== userId || toWallet.user_id !== userId) {
      throw new Error('Dompet bukan milik pengguna');
    }
    if (fromWallet.balance < amount) {
      throw new Error('Saldo dompet asal tidak mencukupi untuk transfer');
    }

    const tx = await this.addTransaction({
      user_id: userId,
      wallet_id: fromWalletId,
      destination_wallet_id: toWalletId,
      category_id: null,
      type: 'transfer',
      amount,
      description: notes,
      source: 'web_manual',
      transaction_time: new Date().toISOString(),
    });

    return { success: true, transaction: tx };
  },

  // --- Multi-User & Teams ---
  async getAllProfiles(): Promise<Profile[]> {
    return mockStore.profiles;
  },

  async getTeams(): Promise<Team[]> {
    return mockStore.teams;
  },

  async getTeamById(id: string): Promise<Team | null> {
    return mockStore.teams.find(t => t.id === id) || null;
  }
};
