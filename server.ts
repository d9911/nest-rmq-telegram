import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment configurations from .env or .env.example
if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
} else if (fs.existsSync('.env.example')) {
  dotenv.config({ path: '.env.example' });
} else {
  dotenv.config();
}

// Memory store to capture keys received from the UI to initialize real-time polling instantly
let globalToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TELEGRAM_KEY || '';
let globalChatId = process.env.TELEGRAM_CHAT_ID || '';
let lastUpdateId = 0;

interface Subscriber {
  id: string;
  name: string;
  username?: string;
  lastSeen: string;
  lastTextSent?: string;
  registeredAt: string;
}

// In-memory array of discovered active chats/users
let subscribers: Subscriber[] = [];

// If we have an environment chat ID already, seed it!
if (globalChatId && globalChatId !== 'TextAnalyzertbot') {
  subscribers.push({
    id: globalChatId,
    name: 'Default User (from Environment)',
    lastSeen: new Date().toLocaleTimeString(),
    lastTextSent: '/start',
    registeredAt: new Date().toLocaleTimeString()
  });
}

function maskSecret(secret: string): string {
  if (!secret) return '';
  if (secret.length <= 10) return '******';
  return secret.substring(0, 4) + '...' + secret.substring(secret.length - 4);
}

// Background poll worker to listen for in-bound /start and print chat IDs
async function pollTelegramUpdates() {
  const tokenToPoll = globalToken;
  if (!tokenToPoll) return;

  try {
    const url = `https://api.telegram.org/bot${tokenToPoll}/getUpdates?offset=${lastUpdateId + 1}&timeout=2`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return;

    const data = await response.json();
    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        lastUpdateId = Math.max(lastUpdateId, update.update_id);
        
        const message = update.message;
        if (message && message.chat && message.chat.id) {
          const chatIdVal = String(message.chat.id);
          const first_name = message.from?.first_name || '';
          const last_name = message.from?.last_name || '';
          const full_name = [first_name, last_name].filter(Boolean).join(' ') || `Chat ID ${chatIdVal}`;
          const username = message.from?.username ? `@${message.from.username}` : undefined;
          const userText = message.text || '';
          
          console.log(`[Telegram Bot Listener] Received message from Telegram: Chat ID: ${chatIdVal}, text: "${userText}"`);

          // Register or update subscriber in list
          const existingIdx = subscribers.findIndex(s => s.id === chatIdVal);
          const newSub: Subscriber = {
            id: chatIdVal,
            name: full_name,
            username,
            lastSeen: new Date().toLocaleTimeString(),
            lastTextSent: userText,
            registeredAt: existingIdx >= 0 ? subscribers[existingIdx].registeredAt : new Date().toLocaleTimeString()
          };

          if (existingIdx >= 0) {
            subscribers[existingIdx] = newSub;
          } else {
            subscribers.push(newSub);
          }

          // Automatically notify UI to bind the detected chat ID if not set
          if (!globalChatId) {
            globalChatId = chatIdVal;
          }

          // Reply to the user in Telegram
          const replyUrl = `https://api.telegram.org/bot${tokenToPoll}/sendMessage`;
          const textMsg = `👋 **Привет, ${first_name || 'друг'}!**\n\n` +
                          `⚙️ Я успешно авторизовал твой **Chat ID**: \`${chatIdVal}\`\n\n` +
                          `✅ Твое устройство привязано к Web-панели управления RabbitMQ!\n` +
                          `📢 Теперь ты будешь получать мгновенные алерты обработки сообщений из нашего кластера NestJS. Попробуй нажать **Run Signal Simulation** на сайте!`;

          await fetch(replyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatIdVal,
              text: textMsg,
              parse_mode: 'Markdown'
            })
          });
        }
      }
    }
  } catch (err) {
    // Ignore updates polling errors silently
  }
}

// Start polling checks every 3 seconds
setInterval(pollTelegramUpdates, 3000);

