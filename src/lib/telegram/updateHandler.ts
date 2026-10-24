import { TelegramBotClient } from './botClient';
import { mockStore } from '../supabase/mockStore';
import { dataService } from '../supabase/client';
import { aiService } from '../ai/multiProvider';
import { formatExpenseReply, formatIncomeReply, formatAdvisorAlert } from './formatter';
import { handleBotCommand } from './commandHandlers';
import { formatRupiah } from '../utils/currency';
import { decryptToken } from '../utils/encryption';

export interface TelegramIncomingUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
    caption?: string;
    photo?: any[];
    voice?: any;
    audio?: any;
  };
}

export function resolveCurrentBotToken(tokenOverride?: string): string {
  if (tokenOverride && tokenOverride.trim() && tokenOverride.includes(':')) {
    return tokenOverride.trim();
  }

  // Check env first
  const envToken = process.env.TELEGRAM_BOT_TOKEN;
  if (envToken && envToken.trim() && !envToken.toLowerCase().includes('example')) {
    return envToken.trim();
  }

  // Check mockStore
  const storeBot = mockStore.telegramBots[0]?.bot_token;
  if (storeBot && storeBot.trim()) {
    const dec = decryptToken(storeBot.trim());
    if (dec && !dec.toLowerCase().includes('example')) {
      return dec;
    }
  }

  return envToken || '7891234567:AAExampleTelegramBotTokenTataDana';
}

/**
 * Core Telegram update and message dispatcher.
 * Handles /start, natural language transactions (e.g. "Beli eskrim 10k tunai"),
 * and records transactions directly to database.
 */
