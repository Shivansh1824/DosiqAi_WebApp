import dotenv from 'dotenv';
dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
// IMPORTANT: Replace this with your actual deployed Vercel URL
const VERCEL_DOMAIN = 'https://dosiq-ai-web-app.vercel.app'; 
const webhookUrl = `${VERCEL_DOMAIN}/api/telegram-webhook`;

if (!botToken) {
  console.error('Error: TELEGRAM_BOT_TOKEN is missing in .env');
  process.exit(1);
}

async function setWebhook() {
  console.log(`Setting Telegram Webhook to: ${webhookUrl}`);
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);
    const data = await res.json();
    console.log('Response:', data);
    if (data.ok) {
      console.log('✅ Webhook successfully set for production!');
    } else {
      console.error('❌ Failed to set webhook:', data.description);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

setWebhook();
