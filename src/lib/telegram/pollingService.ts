import { TelegramBotClient } from './botClient';
import { mockStore } from '../supabase/mockStore';
import { decryptToken } from '../utils/encryption';

export interface PollingStatus {
  isRunning: boolean;
  botName: string;
  botUsername: string;
  lastPollTime: string | null;
  lastUpdateId: number | null;
  processedCount: number;
  lastMessageText: string | null;
  mode: 'long_polling' | 'webhook';
  error: string | null;
  maskedToken: string;
}

export class TelegramPollingService {
  private static instance: TelegramPollingService;
  private isRunning: boolean = false;
  private abortController: AbortController | null = null;
  private currentOffset: number = 0;
  private botName: string = 'Tata dana siti hawa';
  private botUsername: string = 'TataDanaSitiHawa_bot';
  private lastPollTime: string | null = null;
  private lastUpdateId: number | null = null;
  private processedCount: number = 0;
  private lastMessageText: string | null = null;
  private lastError: string | null = null;
  private activeToken: string = '';

  private constructor() {}

  public static getInstance(): TelegramPollingService {
    if (!(globalThis as any).__tataDanaTelegramPoller) {
      (globalThis as any).__tataDanaTelegramPoller = new TelegramPollingService();
    } else {
      Object.setPrototypeOf((globalThis as any).__tataDanaTelegramPoller, TelegramPollingService.prototype);
    }
    return (globalThis as any).__tataDanaTelegramPoller;
  }

  public getStatus(): PollingStatus {
    const token = this.resolveToken();
    const masked = token && token.includes(':')
      ? `${token.slice(0, 8)}...${token.slice(-4)}`
      : 'Belum diatur';

    return {
      isRunning: this.isRunning,
      botName: this.botName,
      botUsername: this.botUsername,
      lastPollTime: this.lastPollTime,
      lastUpdateId: this.lastUpdateId,
      processedCount: this.processedCount,
      lastMessageText: this.lastMessageText,
      mode: 'long_polling',
      error: this.lastError,
      maskedToken: masked,
    };
  }

  public getActiveToken(): string {
    return this.resolveToken();
  }

  public getBotInfo(): { name: string; username: string } {
    return { name: this.botName, username: this.botUsername };
  }

