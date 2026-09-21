import ws from 'ws';
if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const defaultChatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is not configured on the server.' });
  }

  const {
    action = 'greeting', // 'greeting' | 'checkin'
    patientName = 'Patient',
    medicines = [],
    slotTimes = { morning: '08:00', afternoon: '14:00', night: '20:00' },
    chatId = defaultChatId
  } = req.body || {};

  if (!chatId) {
    return res.status(400).json({
      error: 'No Telegram chat_id provided. Please start the bot first or configure TELEGRAM_CHAT_ID.'
    });
  }

  try {
    let text = '';
    let reply_markup = {};

    if (action === 'greeting') {
      // Format prescribed medicines by slot
      const morningList = medicines.filter(m => {
        const d = m.timing?.dosage || m.dosage;
        return d && d.split('-')[0] > 0;
      });
      const afternoonList = medicines.filter(m => {
        const d = m.timing?.dosage || m.dosage;
        return d && d.split('-')[1] > 0;
      });
      const nightList = medicines.filter(m => {
        const d = m.timing?.dosage || m.dosage;
        return (d && d.split('-')[2] > 0) || (medicines.length > 0 && morningList.length === 0 && afternoonList.length === 0);
      });
      const sosList = medicines.filter(m => {
        const d = m.timing?.dosage || m.dosage;
        return d === 'SOS' || m.timing?.interval_days === 0;
      });

      let medSummary = '';
      if (morningList.length > 0) {
        medSummary += `☀️ *Morning Slot (${slotTimes.morning || '08:00 AM'}):*\n`;
        morningList.forEach(m => {
          medSummary += `• *${m.exact_written_name || m.name}* ${m.strength ? `(${m.strength})` : ''} — _${m.timing?.relation_to_meal?.replace('_', ' ') || m.food || 'After Food'}_\n`;
        });
        medSummary += '\n';
      }

      if (afternoonList.length > 0) {
        medSummary += `🌤️ *Afternoon Slot (${slotTimes.afternoon || '02:00 PM'}):*\n`;
        afternoonList.forEach(m => {
          medSummary += `• *${m.exact_written_name || m.name}* ${m.strength ? `(${m.strength})` : ''} — _${m.timing?.relation_to_meal?.replace('_', ' ') || m.food || 'After Food'}_\n`;
        });
        medSummary += '\n';
      }

      if (nightList.length > 0) {
        medSummary += `🌙 *Night Slot (${slotTimes.night || '08:00 PM'}):*\n`;
        nightList.forEach(m => {
          medSummary += `• *${m.exact_written_name || m.name}* ${m.strength ? `(${m.strength})` : ''} — _${m.timing?.relation_to_meal?.replace('_', ' ') || m.food || 'After Food'}_\n`;
        });
        medSummary += '\n';
      }

      if (sosList.length > 0) {
        medSummary += `⚡ *On-Demand (SOS):*\n`;
        sosList.forEach(m => {
          medSummary += `• *${m.exact_written_name || m.name}* — _Take only as needed_\n`;
        });
        medSummary += '\n';
      }

      if (!medSummary) {
        medSummary = `📋 *Active Prescriptions:*\n• Routine medications scheduled with Caregiver Vault.\n\n`;
      }

      text = `🌿 *Hi, welcome to Dosiq AI Care Loop!*\n\n` +
        `Here is the prescribed medication regimen for *${patientName}*:\n\n` +
        medSummary +
        `⏰ *Do you confirm this schedule and want to receive reminders?*\n` +
        `👉 Reply *YES* or tap an option below to confirm:`;

      reply_markup = {
        inline_keyboard: [
          [
            { text: '✅ Yes, Confirm Regimen', callback_data: `confirm_regimen:${encodeURIComponent(patientName)}` },
            { text: '⏰ Test Dose Check-in', callback_data: `checkin:${encodeURIComponent(patientName)}` }
          ]
        ]
      };
    } else {
      // Check-in Reminder
      const activeMed = medicines[0] || { name: 'Prescribed Medication', strength: 'as directed', food: 'After Food' };
      const medName = activeMed.exact_written_name || activeMed.name;
      const strength = activeMed.strength ? `(${activeMed.strength})` : '';
      const meal = activeMed.timing?.relation_to_meal?.replace('_', ' ') || activeMed.food || 'After Food';

      text = `⏰ *Medicine Check-in for ${patientName}:*\n\n` +
        `It is time for your scheduled dose:\n` +
        `💊 *${medName}* ${strength}\n` +
        `🍽️ Instruction: *${meal}*\n\n` +
        `Did you take your medication?`;

      reply_markup = {
        inline_keyboard: [
          [
            { text: '✅ Took Dose', callback_data: `dose_taken:${encodeURIComponent(medName)}` },
            { text: '❌ Skipped', callback_data: `dose_skipped:${encodeURIComponent(medName)}` }
          ]
        ]
      };
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup
      })
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram API error:', data);
      return res.status(502).json({ error: data.description || 'Failed to dispatch Telegram message' });
    }

    return res.status(200).json({ success: true, messageId: data.result?.message_id });
  } catch (err) {
    console.error('Error in send-telegram-reminder:', err);
    return res.status(500).json({ error: err.message });
  }
}
