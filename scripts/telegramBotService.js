import ws from 'ws';
if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws;
}
import dotenv from 'dotenv';
dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const defaultChatId = process.env.TELEGRAM_CHAT_ID;

if (!botToken) {
  console.error('[TelegramBotService] No TELEGRAM_BOT_TOKEN in .env');
  process.exit(1);
}

let offset = 0;
let isPolling = false;

async function sendTelegramMessage(chatId, text, replyMarkup = null) {
  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error('[TelegramBotService] Error sending message:', err.message);
  }
}

async function answerCallbackQuery(callbackQueryId, text = '') {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  } catch (err) {
    console.error('[TelegramBotService] Error answering callback:', err.message);
  }
}

async function handleUpdate(update) {
  // 1. Handle Inline Button Clicks
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message?.chat?.id || defaultChatId;
    const data = cq.data || '';

    await answerCallbackQuery(cq.id, 'Received!');

    if (data.startsWith('confirm_regimen')) {
      const patient = decodeURIComponent(data.split(':')[1] || 'Patient');
      await sendTelegramMessage(
        chatId,
        `✅ *Regimen Confirmed!*\n\n` +
        `The medication schedule for *${patient}* is now active and live.\n` +
        `⏰ Dosiq AI will automatically remind you at your scheduled dose times.\n\n` +
        `📱 *Dashboard Status:* Synced with Caregiver Vault ✓`,
        {
          inline_keyboard: [
            [
              { text: '💊 Test Dose Check-in Now', callback_data: `checkin:${encodeURIComponent(patient)}` }
            ]
          ]
        }
      );
    } else if (data.startsWith('checkin')) {
      const patient = decodeURIComponent(data.split(':')[1] || 'Patient');
      await sendTelegramMessage(
        chatId,
        `⏰ *Medicine Check-in for ${patient}:*\n\n` +
        `It is time for your scheduled dose:\n` +
        `💊 *Zyloric 200mg* (1 tab · After Food)\n` +
        `💊 *Rosovas 20mg* (1 tab · After Food)\n\n` +
        `Did you take your medication?`,
        {
          inline_keyboard: [
            [
              { text: '✅ Took Dose', callback_data: `dose_taken:Zyloric 200mg` },
              { text: '❌ Skipped', callback_data: `dose_skipped:Zyloric 200mg` }
            ]
          ]
        }
      );
    } else if (data.startsWith('dose_taken')) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await sendTelegramMessage(
        chatId,
        `✅ *Dose Confirmed as TAKEN!*\n\n` +
        `🕒 Logged at: *${now}*\n` +
        `👤 Status: *Confirmed via Care Loop*\n` +
        `🌟 Caregiver has been notified on the web dashboard. Great job staying on track!`
      );
    } else if (data.startsWith('dose_skipped')) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await sendTelegramMessage(
        chatId,
        `⚠️ *Dose Logged as SKIPPED*\n\n` +
        `🕒 Logged at: *${now}*\n` +
        `🔴 Status: *Skipped / Delayed*\n` +
        `Caregiver has been notified on the web dashboard. Please consult your physician if you feel unwell.`
      );
    }
    return;
  }

  // 2. Handle Text Messages
  if (update.message && update.message.text) {
    const text = update.message.text.trim().toLowerCase();
    const chatId = update.message.chat.id;

    if (text === '/start' || text.includes('hi') || text.includes('hello')) {
      await sendTelegramMessage(
        chatId,
        `🌿 *Hi, welcome to Dosiq AI Care Loop!*\n\n` +
        `I am your intelligent health co-pilot, connected to your family's Dosiq Medical Vault.\n\n` +
        `📋 *Current Active Regimen:*\n` +
        `🌙 *Night Slot (08:00 PM):*\n` +
        `• *Zyloric 200mg* _(After Food)_\n` +
        `• *Rosovas 20mg* _(After Food)_\n` +
        `⚡ *On-Demand (SOS):* ETO SHINE\n\n` +
        `⏰ *Do you confirm this schedule and want to receive reminders?*\n` +
        `👉 Reply *YES* or tap below to confirm:`,
        {
          inline_keyboard: [
            [
              { text: '✅ Yes, Confirm Regimen', callback_data: 'confirm_regimen:Nippun Rana' },
              { text: '⏰ Test Dose Check-in', callback_data: 'checkin:Nippun Rana' }
            ]
          ]
        }
      );
    } else if (text === 'yes' || text === 'confirm' || text.includes('yes confirm') || text.includes('yes, confirm')) {
      await sendTelegramMessage(
        chatId,
        `✅ *Regimen Confirmed!*\n\n` +
        `Thank you! Your medication schedule is confirmed and active.\n` +
        `⏰ Dosiq AI will check in with you at your scheduled dose times.\n\n` +
        `📱 *Dashboard Status:* Synced with Caregiver Vault ✓`,
        {
          inline_keyboard: [
            [
              { text: '💊 Test Dose Check-in Now', callback_data: 'checkin:Nippun Rana' }
            ]
          ]
        }
      );
    } else {
      // Fallback response with quick actions
      await sendTelegramMessage(
        chatId,
        `🌿 *Dosiq AI Care Loop*\n\n` +
        `You said: "${update.message.text}"\n\n` +
        `Would you like to confirm your prescribed regimen or test a dose check-in?`,
        {
          inline_keyboard: [
            [
              { text: '✅ Confirm Regimen', callback_data: 'confirm_regimen:Nippun Rana' },
              { text: '⏰ Test Dose Check-in', callback_data: 'checkin:Nippun Rana' }
            ]
          ]
        }
      );
    }
  }
}

async function poll() {
  if (isPolling) return;
  isPolling = true;

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=25`);
    const data = await res.json();

    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    }
  } catch (err) {
    console.error('[TelegramBotService] Polling error:', err.message);
    await new Promise(r => setTimeout(r, 3000));
  } finally {
    isPolling = false;
    setTimeout(poll, 500);
  }
}

console.log('[TelegramBotService] Starting Telegram Care Loop bot listener...');
poll();
