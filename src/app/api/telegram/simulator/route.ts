import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';
import { parseIndonesianText } from '@/lib/telegram/parser';
import { formatExpenseReply, formatIncomeReply, formatReceiptReply } from '@/lib/telegram/formatter';
import { handleBotCommand } from '@/lib/telegram/commandHandlers';
import { dataService } from '@/lib/supabase/client';
import { aiService } from '@/lib/ai/multiProvider';

export async function POST(req: Request) {
  try {
    const { text, type = 'text', userId = 'usr-budi-12345' } = await req.json();
    const user = await dataService.getProfile(userId) || mockStore.profiles[0];
    const defaultWallet = await dataService.getDefaultWallet(userId) || mockStore.wallets[0];

    // Command
    if (type === 'command' || text?.startsWith('/')) {
      const reply = await handleBotCommand(text, userId);
      return NextResponse.json({ success: true, reply, type: 'command' });
    }

    // Photo receipt simulator
    if (type === 'photo') {
      if (user.subscription_tier === 'starter') {
        return NextResponse.json({
          success: true,
          type: 'pro_gate',
          reply: `🔒 Fitur Foto Struk Khusus TataDana Pro!\n\nUser paket Starter hanya dapat mencatat via Teks dan Voice Note. Upgrade ke TataDana Pro (Rp99.000 Sekali Bayar) untuk OCR struk otomatis & AI Financial Advisor!`,
        });
      }

      const receiptData = await aiService.execute({ feature: 'receipt_ocr', prompt: 'receipt', userId });
      const categories = await dataService.getCategories(userId);
      const cat = categories.find(c => c.name.toLowerCase().includes('makan')) || categories[0];

      await dataService.addTransaction({
        user_id: userId,
        wallet_id: defaultWallet.id,
        category_id: cat.id,
        type: 'expense',
        amount: receiptData.total,
        description: `Struk Belanja - ${receiptData.merchant}`,
        source: 'telegram_receipt',
        receipt_data: receiptData,
        transaction_time: new Date().toISOString(),
      });

      const updatedWallet = await dataService.getDefaultWallet(userId) || defaultWallet;
      const reply = formatReceiptReply({
        merchant: receiptData.merchant,
        total: receiptData.total,
        itemCount: receiptData.items.length,
        category: cat,
        wallet: updatedWallet,
        newBalance: updatedWallet.balance,
        items: receiptData.items,
      });

      return NextResponse.json({ success: true, reply, type: 'photo' });
    }

    // Voice Note simulator
    if (type === 'voice') {
      const stt = await aiService.execute({ feature: 'voice_stt', prompt: text || 'beli kopi 25rb', userId });
      const transcript = stt.transcript;
      const parsed = parseIndonesianText(transcript);
      if (!parsed.success || !parsed.data) {
        return NextResponse.json({
          success: true,
          reply: `🎙️ Transkrip: "${transcript}"\n\n⚠️ AI belum dapat memahami nominal transaksi dari suara kamu. Silakan ulangi VN lebih jelas atau ketik manual.`,
          type: 'voice'
        });
      }

      const cat = (await dataService.getCategories(userId)).find(c => c.name === parsed.data?.categoryName) || (await dataService.getCategories(userId))[0];
      await dataService.addTransaction({
        user_id: userId,
        wallet_id: defaultWallet.id,
        category_id: cat.id,
        type: parsed.data.type,
        amount: parsed.data.amount,
        description: parsed.data.description,
        source: 'telegram_voice',
        transaction_time: new Date().toISOString(),
      });

      const updatedWallet = await dataService.getDefaultWallet(userId) || defaultWallet;
      const reply = formatExpenseReply({
        amount: parsed.data.amount,
        category: cat,
        wallet: updatedWallet,
        description: parsed.data.description,
        newBalance: updatedWallet.balance,
        monthlySpent: 1450000 + parsed.data.amount,
        monthlyBudget: cat.monthly_budget,
        transcript,
      });

      return NextResponse.json({ success: true, reply, type: 'voice' });
    }

    // Text NLP
    const parsed = parseIndonesianText(text);
    if (!parsed.success || !parsed.data) {
      return NextResponse.json({
        success: false,
        reply: parsed.errorMessage,
      });
    }

    const categories = await dataService.getCategories(userId);
    let cat = categories.find(c => c.name.toLowerCase() === parsed.data!.categoryName.toLowerCase());
    if (!cat) {
      cat = await dataService.addCategory({
        user_id: userId,
        name: parsed.data.categoryName,
        emoji: parsed.data.categoryEmoji,
        type: parsed.data.type,
        color: '#F97316',
        monthly_budget: parsed.data.type === 'expense' ? 1000000 : 0,
      });
    }

    await dataService.addTransaction({
      user_id: userId,
      wallet_id: defaultWallet.id,
      category_id: cat.id,
      type: parsed.data.type,
      amount: parsed.data.amount,
      description: parsed.data.description,
      source: 'telegram_text',
      transaction_time: new Date().toISOString(),
    });

    const updatedWallet = await dataService.getDefaultWallet(userId) || defaultWallet;

    let reply = '';
    if (parsed.data.type === 'income') {
      reply = formatIncomeReply({
        amount: parsed.data.amount,
        wallet: updatedWallet,
        newBalance: updatedWallet.balance,
      });
    } else {
      reply = formatExpenseReply({
        amount: parsed.data.amount,
        category: cat,
        wallet: updatedWallet,
        description: parsed.data.description,
        newBalance: updatedWallet.balance,
        monthlySpent: 1250000 + parsed.data.amount,
        monthlyBudget: cat.monthly_budget,
      });
    }

    return NextResponse.json({ success: true, reply, type: parsed.data.type });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error processing simulator' }, { status: 500 });
  }
}
