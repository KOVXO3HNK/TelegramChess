const {
  createGame,
  joinGame,
  isGameReady,
  makeMove,
  getGameState,
  endGame,
} = require('./game');
const db = require('./db');

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
      async ({ gameId, playerId, from, to, promotion } = {}, callback = () => {}) => {
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
          const state = getGameState(gameId);

          try {
            await handleGameOver(gameId, state, result);
          } catch (error) {
            console.error('Failed to persist game results:', error);
          }

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

async function handleGameOver(gameId, state, result) {
  if (!state || !state.players) {
    return;
  }

  const { players } = state;
  const whiteId = players.white;
  const blackId = players.black;

  if (!whiteId || !blackId) {
    return;
  }

  const winnerId = result.winner?.playerId || null;
  const pgn = result.pgn || null;

  await Promise.all([
    recordRatings(whiteId, blackId, winnerId),
    awardCoins(whiteId, blackId, winnerId),
    db.recordGameResult(gameId, whiteId, blackId, winnerId, pgn),
  ]);
}

async function recordRatings(whiteId, blackId, winnerId) {
  try {
    const [whiteUser, blackUser] = await Promise.all([
      db.getOrCreateUser(whiteId),
      db.getOrCreateUser(blackId),
    ]);

    if (!whiteUser || !blackUser || !winnerId) {
      return;
    }

    const delta = 10;
    const whiteRating = whiteUser.rating ?? 1500;
    const blackRating = blackUser.rating ?? 1500;

    const updates = [];

    if (winnerId === whiteId) {
      updates.push(db.updateRating(whiteId, whiteRating + delta));
      updates.push(db.updateRating(blackId, Math.max(0, blackRating - delta)));
    } else if (winnerId === blackId) {
      updates.push(db.updateRating(blackId, blackRating + delta));
      updates.push(db.updateRating(whiteId, Math.max(0, whiteRating - delta)));
    }

    await Promise.all(updates);
  } catch (error) {
    console.error('Failed to update ratings:', error);
  }
}

async function awardCoins(whiteId, blackId, winnerId) {
  const participationReward = 1;
  const winBonus = 5;

  try {
    await Promise.all([
      db.updateCoins(whiteId, participationReward),
      db.updateCoins(blackId, participationReward),
    ]);

    if (winnerId) {
      await db.updateCoins(winnerId, winBonus);
    }
  } catch (error) {
    console.error('Failed to update coins:', error);
  }
}
