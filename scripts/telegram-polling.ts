/**
 * TataDana — Telegram Long Polling Worker
 * Khusus lingkungan localhost / development tanpa perlu Webhook HTTPS publik.
 * Menjemput pesan secara langsung dari Telegram API dan meneruskannya ke backend TataDana.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dns from 'dns';

// Force IPv4 first to prevent undici connect timeouts on Windows
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

// Load .env.local if present
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && !process.env[match[1]]) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[match[1]] = value.trim();
      }
    });
  }
} catch (e) {}

const cliToken = process.argv.slice(2).find(arg => arg !== '--' && arg.includes(':'))
  || (process.argv[2] && process.argv[2] !== '--' ? process.argv[2] : '')
  || process.env.TELEGRAM_BOT_TOKEN
  || '8699261518:AAFC093RwlBGHgvptTQFKd1pdaZ_qMlgUqE';

const token = cliToken;
const WEBHOOK_LOCAL_URL = process.env.LOCAL_WEBHOOK_URL || 'http://localhost:3000/api/telegram/webhook';

function log(msg: string) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' });
  console.log(`[${timeStr} WIB] ${msg}`);
}

async function startPolling() {
  console.log('====================================================');
  console.log('  TATADANA — TELEGRAM BOT LONG POLLING ENGINE');
  console.log('====================================================');

  const isDemoToken = !token || !token.includes(':') || token.includes('Example');

  if (isDemoToken) {
    log('⚠️ Token Bot Telegram belum diatur atau masih menggunakan token demo.');
    log('💡 Cara mengaktifkan bot:');
    log('   1. Buka @BotFather di Telegram');
    log('   2. Salin token API bot kamu');
    log('   3. Masukkan token di file .env.local: TELEGRAM_BOT_TOKEN=<token_kamu>');
    console.log('----------------------------------------------------');
  }

  const activeToken = token;

  // 1. Check getMe
  try {
    let botName = 'tatadana digital';
    let botUsername = 'tatadanasalwabot';

    if (!isDemoToken) {
      const meRes = await fetch(`https://api.telegram.org/bot${activeToken}/getMe`);
      const meData = await meRes.json();
      if (!meData.ok) {
        log(`❌ Gagal memverifikasi token bot: ${meData.description || 'Token tidak valid'}`);
        process.exit(1);
      }
      botName = meData.result?.first_name || botName;
      botUsername = meData.result?.username || botUsername;
    }

    log(`🟢 Terhubung ke bot Telegram: "${botName}" (@${botUsername})`);

    // 2. Clear old webhook so getUpdates is allowed
    log('🧹 Menghapus webhook lama untuk membuka akses Long Polling...');
    try {
      const delRes = await fetch(`https://api.telegram.org/bot${activeToken}/deleteWebhook?drop_pending_updates=false`, {
        method: 'POST'
      });
      const delData = await delRes.json();
      log(`✓ Webhook status: ${delData.description || 'OK'}`);
    } catch (e: any) {
      log(`ℹ️ Webhook reset: ${e.message}`);
    }

    log(`📡 Long Polling aktif! Menjemput pesan langsung dari Telegram API...`);
    log(`🎯 Target forward backend: ${WEBHOOK_LOCAL_URL}`);
    console.log('----------------------------------------------------');

    let offset = 0;
    let isRunning = true;

    process.on('SIGINT', () => {
      log('🛑 Mematikan Long Polling...');
      isRunning = false;
      process.exit(0);
    });

    while (isRunning) {
      try {
        const url = `https://api.telegram.org/bot${activeToken}/getUpdates?timeout=3&offset=${offset}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        const data = await res.json();

        if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
          for (const update of data.result) {
            offset = update.update_id + 1;
            const msg = update.message;

            // Log pesan diterima
            console.log("Pesan diterima:", msg?.text, "dari:", msg?.chat?.id);

            // Handler untuk /start
            if (msg?.text === '/start' || (msg?.text && msg.text.startsWith('/start') && !msg.text.startsWith('/start link_'))) {
              try {
                await fetch(`https://api.telegram.org/bot${activeToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: msg.chat.id,
                    text: 'Halo salwa L Bot TataDana siap mencatat keuanganmu.'
                  }),
                  signal: AbortSignal.timeout(10000)
                });
              } catch (sendErr: any) {
                console.error('[Telegram Error sendMessage /start]:', sendErr.message || sendErr);
              }
            }

            // Forward to local Next.js Webhook
            try {
              const forwardRes = await fetch(WEBHOOK_LOCAL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(update),
                signal: AbortSignal.timeout(15000)
              });
              const forwardData = await forwardRes.json();
              if (forwardRes.ok) {
                log(`✓ Transaksi berhasil diproses & disimpan ke dashboard web!`);
                if (forwardData.reply) {
                  console.log('\n--- 🧾 Struk Balasan Telegram ---');
                  console.log(forwardData.reply);
                  console.log('--------------------------------\n');

                  // Kirim balasan struk ke pengguna jika bukan /start
                  if (msg?.text !== '/start' && msg?.chat?.id) {
                    try {
                      await fetch(`https://api.telegram.org/bot${activeToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          chat_id: msg.chat.id,
                          text: forwardData.reply
                        }),
                        signal: AbortSignal.timeout(10000)
                      });
                    } catch (replySendErr: any) {
                      console.error('[Telegram Error sendMessage receipt]:', replySendErr.message || replySendErr);
                    }
                  }
                }
              } else {
                log(`⚠️ Gagal memproses transaksi di backend: ${forwardData.error || 'Server error'}`);
              }
            } catch (err: any) {
              log(`⚠️ Gagal menghubungi server web lokal (${WEBHOOK_LOCAL_URL}): ${err.message}`);
            }
          }
        } else if (!data.ok) {
          log(`⚠️ Telegram API Error: ${data.description}`);
          await new Promise(r => setTimeout(r, 2000));
        } else {
          // No updates, brief interval before next poll
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err: any) {
        const errMsg = err?.cause?.message ? `${err.message} (${err.cause.message})` : err.message;
        log(`⚠️ Polling error: ${errMsg}. Mencoba kembali dalam 2 detik...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  } catch (err: any) {
    log(`❌ Error inisialisasi: ${err.message}`);
  }
}

startPolling();