  private resolveToken(explicitToken?: string): string {
    if (explicitToken && explicitToken.trim()) {
      return explicitToken.trim();
    }
    if (this.activeToken && this.activeToken.trim()) {
      return this.activeToken.trim();
    }
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN.includes(':') && !process.env.TELEGRAM_BOT_TOKEN.toLowerCase().includes('example')) {
      return process.env.TELEGRAM_BOT_TOKEN.trim();
    }
    const storeBot = mockStore.telegramBots[0]?.bot_token;
    if (storeBot && storeBot.trim()) {
      return decryptToken(storeBot.trim());
    }
    return process.env.TELEGRAM_BOT_TOKEN || '';
  }

  public async start(tokenInput?: string): Promise<{ ok: boolean; message?: string; botUsername?: string; error?: string }> {
    const token = this.resolveToken(tokenInput);

    if (!token || !token.includes(':')) {
      this.lastError = 'Token bot tidak valid atau belum diatur.';
      return {
        ok: false,
        error: 'Format token bot Telegram tidak valid. Dapatkan token dari @BotFather di Telegram.',
        message: 'Token bot belum valid.',
      };
    }

    this.activeToken = token;

    // Verify token with Telegram API
    const me = await TelegramBotClient.getMe(token);
    if (!me.ok) {
      this.lastError = me.description || 'Gagal memverifikasi token ke Telegram API';
      return {
        ok: false,
        error: me.description || 'Token bot tidak valid menurut Telegram API.',
        message: me.description || 'Token bot tidak valid.',
      };
    }

    this.botName = me.result?.first_name || 'Tata dana siti hawa';
    this.botUsername = me.result?.username || 'TataDanaSitiHawa_bot';

    // Delete webhook to clear any lock on Telegram API for Long Polling
    await TelegramBotClient.deleteWebhook(token, false);

    if (this.isRunning) {
      return {
        ok: true,
        message: `Long Polling sudah aktif untuk bot @${this.botUsername} (${this.botName}).`,
        botUsername: `@${this.botUsername}`,
      };
    }

    this.isRunning = true;
    this.lastError = null;
    this.abortController = new AbortController();

    // Start background loop
    this.runPollingLoop(token).catch(err => {
      console.error('[Telegram Polling Loop Error]:', err);
    });

    return {
      ok: true,
      message: `🟢 Long Polling aktif untuk bot @${this.botUsername} (${this.botName})! Server lokal siap menjemput pesan langsung dari Telegram.`,
      botUsername: `@${this.botUsername}`,
    };
  }

  public stop(): { ok: boolean; message: string } {
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    return {
      ok: true,
      message: 'Long Polling Telegram telah dihentikan.',
    };
  }

  private async runPollingLoop(token: string): Promise<void> {
    console.log(`[Telegram Polling] Memulai Long Polling untuk @${this.botUsername} (${this.botName})...`);

    while (this.isRunning) {
      try {
        this.lastPollTime = new Date().toISOString();
        const response = await TelegramBotClient.getUpdates(
          token,
          this.currentOffset,
          20,
          this.abortController?.signal
        );

        if (!this.isRunning) break;

        if (response.ok && Array.isArray(response.result) && response.result.length > 0) {
          for (const update of response.result) {
            this.lastUpdateId = update.update_id;
            this.currentOffset = update.update_id + 1;
            this.processedCount++;

            const incomingText = update.message?.text || update.message?.caption || '';
            if (incomingText) {
              this.lastMessageText = incomingText;
            }

            if (update.message) {
              console.log("Pesan diterima:", update.message.text, "dari:", update.message.chat.id);
            }

            // Direct in-process handling of message (/start, transactions, etc.)
            try {
              const { handleIncomingTelegramUpdate } = await import('./updateHandler');
              await handleIncomingTelegramUpdate(update, token);
            } catch (err: any) {
              console.error('[Telegram Polling Handler Error]:', err.message || err);
              // Fallback to webhook forward
              await this.forwardUpdateToWebhook(update);
            }
          }
        } else if (!response.ok && response.description) {
          this.lastError = response.description;
          // Wait 3 seconds on error before retrying
          await new Promise(r => setTimeout(r, 3000));
        } else {
          // Empty updates, short pause
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err: any) {
        if (!this.isRunning) break;
        if (err.name === 'AbortError') break;

        this.lastError = err.message || 'Error koneksi polling';
        console.warn('[Telegram Polling] Retry setelah error koneksi:', err.message);
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    console.log(`[Telegram Polling] Long Polling dihentikan.`);
  }

  private async forwardUpdateToWebhook(update: any): Promise<void> {
    const baseUrl = process.env.APP_URL || process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';
    const webhookUrls = [
      `${baseUrl}/api/telegram/webhook`,
      'http://localhost:3000/api/telegram/webhook',
      'http://127.0.0.1:3000/api/telegram/webhook',
    ];

    for (const url of Array.from(new Set(webhookUrls))) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });
        if (res.ok) {
          return;
        }
      } catch (err) {
        // Retry next url
      }
    }

    // Direct in-process fallback if HTTP loopback is unreachable
    try {
      const { POST: webhookHandler } = await import('../../app/api/telegram/webhook/route');
      const directReq = new Request('http://localhost:3000/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      await webhookHandler(directReq);
    } catch (fallbackErr: any) {
      console.error('[Telegram Polling] Gagal memproses update:', fallbackErr.message);
    }
  }
}

export const pollingService = TelegramPollingService.getInstance();