async function startServer() {
  const app = reportGlobalHealthAndRoutes();
  const PORT = 3000;

  // Middleware to parse requests
  app.use(express.json());

  // GET: Retrieve server environment configuration states
  app.get('/api/telegram/config', (req, res) => {
    res.json({
      hasServerToken: !!globalToken,
      hasServerChatId: !!globalChatId,
      tokenMask: globalToken ? maskSecret(globalToken) : null,
      chatIdMask: globalChatId ? maskSecret(globalChatId) : null,
      chatIdVal: globalChatId || null,
      subscribersCount: subscribers.length
    });
  });

  // GET: Retrieve roster of subscribers
  app.get('/api/telegram/subscribers', (req, res) => {
    res.json({ success: true, subscribers });
  });

  // POST: Register user manually in UI
  app.post('/api/telegram/subscribers/add', (req, res) => {
    const { id, name, username } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Chat ID required' });
    
    // Auto-update globalChatId if none
    if (!globalChatId) {
      globalChatId = String(id);
    }

    const existingIdx = subscribers.findIndex(s => s.id === String(id));
    const newSub: Subscriber = {
      id: String(id),
      name: name || `User ${id}`,
      username: username || undefined,
      lastSeen: new Date().toLocaleTimeString(),
      lastTextSent: 'Manually Registered',
      registeredAt: new Date().toLocaleTimeString()
    };

    if (existingIdx >= 0) {
      subscribers[existingIdx] = newSub;
    } else {
      subscribers.push(newSub);
    }

    res.json({ success: true, subscribers });
  });

  // POST: Remove a user registration
  app.post('/api/telegram/subscribers/delete', (req, res) => {
    const { id } = req.body;
    subscribers = subscribers.filter(s => s.id !== String(id));
    if (globalChatId === String(id)) {
      globalChatId = subscribers.length > 0 ? subscribers[0].id : '';
    }
    res.json({ success: true, subscribers });
  });

  // POST: Secure proxy dispatch to Telegram Bot API (bypassing CORS and hiding keys)
  app.post('/api/telegram/send', async (req, res) => {
    const { token, chatId, id, title, message } = req.body;

    if (token && token !== 'SERVER_ENV_TOKEN_ACTIVE') {
      globalToken = token;
    }
    
    // Support broadcasting if an array is passed, or routing manually.
    // If no specific chatId passed, we send to ALL subscribers!
    let activeChatIds: string[] = [];
    if (chatId) {
      const parsedId = String(chatId);
      if (parsedId !== 'SERVER_ENV_CHAT_ID_ACTIVE' && parsedId !== 'TextAnalyzertbot') {
        activeChatIds = [parsedId];
        globalChatId = parsedId;
      }
    }
    
    // If we have selected multiple or none, compile from subscriber list
    if (activeChatIds.length === 0) {
      if (subscribers.length > 0) {
        activeChatIds = subscribers.map(s => s.id);
      } else if (globalChatId && globalChatId !== 'TextAnalyzertbot') {
        activeChatIds = [globalChatId];
      }
    }

    const activeToken = globalToken;

    if (!activeToken || activeChatIds.length === 0) {
      return res.json({
        success: true,
        delivered: false,
        reason: 'Missing credentials or subscribers. Running in local simulation sandbox.',
      });
    }

    try {
      const url = `https://api.telegram.org/bot${activeToken}/sendMessage`;
      const formattedMessage = `🔔 *${title}*\n\n${message}\n\n_ID: ${id || 'N/A'}_\n_Time: ${new Date().toLocaleTimeString()}_`;

      let deliveredCount = 0;
      const errors: string[] = [];

      for (const targetId of activeChatIds) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: targetId,
              text: formattedMessage,
              parse_mode: 'Markdown',
            }),
          });

          if (response.ok) {
            deliveredCount++;
            // Update last seen text
            const idx = subscribers.findIndex(s => s.id === targetId);
            if (idx >= 0) {
              subscribers[idx].lastSeen = new Date().toLocaleTimeString();
              subscribers[idx].lastTextSent = `Broadcast: ${title}`;
            }
          } else {
            const errorText = await response.text();
            errors.push(`Chat ${targetId}: ${response.statusText} - ${errorText}`);
          }
        } catch (individualErr: any) {
          errors.push(`Chat ${targetId} transport: ${individualErr.message || individualErr}`);
        }
      }

      return res.json({
        success: errors.length === 0,
        delivered: deliveredCount > 0,
        deliveredCount,
        totalTargets: activeChatIds.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        delivered: false,
        error: `System transport exception: ${err.message || err}`,
      });
    }
  });

  // Vite server integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Ecosystem Server] running at http://0.0.0.0:${PORT}`);
  });
}

function reportGlobalHealthAndRoutes() {
  const app = express();
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
  });
  return app;
}

startServer();
