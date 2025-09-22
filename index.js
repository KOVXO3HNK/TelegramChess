// index.js — Основной серверный файл

// Импорт необходимых модулей
const express = require('express');
const axios = require('axios');
const http = require('http');
require('dotenv').config();  // если используем .env для переменных

// Инициализация Express-приложения
const app = express();
app.use(express.json());  // для парсинга JSON в webhook-запросах

// Маршрут для проверки работоспособности (например, GET "/")
app.get('/', (req, res) => {
    res.send('Chess bot server is running');
});

// Telegram Webhook endpoint (например, "/webhook" для POST-запросов от Telegram)
app.post('/webhook', async (req, res) => {
    const update = req.body;

    // Логирование входящего апдейта (для отладки)
    console.log('Telegram update:', JSON.stringify(update));

    // Проверка типа апдейта – сообщение от пользователя
    if (update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text;

        if (text === '/start') {
            // 1. Регистрация пользователя в базе (если еще не зарегистрирован)
            //    Вызвать функцию из db.js, например db.getOrCreateUser(telegramId, имя)

            // 2. Отправка приветственного сообщения и кнопки Web App
            // Формируем текст приветствия
            const welcomeText = 'Добро пожаловать в ChessBot! Используйте кнопку ниже, чтобы играть в шахматы.';
            // Опционально: сформировать клавиатуру с кнопкой запуска веб-приложения
            const replyMarkup = {
                one_time_keyboard: true,
                keyboard: [
                    [{ text: 'Играть 🎮', web_app: { url: process.env.WEBAPP_URL + `?user=${chatId}` } }]
                ]
            };
            try {
                await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
                    chat_id: chatId,
                    text: welcomeText,
                    reply_markup: replyMarkup
                });
            } catch (err) {
                console.error('Failed to send welcome message:', err);
            }
        }

        // Можно обрабатывать другие команды, например, /help, /profile, /buy и т.д.
    }
    else if (update.pre_checkout_query) {
        // Обработка предварительного чекаута (если используются платежи)
        // Здесь надо подтвердить платеж, ответив Telegram, что можно списывать деньги.
        const queryId = update.pre_checkout_query.id;
        try {
            await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/answerPreCheckoutQuery`, {
                pre_checkout_query_id: queryId,
                ok: true
            });
        } catch (err) {
            console.error('Failed to answer pre-checkout:', err);
        }
    }
    else if (update.message && update.message.successful_payment) {
        // Обработка успешного платежа
        const payment = update.message.successful_payment;
        const chatId = update.message.chat.id;
        console.log('Payment successful:', payment);
        // Например: начислить пользователю внутриигровую валюту согласно оплаченной сумме.
        // db.addCurrency(chatId, amount);
        // Уведомить пользователя:
        try {
            await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: 'Оплата получена! Монеты зачислены на ваш счет.'
            });
        } catch (err) {
            console.error('Failed to send payment confirmation:', err);
        }
    }

    // Ответ Telegram боту (HTTP 200 OK)
    res.sendStatus(200);
});

// Подключение модулей игры, БД, real-time:
// Инициализация базы данных (например, supabase или pg)
const db = require('./db');

// Инициализация HTTP-сервера и Socket.IO
const server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });  // origin '*' для отладки, потом указать домен
require('./socket')(io);  // Передаем объект Socket.IO в модуль socket.js для обработки событий

// Запуск сервера на порту (PORT из окружения или 3000)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
