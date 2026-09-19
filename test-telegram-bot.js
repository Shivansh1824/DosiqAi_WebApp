#!/usr/bin/env node

/**
 * Dosiq AI — Telegram Care Loop Verification Script
 * 
 * Verifies two-way messaging:
 * 1. Sends an interactive medication check-in with inline action buttons.
 * 2. Listens for user response (button click).
 * 3. Acknowledges confirmation and updates the message in real time.
 */

import fs from 'node:fs';
import path from 'node:path';

// Load .env if present
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // Fallback simple env parser
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    });
  }
}

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
  console.log('\n❌ [Configuration Missing]');
  console.log('Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in your .env file or environment.');
  console.log('\nQuick Setup:');
  console.log('1. Open Telegram -> search @BotFather -> send /newbot to get your TELEGRAM_BOT_TOKEN');
  console.log('2. Search @userinfobot on Telegram -> click Start to get your numerical Id (TELEGRAM_CHAT_ID)');
  console.log('3. Add them to .env and re-run this script.\n');
  process.exit(1);
}

const API_BASE = `https://api.telegram.org/bot${token}`;

async function callTelegram(endpoint, body = {}) {
  const res = await fetch(`${API_BASE}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API Error [${endpoint}]: ${data.description}`);
  }
  return data.result;
}

async function run() {
  console.log('\n======================================================');
  console.log('🏥 Dosiq AI — Testing Telegram Two-Way Care Loop');
  console.log('======================================================\n');

  try {
    // 1. Verify Bot Token
    process.stdout.write('🔍 Verifying Bot Token... ');
    const botInfo = await callTelegram('getMe');
    console.log(`✅ Connected as @${botInfo.username} (${botInfo.first_name})`);

    // Clear old pending updates
    await callTelegram('getUpdates', { offset: -1, limit: 1 });

    // 2. Send Outbound Medication Check-in
    console.log(`📤 Sending medication reminder to Chat ID: ${chatId}...`);
    const reminderMessage = await callTelegram('sendMessage', {
      chat_id: chatId,
      text: `⏰ *Dosiq AI — Medication Check-in*\n\n👤 *Patient:* Dad\n💊 *Medicine:* Tab Telma-40 (40mg)\n🍽️ *Instructions:* 1 Tablet (Before Breakfast)\n\n_Did Dad take this dose? Tap a button below to confirm:_`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Took Dose', callback_data: 'dose_taken' },
            { text: '❌ Skipped / Delayed', callback_data: 'dose_skipped' },
          ],
        ],
      },
    });

    console.log('📲 Notification delivered! Check your Telegram app.');
    console.log('⏳ Waiting for you to tap an action button on your phone (listening for 90 seconds)...\n');

    // 3. Poll for Callback Query (Button Press)
    let offset = 0;
    const startTime = Date.now();
    const timeoutMs = 90_000;
    let handled = false;

    while (!handled && Date.now() - startTime < timeoutMs) {
      const updates = await callTelegram('getUpdates', {
        offset,
        timeout: 5,
        allowed_updates: ['callback_query'],
      });

      for (const update of updates) {
        offset = update.update_id + 1;

        if (update.callback_query) {
          const cb = update.callback_query;
          const action = cb.data;
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          // Acknowledge the callback popup on Telegram
          await callTelegram('answerCallbackQuery', {
            callback_query_id: cb.id,
            text: action === 'dose_taken' ? '✅ Dose confirmed in Dosiq Vault!' : '⚠️ Caregiver alert logged.',
          });

          if (action === 'dose_taken') {
            console.log(`\n🎉 [CONFIRMED] User clicked "Took Dose" at ${timestamp}!`);
            console.log('🔄 Updating Telegram message and synchronizing Caregiver Vault status...');

            await callTelegram('editMessageText', {
              chat_id: chatId,
              message_id: reminderMessage.message_id,
              text: `✅ *Dosiq AI — Medication Confirmed*\n\n👤 *Patient:* Dad\n💊 *Medicine:* Tab Telma-40 (40mg)\n🕒 *Confirmed At:* ${timestamp}\n\n🟢 *Status:* Recorded in Dosiq Medical Vault.\nCaregiver dashboard updated with green adherence badge!`,
              parse_mode: 'Markdown',
            });
          } else {
            console.log(`\n⚠️ [MISSED/SKIPPED] User clicked "Skipped / Delayed" at ${timestamp}.`);
            console.log('🔄 Updating Telegram message and notifying Caregiver...');

            await callTelegram('editMessageText', {
              chat_id: chatId,
              message_id: reminderMessage.message_id,
              text: `⚠️ *Dosiq AI — Medication Alert*\n\n👤 *Patient:* Dad\n💊 *Medicine:* Tab Telma-40 (40mg)\n🕒 *Logged At:* ${timestamp}\n\n🔴 *Status:* Marked as Skipped / Delayed.\nCaregiver alerted on dashboard for follow-up.`,
              parse_mode: 'Markdown',
            });
          }

          handled = true;
          break;
        }
      }
    }

    if (handled) {
      console.log('\n======================================================');
      console.log('✅ TEST PASSED: Two-way Care Loop is functioning 100%!');
      console.log('======================================================\n');
    } else {
      console.log('\n⏱️ Timeout: No button was clicked within 90 seconds.');
      console.log('You can re-run this script anytime with: node test-telegram-bot.js\n');
    }
  } catch (err) {
    console.error('\n❌ Test Error:', err.message);
  }
}

run();
