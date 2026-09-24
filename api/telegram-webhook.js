import ws from 'ws';
if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws;
}
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is not configured.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  async function sendTelegramMessage(chatId, text, replyMarkup = null) {
    try {
      const payload = { chat_id: chatId, text, parse_mode: 'Markdown' };
      if (replyMarkup) payload.reply_markup = replyMarkup;
      
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[TelegramWebhook] Error sending message:', err.message);
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
      console.error('[TelegramWebhook] Error answering callback:', err.message);
    }
  }

  const update = req.body;

  // 1. Handle Inline Button Clicks
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message?.chat?.id || process.env.TELEGRAM_CHAT_ID;
    const data = cq.data || '';

    await answerCallbackQuery(cq.id, 'Received!');

    if (data.startsWith('confirm_regimen')) {
      const patient = decodeURIComponent(data.split(':')[1] || 'Patient');

      if (supabase) {
        try {
          // 1. Find member by chatId, by name match, or latest Self profile
          let member = null;
          const { data: byChat } = await supabase
            .from('family_members')
            .select('*')
            .eq('telegram_chat_id', String(chatId))
            .limit(1);

          if (byChat && byChat.length > 0) {
            member = byChat[0];
          } else {
            const { data: byName } = await supabase
              .from('family_members')
              .select('*')
              .ilike('name', `%${patient}%`)
              .order('created_at', { ascending: false })
              .limit(1);

            if (byName && byName.length > 0) {
              member = byName[0];
            } else {
              const { data: selfMembers } = await supabase
                .from('family_members')
                .select('*')
                .eq('relationship', 'Self')
                .order('created_at', { ascending: false })
                .limit(1);
              if (selfMembers && selfMembers.length > 0) {
                member = selfMembers[0];
              }
            }
          }

          if (member) {
            // 2. Link telegram chat id and enable care loop on family member
            await supabase
              .from('family_members')
              .update({
                telegram_chat_id: String(chatId),
                care_loop_enabled: true
              })
              .eq('id', member.id);

            // 3. Mark existing medication schedules as active and synced
            await supabase
              .from('medication_schedules')
              .update({ status: 'active', is_synced: true })
              .eq('user_id', member.user_id)
              .neq('status', 'completed');

            // 4. Fallback: If 0 medication schedules exist, populate from latest decoded prescription
            const { data: existingMeds } = await supabase
              .from('medication_schedules')
              .select('id')
              .eq('user_id', member.user_id);

            if (!existingMeds || existingMeds.length === 0) {
              const { data: latestDocs } = await supabase
                .from('documents')
                .select('*')
                .eq('user_id', member.user_id)
                .order('created_at', { ascending: false })
                .limit(1);

              const rxMeds = latestDocs?.[0]?.ai_analysis_result?.prescription_data?.medicines;
              if (Array.isArray(rxMeds) && rxMeds.length > 0) {
                const rows = rxMeds.map(m => {
                  const mName = m.exact_written_name || m.brand || m.name || 'Prescription Medicine';
                  const timing = m.timing || {};
                  return {
                    user_id: member.user_id,
                    family_member_id: member.id,
                    name: mName,
                    generic_name: m.assumed_enriched_data?.scientific_name || mName,
                    medicine_type: m.form || 'Tablet',
                    medicine_purpose: m.assumed_enriched_data?.medicine_purpose || 'Prescription',
                    strength: m.strength || null,
                    dosage_instruction: m.dosage_instruction || null,
                    timing_dosage: timing.dosage || '0-0-1',
                    reminder_times: ['20:00'],
                    food_relationship: timing.relation_to_meal ? timing.relation_to_meal.replace('_', ' ') : 'After Food',
                    start_date: new Date().toISOString().split('T')[0],
                    duration_days: m.duration_days || 14,
                    source_document_id: latestDocs[0].id,
                    status: 'active',
                    is_synced: true
                  };
                });
                await supabase.from('medication_schedules').insert(rows);
              }
            }

            // 5. Log confirmation in care_loop_events
            await supabase.from('care_loop_events').insert([{
              user_id: member.user_id,
              family_member_id: member.id,
              medication_name: 'Prescription Regimen',
              dosage_instruction: 'Full daily course confirmed',
              scheduled_slot: 'daily',
              channel: 'telegram',
              telegram_chat_id: String(chatId),
              dispatch_status: 'delivered',
              response_status: 'confirmed',
              response_callback_data: 'confirm_regimen',
              dispatched_at: new Date().toISOString(),
              response_at: new Date().toISOString(),
              latency_seconds: 2,
              notes: `Medication regimen confirmed and activated via Telegram Care Loop for ${patient}`
            }]);
          }
        } catch (err) {
          console.error('[TelegramWebhook] Supabase update error:', err.message);
        }
      }

      await sendTelegramMessage(
        chatId,
        `✅ *Regimen Confirmed!*\n\n` +
        `The medication schedule for *${patient}* is now active and live.\n` +
        `⏰ Dosiq AI will automatically remind you at your scheduled dose times.\n\n` +
        `📱 *Dashboard Status:* Synced with Caregiver Vault ✓`,
        {
          inline_keyboard: [
            [{ text: '💊 Test Dose Check-in Now', callback_data: `checkin:${encodeURIComponent(patient)}` }]
          ]
        }
      );
    } else if (data.startsWith('checkin')) {
      const patient = decodeURIComponent(data.split(':')[1] || 'Patient');
      let medOptions = [];

      if (supabase) {
        try {
          const { data: activeMeds } = await supabase
            .from('medication_schedules')
            .select('name, strength, food_relationship')
            .eq('status', 'active')
            .order('created_at', { ascending: true })
            .limit(3);
          if (activeMeds && activeMeds.length > 0) {
            medOptions = activeMeds;
          }
        } catch (e) {
          console.error('[TelegramWebhook] Error fetching meds for checkin:', e.message);
        }
      }

      const medSummary = medOptions.length > 0
        ? medOptions.map(m => `💊 *${m.name}* ${m.strength ? `(${m.strength})` : ''} · _${m.food_relationship || 'After Food'}_`).join('\n')
        : `💊 *Prescribed Medication* (1 dose · After Food)`;

      const primaryMed = medOptions[0]?.name || 'Prescribed Dose';

      await sendTelegramMessage(
        chatId,
        `⏰ *Medicine Check-in for ${patient}:*\n\n` +
        `It is time for your scheduled dose:\n` +
        medSummary + `\n\n` +
        `Did you take your medication?`,
        {
          inline_keyboard: [
            [
              { text: '✅ Took Dose', callback_data: `dose_taken:${encodeURIComponent(primaryMed)}` },
              { text: '❌ Skipped', callback_data: `dose_skipped:${encodeURIComponent(primaryMed)}` }
            ]
          ]
        }
      );
    } else if (data.startsWith('dose_taken') || data.startsWith('dose_skipped')) {
      const isTaken = data.startsWith('dose_taken');
      const medName = decodeURIComponent(data.split(':')[1] || 'Prescribed Dose');
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (supabase) {
        try {
          const { data: members } = await supabase
            .from('family_members')
            .select('id, user_id')
            .or(`telegram_chat_id.eq.${String(chatId)},relationship.eq.Self`)
            .order('created_at', { ascending: false })
            .limit(1);

          const member = members?.[0];
          if (member) {
            await supabase.from('care_loop_events').insert([{
              user_id: member.user_id,
              family_member_id: member.id,
              medication_name: medName,
              dosage_instruction: '1 dose',
              scheduled_slot: 'scheduled',
              channel: 'telegram',
              telegram_chat_id: String(chatId),
              dispatch_status: 'delivered',
              response_status: isTaken ? 'confirmed' : 'skipped',
              response_callback_data: data,
              dispatched_at: new Date().toISOString(),
              response_at: new Date().toISOString(),
              latency_seconds: 2,
              notes: isTaken ? `Confirmed via Telegram 1-tap button at ${now}` : `Dose logged as skipped via Telegram at ${now}`
            }]);
          }
        } catch (e) {
          console.error('[TelegramWebhook] Error logging dose event:', e.message);
        }
      }

      if (isTaken) {
        await sendTelegramMessage(
          chatId,
          `✅ *Dose Confirmed as TAKEN!*\n\n` +
          `🕒 Logged at: *${now}*\n` +
          `👤 Status: *Confirmed via Care Loop*\n` +
          `🌟 Caregiver has been notified on the web dashboard. Great job staying on track!`
        );
      } else {
        await sendTelegramMessage(
          chatId,
          `⚠️ *Dose Logged as SKIPPED*\n\n` +
          `🕒 Logged at: *${now}*\n` +
          `🔴 Status: *Skipped / Delayed*\n` +
          `Caregiver has been notified on the web dashboard. Please consult your physician if you feel unwell.`
        );
      }
    }
    return res.status(200).json({ ok: true });
  }

  // 2. Handle Text Messages
  if (update.message && update.message.text) {
    const text = update.message.text.trim().toLowerCase();
    const chatId = update.message.chat.id;

    // Dynamically retrieve the patient name and active meds for this user/chat
    let currentPatientName = 'Alex Sharma';
    let currentMeds = [];
    if (supabase) {
      try {
        const { data: members } = await supabase
          .from('family_members')
          .select('id, user_id, name')
          .or(`telegram_chat_id.eq.${String(chatId)},relationship.eq.Self`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (members && members[0]) {
          currentPatientName = members[0].name;
          const { data: scheds } = await supabase
            .from('medication_schedules')
            .select('name, strength, food_relationship')
            .eq('user_id', members[0].user_id)
            .limit(4);
          if (scheds && scheds.length > 0) {
            currentMeds = scheds;
          }
        }
      } catch (e) {
        console.error('[TelegramWebhook] Error reading member for text msg:', e.message);
      }
    }

    if (text === '/start' || text.includes('hi') || text.includes('hello')) {
      const medsFormatted = currentMeds.length > 0
        ? currentMeds.map(m => `• *${m.name}* ${m.strength ? `(${m.strength})` : ''} _(${m.food_relationship || 'After Food'})_`).join('\n')
        : `• *Prescription Regimen* _(Scheduled via Care Vault)_`;

      await sendTelegramMessage(
        chatId,
        `🌿 *Hi, welcome to Dosiq AI Care Loop!*\n\n` +
        `I am your intelligent health co-pilot, connected to your family's Dosiq Medical Vault.\n\n` +
        `📋 *Current Active Regimen for ${currentPatientName}:*\n` +
        medsFormatted + `\n\n` +
        `⏰ *Do you confirm this schedule and want to receive reminders?*\n` +
        `👉 Reply *YES* or tap below to confirm:`,
        {
          inline_keyboard: [
            [
              { text: '✅ Yes, Confirm Regimen', callback_data: `confirm_regimen:${encodeURIComponent(currentPatientName)}` },
              { text: '⏰ Test Dose Check-in', callback_data: `checkin:${encodeURIComponent(currentPatientName)}` }
            ]
          ]
        }
      );
    } else if (text === 'yes' || text === 'confirm' || text.includes('yes confirm') || text.includes('yes, confirm')) {
      if (supabase) {
        try {
          const { data: members } = await supabase
            .from('family_members')
            .select('id, user_id')
            .or(`telegram_chat_id.eq.${String(chatId)},relationship.eq.Self`)
            .order('created_at', { ascending: false })
            .limit(1);

          if (members && members[0]) {
            await supabase
              .from('family_members')
              .update({ telegram_chat_id: String(chatId), care_loop_enabled: true })
              .eq('id', members[0].id);

            await supabase
              .from('medication_schedules')
              .update({ status: 'active', is_synced: true })
              .eq('user_id', members[0].user_id)
              .neq('status', 'completed');
          }
        } catch (err) {
          console.error('[TelegramWebhook] Supabase update error on text confirm:', err.message);
        }
      }

      await sendTelegramMessage(
        chatId,
        `✅ *Regimen Confirmed!*\n\n` +
        `Thank you! Your medication schedule for *${currentPatientName}* is confirmed and active.\n` +
        `⏰ Dosiq AI will check in with you at your scheduled dose times.\n\n` +
        `📱 *Dashboard Status:* Synced with Caregiver Vault ✓`,
        {
          inline_keyboard: [
            [{ text: '💊 Test Dose Check-in Now', callback_data: `checkin:${encodeURIComponent(currentPatientName)}` }]
          ]
        }
      );
    } else {
      await sendTelegramMessage(
        chatId,
        `🌿 *Dosiq AI Care Loop*\n\n` +
        `You said: "${update.message.text}"\n\n` +
        `Would you like to confirm your prescribed regimen or test a dose check-in?`,
        {
          inline_keyboard: [
            [
              { text: '✅ Confirm Regimen', callback_data: `confirm_regimen:${encodeURIComponent(currentPatientName)}` },
              { text: '⏰ Test Dose Check-in', callback_data: `checkin:${encodeURIComponent(currentPatientName)}` }
            ]
          ]
        }
      );
    }
  }

  return res.status(200).json({ ok: true });
}
