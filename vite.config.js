import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'os';
import express from 'express';
import dotenv from 'dotenv';
import ws from 'ws';

if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws;
}
dotenv.config();

function getLocalIp() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (e) {
    // fallback
  }
  return 'localhost';
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-dev-server',
      configureServer(server) {
        const app = express();
        app.use(express.json({ limit: '25mb' }));

        app.post('/api/check-prescription', async (req, res) => {
          try {
            const { default: handler } = await import('./api/check-prescription.js');
            return await handler(req, res);
          } catch (err) {
            console.error('[DEV API] Error in check-prescription:', err);
            return res.status(500).json({ error: err.message });
          }
        });

        app.post('/api/check-report', async (req, res) => {
          try {
            const { default: handler } = await import('./api/check-report.js');
            return await handler(req, res);
          } catch (err) {
            console.error('[DEV API] Error in check-report:', err);
            return res.status(500).json({ error: err.message });
          }
        });

        app.post('/api/extract-prescription', async (req, res) => {
          try {
            const { default: handler } = await import('./api/extract-prescription.js');
            return await handler(req, res);
          } catch (err) {
            console.error('[DEV API] Error in extract-prescription:', err);
            return res.status(500).json({ error: err.message });
          }
        });

        app.post('/api/extract-report', async (req, res) => {
          try {
            const { default: handler } = await import('./api/extract-report.js');
            return await handler(req, res);
          } catch (err) {
            console.error('[DEV API] Error in extract-report:', err);
            return res.status(500).json({ error: err.message });
          }
        });

        app.post('/api/send-telegram-reminder', async (req, res) => {
          try {
            const { default: handler } = await import('./api/send-telegram-reminder.js');
            return await handler(req, res);
          } catch (err) {
            console.error('[DEV API] Error in send-telegram-reminder:', err);
            return res.status(500).json({ error: err.message });
          }
        });

        server.middlewares.use(app);
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
  },
  define: {
    __DEV_LOCAL_IP__: JSON.stringify(getLocalIp()),
  },
});

