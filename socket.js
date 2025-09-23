const {
  createGame,
  joinGame,
  isGameReady,
  makeMove,
  getGameState,
  endGame,
} = require('./game');

module.exports = function initialiseSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('game:create', ({ playerId } = {}, callback = () => {}) => {
      if (!playerId) {
        callback({ success: false, error: 'playerId обязателен' });
        return;
      }

      const gameId = createGame(playerId);
      socket.join(gameId);

      const state = getGameState(gameId);
      callback({ success: true, gameId, color: 'w', state });
    });

    socket.on('game:join', ({ gameId, playerId } = {}, callback = () => {}) => {
      if (!gameId || !playerId) {
        callback({ success: false, error: 'gameId и playerId обязательны' });
        return;
      }

      const result = joinGame(gameId, playerId);
      if (!result.success) {
        callback(result);
        return;
      }

      socket.join(gameId);
      const state = getGameState(gameId);
      callback({ success: true, color: result.color, state });

      io.to(gameId).emit('game:state', {
        gameId,
        state,
        ready: isGameReady(gameId),
      });
    });

    socket.on('game:state', ({ gameId }, callback = () => {}) => {
      const state = getGameState(gameId);
      if (!state) {
        callback({ success: false, error: 'Игра не найдена' });
        return;
      }
      callback({ success: true, state });
    });

    socket.on(
      'game:move',
      ({ gameId, playerId, from, to, promotion } = {}, callback = () => {}) => {
        if (!gameId || !playerId || !from || !to) {
          callback({ success: false, error: 'gameId, playerId, from и to обязательны' });
          return;
        }

        const result = makeMove(gameId, playerId, from, to, promotion);
        if (!result.success) {
          callback(result);
          return;
        }

        io.to(gameId).emit('game:move', { gameId, ...result });
        callback(result);

        if (result.gameOver) {
          endGame(gameId);
          io.to(gameId).emit('game:over', {
            gameId,
            winner: result.winner,
            fen: result.fen,
          });
        }
      }
    );

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
