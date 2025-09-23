const { Chess } = require('chess.js');

const games = new Map();

function createGame(playerId) {
  const chess = new Chess();
  const gameId = generateGameId();

  games.set(gameId, {
    chess,
    players: {
      white: playerId,
      black: null,
    },
  });

  return gameId;
}

function joinGame(gameId, playerId) {
  const game = games.get(gameId);
  if (!game) {
    return { success: false, error: 'Игра не найдена' };
  }

  if (game.players.white === playerId || game.players.black === playerId) {
    const color = game.players.white === playerId ? 'w' : 'b';
    return { success: true, color };
  }

  if (!game.players.black) {
    game.players.black = playerId;
    return { success: true, color: 'b' };
  }

  return { success: false, error: 'Игра уже заполнена' };
}

function isGameReady(gameId) {
  const game = games.get(gameId);
  return Boolean(game && game.players.white && game.players.black);
}

function makeMove(gameId, playerId, from, to, promotion = 'q') {
  const game = games.get(gameId);
  if (!game) {
    return { success: false, error: 'Игра не найдена' };
  }

  const chess = game.chess;
  const playerColor = resolvePlayerColor(game, playerId);

  if (!playerColor) {
    return { success: false, error: 'Игрок не участвует в этой партии' };
  }

  if (chess.turn() !== playerColor) {
    return { success: false, error: 'Сейчас не ваш ход' };
  }

  const move = chess.move({ from, to, promotion });

  if (move === null) {
    return { success: false, error: 'Невалидный ход' };
  }

  const isGameOver = chess.isGameOver();
  const isCheckmate = chess.isCheckmate();
  const winner = isCheckmate ? determineWinner(game) : null;

  if (isGameOver) {
    // оставляем запись до вызова endGame, чтобы можно было получить итоговое состояние
  }

  return {
    success: true,
    move,
    fen: chess.fen(),
    gameOver: isGameOver,
    winner,
    turn: chess.turn(),
    check: chess.inCheck(),
  };
}

function getGameState(gameId) {
  const game = games.get(gameId);
  if (!game) {
    return null;
  }

  const { chess, players } = game;

  return {
    fen: chess.fen(),
    players: { ...players },
    turn: chess.turn(),
    gameOver: chess.isGameOver(),
    check: chess.inCheck(),
  };
}

function endGame(gameId) {
  games.delete(gameId);
}

function resolvePlayerColor(game, playerId) {
  if (game.players.white === playerId) {
    return 'w';
  }
  if (game.players.black === playerId) {
    return 'b';
  }
  return null;
}

function determineWinner(game) {
  const chess = game.chess;
  const loserColor = chess.turn();
  const winnerColor = loserColor === 'w' ? 'b' : 'w';
  const winnerId = winnerColor === 'w' ? game.players.white : game.players.black;

  return {
    color: winnerColor,
    playerId: winnerId,
  };
}

function generateGameId() {
  return `game-${Math.random().toString(36).slice(2, 11)}`;
}

module.exports = {
  createGame,
  joinGame,
  isGameReady,
  makeMove,
  getGameState,
  endGame,
};