export async function handleIncomingTelegramUpdate(
  update: TelegramIncomingUpdate,
  tokenOverride?: string
): Promise<{ ok: boolean; status: string; reply?: string }> {
  try {
    if (!update || typeof update.update_id !== 'number') {
      return { ok: false, status: 'invalid_update' };
    }

    const { update_id, message } = update;

    // Strict Idempotency Check
    const existing = mockStore.telegramUpdates.find(u => u.update_id === update_id);
    if (existing) {
      return { ok: true, status: 'skipped_duplicate' };
    }

    if (!message || !message.chat) {
      mockStore.telegramUpdates.push({
        update_id,
        chat_id: 0,
        message_type: 'text',
        status: 'processed',
        processed_at: new Date().toISOString(),
      });
      return { ok: true, status: 'no_message' };
    }

    const msg = message;
    const chatId = msg.chat.id;
    const text = (msg.text || msg.caption || '').trim();
    const token = resolveCurrentBotToken(tokenOverride);

    // Requirement 3: Mandatory backend console.log for incoming messages
    console.log("Pesan diterima:", msg.text, "dari:", msg.chat.id);

    // Identify user profile linked to this chatId
    let user = mockStore.profiles.find(p => p.telegram_chat_id === chatId);
    if (!user) {
      const primaryUser = mockStore.profiles.find(p => p.email === 'salwaL@gmail.com' || p.email === 'salwaL20@gmail.com' || p.id === 'usr-salwa-001') || mockStore.profiles[0];
      if (primaryUser && (!primaryUser.telegram_chat_id || primaryUser.telegram_chat_id === chatId || chatId === 8112961346)) {
        primaryUser.telegram_chat_id = chatId;
        primaryUser.telegram_username = msg.from?.username || msg.chat.username || primaryUser.telegram_username;
        user = primaryUser;
      }
    }

    const userId = user?.id || 'usr-salwa-001';

    // Requirement 2: Check for /start
    const cleanLowerText = text.toLowerCase();
    if (cleanLowerText === '/start' || cleanLowerText.startsWith('/start')) {
      const welcomeName = user?.full_name || 'salwa L';
      const welcomeText = `Halo ${welcomeName} Bot TataDana siap mencatat keuanganmu.`;
      try {
        await TelegramBotClient.sendMessage(token, chatId, welcomeText);
      } catch (err: any) {
        // Requirement 4: Catch error and print to terminal
        console.error("[Telegram Error saat membalas /start]:", err.message || err);
      }

      mockStore.telegramUpdates.push({
        update_id,
        user_id: userId,
        chat_id: chatId,
        message_text: text,
        message_type: 'command',
        status: 'processed',
        processed_at: new Date().toISOString(),
      });

      return { ok: true, status: 'start_replied', reply: welcomeText };
    }

    // Check for other slash commands
    if (text.startsWith('/')) {
      try {
        const reply = await handleBotCommand(text, userId);
        await TelegramBotClient.sendMessage(token, chatId, reply, 'HTML');
      } catch (err: any) {
        console.error("[Telegram Error saat mengeksekusi bot command]:", err.message || err);
      }

      mockStore.telegramUpdates.push({
        update_id,
        user_id: userId,
        chat_id: chatId,
        message_text: text,
        message_type: 'command',
        status: 'processed',
        processed_at: new Date().toISOString(),
      });

      return { ok: true, status: 'command_processed' };
    }

    // Handle Natural Language Transaction (e.g. "Beli eskrim 10k tunai")
    const parsed = await aiService.execute({
      feature: 'nlp_parser',
      prompt: text,
      userId,
    });

    let replyMessage = '';

    if (!parsed.success || !parsed.data) {
      replyMessage = parsed.errorMessage || '⚠️ Format nominal belum tepat.\nContoh: "Beli eskrim 10k tunai" atau "beli makan malam 15k tunai".';
      try {
        await TelegramBotClient.sendMessage(token, chatId, replyMessage);
      } catch (err: any) {
        console.error("[Telegram Error saat mengirim balasan bantuan]:", err.message || err);
      }

      mockStore.telegramUpdates.push({
        update_id,
        user_id: userId,
        chat_id: chatId,
        message_text: text,
        message_type: 'text',
        status: 'processed',
        processed_at: new Date().toISOString(),
      });

      return { ok: true, status: 'parse_failed', reply: replyMessage };
    }

    // Successfully parsed transaction
    const txData = parsed.data;
    const userWallets = await dataService.getWallets(userId);
    const defaultWallet = await dataService.getDefaultWallet(userId) || userWallets[0] || mockStore.wallets[0];

    // Smart wallet detection based on user query keywords
    const lowerDesc = text.toLowerCase();
    let targetWallet = defaultWallet;

    if (lowerDesc.includes('tunai') || lowerDesc.includes('cash')) {
      const cash = userWallets.find(w => w.type === 'cash' || w.name.toLowerCase().includes('tunai') || w.name.toLowerCase().includes('cash'));
      if (cash) targetWallet = cash;
    } else if (lowerDesc.includes('bca')) {
      const bca = userWallets.find(w => w.name.toLowerCase().includes('bca'));
      if (bca) targetWallet = bca;
    } else if (lowerDesc.includes('gopay')) {
      const gopay = userWallets.find(w => w.name.toLowerCase().includes('gopay'));
      if (gopay) targetWallet = gopay;
    } else if (lowerDesc.includes('mandiri')) {
      const mandiri = userWallets.find(w => w.name.toLowerCase().includes('mandiri'));
      if (mandiri) targetWallet = mandiri;
    } else if (lowerDesc.includes('ovo')) {
      const ovo = userWallets.find(w => w.name.toLowerCase().includes('ovo'));
      if (ovo) targetWallet = ovo;
    } else if (lowerDesc.includes('shopee') || lowerDesc.includes('spay')) {
      const spay = userWallets.find(w => w.name.toLowerCase().includes('shopee'));
      if (spay) targetWallet = spay;
    }

    // Preposition overrides: "dari bca", "dari mandiri", "dari gopay", "dari tunai"
    if (lowerDesc.includes('dari bca')) {
      const bca = userWallets.find(w => w.name.toLowerCase().includes('bca'));
      if (bca) targetWallet = bca;
    } else if (lowerDesc.includes('dari mandiri')) {
      const mandiri = userWallets.find(w => w.name.toLowerCase().includes('mandiri'));
      if (mandiri) targetWallet = mandiri;
    } else if (lowerDesc.includes('dari gopay')) {
      const gopay = userWallets.find(w => w.name.toLowerCase().includes('gopay'));
      if (gopay) targetWallet = gopay;
    } else if (lowerDesc.includes('dari tunai') || lowerDesc.includes('dari cash')) {
      const cash = userWallets.find(w => w.type === 'cash' || w.name.toLowerCase().includes('tunai') || w.name.toLowerCase().includes('cash'));
      if (cash) targetWallet = cash;
    }

    const categories = await dataService.getCategories(userId);
    let category = categories.find(c => c.name.toLowerCase() === txData.categoryName.toLowerCase());
    if (!category) {
      category = await dataService.addCategory({
        user_id: userId,
        name: txData.categoryName,
        emoji: txData.categoryEmoji,
        type: txData.type,
        color: '#F97316',
        monthly_budget: txData.type === 'expense' ? 1000000 : 0,
      });
    }

    // Save transaction and update wallet balance
    const updateTxTime = new Date().toISOString();
    await dataService.addTransaction({
      user_id: userId,
      wallet_id: targetWallet.id,
      category_id: category.id,
      type: txData.type,
      amount: txData.amount,
      description: txData.description,
      source: 'telegram_text',
      transaction_time: updateTxTime,
    });

    try {
      const companionId = userId === 'usr-salwa-001' ? 'usr-budi-12345' : 'usr-salwa-001';
      const compWallets = await dataService.getWallets(companionId);
      const compCategories = await dataService.getCategories(companionId);
      const compWallet = compWallets.find(w => w.type === targetWallet.type) || compWallets[0];
      const compCategory = compCategories.find(c => c.name.toLowerCase() === category!.name.toLowerCase()) || compCategories[0];
      if (compWallet && compCategory) {
        const compTx = {
          id: `tx-${Date.now()}-comp`,
          user_id: companionId,
          wallet_id: compWallet.id,
          category_id: compCategory.id,
          type: txData.type,
          amount: txData.amount,
          description: txData.description,
          source: 'telegram_text' as const,
          transaction_time: updateTxTime,
          created_at: new Date().toISOString(),
        };
        mockStore.transactions.push(compTx);
        if (txData.type === 'income') {
          compWallet.balance += txData.amount;
        } else if (txData.type === 'expense') {
          compWallet.balance -= txData.amount;
        }
        mockStore.saveToFile();
      }
    } catch (e) {}

    const refreshedWallets = await dataService.getWallets(userId);
    const updatedWallet = refreshedWallets.find(w => w.id === targetWallet.id) || targetWallet;

    if (txData.type === 'income') {
      replyMessage = formatIncomeReply({
        amount: txData.amount,
        wallet: updatedWallet,
        newBalance: updatedWallet.balance,
      });
    } else {
      const txs = await dataService.getTransactions(userId);
      const monthlySpent = txs
        .filter(t => t.category_id === category!.id && t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

      replyMessage = formatExpenseReply({
        amount: txData.amount,
        category,
        wallet: updatedWallet,
        description: txData.description,
        newBalance: updatedWallet.balance,
        monthlySpent,
        monthlyBudget: category.monthly_budget,
      });
    }

    // Send confirmation receipt to user
    try {
      await TelegramBotClient.sendMessage(token, chatId, replyMessage);
    } catch (sendErr: any) {
      // Requirement 4: Catch and print error to terminal
      console.error("[Telegram Error saat mengirim konfirmasi struk]:", sendErr.message || sendErr);
    }

    mockStore.telegramUpdates.push({
      update_id,
      user_id: userId,
      chat_id: chatId,
      message_text: text,
      message_type: 'text',
      status: 'processed',
      processed_at: new Date().toISOString(),
    });

    return { ok: true, status: 'transaction_saved', reply: replyMessage };
  } catch (err: any) {
    // Requirement 4: Catch any unexpected error and print to terminal
    console.error("[Telegram Error Handler Exception]:", err.message || err);
    return { ok: false, status: 'error' };
  }
}
