const express = require('express');
const axios = require('axios');
const http = require('http');
require('dotenv').config();

const { registerUser } = require('./db');

const TELEGRAM_API_BASE = process.env.BOT_TOKEN
  ? `https://api.telegram.org/bot${process.env.BOT_TOKEN}`
  : null;
const WEBAPP_URL = process.env.WEBAPP_URL || '';

if (!TELEGRAM_API_BASE) {
  console.warn('⚠️  BOT_TOKEN is not set. Telegram API calls will fail.');
}

const app = express();
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Chess bot server is running');
});

app.post('/webhook', async (req, res) => {
  const update = req.body;
  console.log('Telegram update:', JSON.stringify(update));

  try {
    if (update.message) {
      if (update.message.successful_payment) {
        await handleSuccessfulPayment(update.message);
      } else {
        await handleIncomingMessage(update.message);
      }
    } else if (update.pre_checkout_query) {
      await handlePreCheckoutQuery(update.pre_checkout_query);
    }
  } catch (error) {
    console.error('Failed to process Telegram update:', error);
  }

  res.sendStatus(200);
});

async function handleIncomingMessage(message) {
  const chatId = message.chat.id;
  const text = (message.text || '').trim();

  if (text === '/start') {
    await registerUser(String(message.from.id), {
      username: message.from.username || null,
      firstName: message.from.first_name || null,
      lastName: message.from.last_name || null,
    });

    const keyboardButton = WEBAPP_URL
      ? {
          text: 'Играть 🎮',
          web_app: {
            url: `${WEBAPP_URL}?user=${chatId}`,
          },
        }
      : { text: 'Играть 🎮' };

    const replyMarkup = {
      keyboard: [[keyboardButton]],
      resize_keyboard: true,
      one_time_keyboard: false,
    };

    await sendTelegramMessage({
      chat_id: chatId,
      text:
        'Добро пожаловать в ChessBot! Используйте кнопку ниже, чтобы играть в шахматы.',
      reply_markup: replyMarkup,
    });
  }
}

async function handlePreCheckoutQuery(query) {
  if (!TELEGRAM_API_BASE) return;

  try {
    await axios.post(`${TELEGRAM_API_BASE}/answerPreCheckoutQuery`, {
      pre_checkout_query_id: query.id,
      ok: true,
    });
  } catch (error) {
    console.error('Failed to answer pre-checkout query:', error.response?.data || error);
  }
}

async function handleSuccessfulPayment(message) {
  const chatId = message.chat.id;
  const payment = message.successful_payment;
  console.log('Payment successful:', payment);

  await sendTelegramMessage({
    chat_id: chatId,
    text: 'Оплата получена! Монеты зачислены на ваш счет.',
  });
}

async function sendTelegramMessage(payload) {
  if (!TELEGRAM_API_BASE) {
    console.warn('Cannot send Telegram message because BOT_TOKEN is missing.');
    return;
  }

  try {
    await axios.post(`${TELEGRAM_API_BASE}/sendMessage`, payload);
  } catch (error) {
    console.error('Failed to send Telegram message:', error.response?.data || error);
  }
}

const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
});

require('./socket')(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
