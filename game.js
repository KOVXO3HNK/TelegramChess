// game.js — Модуль логики шахмат

const { Chess } = require('chess.js');

// Хранилище активных игр в памяти
const games = {};  // объект вида { gameId: { chess: ChessInstance, players: [player1Id, player2Id] } }

// Функция создания новой игры
function createGame(playerId) {
    const chess = new Chess();
    const gameId = generateGameId();  // можно использовать пакет uuid или простое число/строку
    games[gameId] = {
        chess: chess,
        players: [playerId]  // первый игрок (создатель)
    };
    return gameId;
}

// Функция присоединения второго игрока к игре
function joinGame(gameId, playerId) {
    if (!games[gameId]) return false;
    if (games[gameId].players.length >= 2) return false;
    games[gameId].players.push(playerId);
    return true;
}

// Проверка: готова ли игра к старту (2 игрока подключились)
function isGameReady(gameId) {
    return games[gameId] && games[gameId].players.length === 2;
}

// Выполнение хода
function makeMove(gameId, from, to, promotion = 'q') {
    const game = games[gameId];
    if (!game) return { error: 'Игра не найдена' };
    const chess = game.chess;
    // Формируем объект хода для Chess.js
    const move = chess.move({ from: from, to: to, promotion: promotion });
    if (move === null) {
        // Недопустимый ход
        return { error: 'Невалидный ход' };
    } else {
        // Ход успешно применен
        const isGameOver = chess.isGameOver();
        const winner = chess.isCheckmate() ? determineWinner(game) : null;
        // Вернуть информацию о ходе и состоянии игры
        return {
            move: move,  // объект с информацией о ходе (например, {color:'w', piece:'p', from:'e2', to:'e4', flags:'', etc})
            fen: chess.fen(),  // новая позиция в FEN-нотации
            gameOver: isGameOver,
            winner: winner  // 'w', 'b' или null
        };
    }
}

// Вспомогательная функция: определить победителя при мате
function determineWinner(game) {
    // Если мат, победитель - тот, чей ход был последним (т.е. противоположный цвет короля, который мат)
    // Chess.js сам не указывает победителя, определим по текущему ходу.
    // Можно сохранить в state последнего ходившего игрока или цвет.
    return null;  // для простоты сейчас null, реальная логика будет зависеть от chess.turn() перед ходом
}

// Функция получения текущего состояния игры (например, для отправки новым подключившимся наблюдателям)
function getGameState(gameId) {
    const game = games[gameId];
    if (!game) return null;
    return {
        fen: game.chess.fen(),
        players: game.players
        // Можно добавить и другие данные, например список ходов: game.chess.pgn()
    };
}

// Функция для завершения игры и очистки (например, после окончания партии)
function endGame(gameId) {
    if (games[gameId]) {
        delete games[gameId];
    }
}

// Функция генерации уникального ID игры (можно заменить на UUID)
function generateGameId() {
    return 'game-' + Math.random().toString(36).substr(2, 9);
}

// Экспорт функций для использования в других модулях
module.exports = {
    createGame,
    joinGame,
    isGameReady,
    makeMove,
    getGameState,
    endGame
};
