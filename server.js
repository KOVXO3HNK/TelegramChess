const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');
const { Low, JSONFile } = require('lowdb');
const { nanoid } = require('nanoid');
const path = require('path');

/*
 * Telegram Chess Web Application
 *
 * This server exposes a REST API for user management (registration, skins, quests,
 * leaderboard) and uses Socket.io to handle real‑time game play for both
 * player vs player and player vs AI. An in‑memory game table holds active
 * games, while persistent user data and quests are stored in a tiny JSON
 * database powered by lowdb. Five difficulty levels of AI are implemented
 * through a simple minimax search with material evaluation.
 */

// -------- Database setup --------
const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

async function initDb() {
  await db.read();
  db.data = db.data || { users: {}, games: {}, quests: {} };
  // Ensure all users have required fields if db was empty
  await db.write();
}

// Initialise DB immediately
initDb().catch((err) => {
  console.error('Failed to initialise database', err);
});

// -------- Express setup --------
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server);

// -------- Application Constants --------
const INITIAL_RATING = 1000;
const INITIAL_COINS = 0;
const K_FACTOR = 32;
const SKINS = [
  { id: 0, name: 'Классика', hue: 0 },
  { id: 1, name: 'Розовый/Синий', hue: 60 },
  { id: 2, name: 'Зелёный/Фиолетовый', hue: 120 },
  { id: 3, name: 'Оранжевый/Бирюзовый', hue: 180 },
  { id: 4, name: 'Серый/Золотой', hue: 240 }
];

// Daily quest definitions. Each quest has an id, description, target count and coin reward.
const QUEST_DEFINITIONS = [
  { id: 'play', description: 'Сыграть 3 партии', target: 3, reward: 15 },
  { id: 'win', description: 'Выиграть 1 партию', target: 1, reward: 25 },
  { id: 'capture', description: 'Съесть 5 фигур', target: 5, reward: 10 },
  { id: 'promote', description: 'Сделать 1 превращение пешки', target: 1, reward: 20 },
  { id: 'checkmate', description: 'Поставить мат', target: 1, reward: 30 }
];

// In‑memory table of active games. Persisting active games is not required
// because they only live while sockets are connected.
const activeGames = {};

// Matchmaking queue for players seeking human opponents
const waitingPlayers = [];

/*
 * Utility: Generate or fetch today’s quest object for a user.
 * Quests reset daily; progress and completion flags reset at midnight.
 */
async function generateDailyQuests(username) {
  const today = new Date().toISOString().split('T')[0];
  if (!db.data.quests[username] || db.data.quests[username].date !== today) {
    const quests = QUEST_DEFINITIONS.map((q) => ({
      id: q.id,
      description: q.description,
      target: q.target,
      reward: q.reward,
      progress: 0,
      completed: false
    }));
    db.data.quests[username] = { date: today, quests };
    await db.write();
  }
  return db.data.quests[username];
}

/*
 * Utility: Increment quest progress for a given user and quest id. If the
 * quest reaches its target, mark as complete and award coins.
 */
async function incrementQuest(username, questId, amount = 1) {
  const questsObj = await generateDailyQuests(username);
  const quest = questsObj.quests.find((q) => q.id === questId);
  if (!quest || quest.completed) return;
  quest.progress += amount;
  if (quest.progress >= quest.target) {
    quest.progress = quest.target;
    quest.completed = true;
    // Award coins
    const user = db.data.users[username];
    user.coins += quest.reward;
  }
  await db.write();
}

/*
 * Utility: Elo rating calculation. Given two ratings and the score for player A
 * (1 = win, 0.5 = draw, 0 = loss), returns updated ratings.
 */
function updateRatings(ratingA, ratingB, scoreA) {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));
  const newRatingA = Math.round(ratingA + K_FACTOR * (scoreA - expectedA));
  const newRatingB = Math.round(ratingB + K_FACTOR * ((1 - scoreA) - expectedB));
  return [newRatingA, newRatingB];
}

/*
 * AI evaluation: material count. Lower depths and simple evaluation keep AI
 * relatively lightweight. Higher difficulty levels just increase depth.
 */
const PIECE_VALUES = { p: 1, n: 3, b: 3.25, r: 5, q: 9, k: 0 };
function evaluateBoard(game) {
  let evaluation = 0;
  const board = game.board();
  for (let row of board) {
    for (let piece of row) {
      if (!piece) continue;
      const value = PIECE_VALUES[piece.type] || 0;
      evaluation += piece.color === 'w' ? value : -value;
    }
  }
  return evaluation;
}

function minimax(game, depth, isMaximizing) {
  if (depth === 0 || game.game_over()) {
    const evalValue = evaluateBoard(game);
    return evalValue;
  }
  const moves = game.moves();
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const cloned = new Chess(game.fen());
      cloned.move(move);
      const evalValue = minimax(cloned, depth - 1, false);
      if (evalValue > maxEval) maxEval = evalValue;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const cloned = new Chess(game.fen());
      cloned.move(move);
      const evalValue = minimax(cloned, depth - 1, true);
      if (evalValue < minEval) minEval = evalValue;
    }
    return minEval;
  }
}

function getBestMove(game, depth) {
  let bestMove = null;
  let bestScore = -Infinity;
  const moves = game.moves();
  for (const move of moves) {
    const cloned = new Chess(game.fen());
    cloned.move(move);
    const score = minimax(cloned, depth - 1, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

/*
 * REST API routes
 */

// User registration. Body: { username }
app.post('/api/register', async (req, res) => {
  const { username } = req.body || {};
  if (!username || typeof username !== 'string' || !username.startsWith('@')) {
    return res.status(400).json({ error: 'Имя пользователя должно начинаться с @' });
  }
  const uname = username.toLowerCase();
  if (!db.data.users[uname]) {
    db.data.users[uname] = {
      username: uname,
      rating: INITIAL_RATING,
      coins: INITIAL_COINS,
      skin: 0
    };
    await db.write();
  }
  res.json(db.data.users[uname]);
});

// Get user info
app.get('/api/user/:username', async (req, res) => {
  const uname = req.params.username.toLowerCase();
  const user = db.data.users[uname];
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  await generateDailyQuests(uname);
  res.json(user);
});

// Get available skins
app.get('/api/skins', (req, res) => {
  res.json(SKINS);
});

// Update selected skin. Body: { username, skin }
app.post('/api/select_skin', async (req, res) => {
  const { username, skin } = req.body || {};
  if (typeof skin !== 'number' || skin < 0 || skin >= SKINS.length) {
    return res.status(400).json({ error: 'Некорректный скин' });
  }
  const uname = username.toLowerCase();
  const user = db.data.users[uname];
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  user.skin = skin;
  await db.write();
  res.json({ ok: true });
});

// Get daily quests for user
app.get('/api/quests/:username', async (req, res) => {
  const uname = req.params.username.toLowerCase();
  if (!db.data.users[uname]) return res.status(404).json({ error: 'Пользователь не найден' });
  const quests = await generateDailyQuests(uname);
  res.json(quests);
});

// Leaderboard: return top 10 users sorted by rating
app.get('/api/leaderboard', async (req, res) => {
  const usersArray = Object.values(db.data.users);
  usersArray.sort((a, b) => b.rating - a.rating);
  res.json(usersArray.slice(0, 10));
});

/*
 * Socket.io events
 */
io.on('connection', (socket) => {
  let currentUser = null;
  // Join lobby for multiplayer
  socket.on('findMatch', async ({ username }) => {
    currentUser = username.toLowerCase();
    // Add to queue if not already waiting
    const existing = waitingPlayers.find((u) => u.username === currentUser);
    if (existing) return;
    waitingPlayers.push({ socket, username: currentUser });
    // Check if match available
    if (waitingPlayers.length >= 2) {
      const [p1, p2] = waitingPlayers.splice(0, 2);
      const gameId = nanoid(8);
      // Randomly assign colours
      const white = Math.random() < 0.5 ? p1 : p2;
      const black = white === p1 ? p2 : p1;
      const chess = new Chess();
      activeGames[gameId] = { id: gameId, chess, white: white.username, black: black.username, vsAI: false };
      // Join socket rooms
      p1.socket.join(gameId);
      p2.socket.join(gameId);
      // Send match found event
      p1.socket.emit('matchFound', { gameId, color: white === p1 ? 'white' : 'black', opponent: p2.username });
      p2.socket.emit('matchFound', { gameId, color: white === p2 ? 'white' : 'black', opponent: p1.username });
      // Increment play quest for both users
      await incrementQuest(p1.username, 'play');
      await incrementQuest(p2.username, 'play');
    }
  });

  // Start a game vs AI
  socket.on('startAI', async ({ username, level }) => {
    currentUser = username.toLowerCase();
    const depthMap = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 4 };
    const depth = depthMap[level] || 1;
    const gameId = nanoid(8);
    const chess = new Chess();
    // Player always plays white
    activeGames[gameId] = { id: gameId, chess, white: currentUser, black: 'ai', vsAI: true, aiLevel: depth };
    socket.join(gameId);
    socket.emit('aiGameCreated', { gameId, color: 'white' });
    await incrementQuest(currentUser, 'play');
  });

  // Process a move sent by a client
  socket.on('move', async ({ gameId, from, to, promotion }) => {
    const game = activeGames[gameId];
    if (!game) return;
    const { chess } = game;
    const moveObj = { from, to };
    if (promotion) moveObj.promotion = promotion;
    const result = chess.move(moveObj);
    if (!result) return; // invalid move
    // increment capture quest if piece captured
    if (result.captured) {
      await incrementQuest(chess.turn() === 'b' ? game.white : game.black, 'capture');
    }
    // increment promote quest
    if (result.flags.includes('p')) {
      await incrementQuest(chess.turn() === 'b' ? game.white : game.black, 'promote');
    }
    // Broadcast move to room
    io.to(gameId).emit('move', { from, to, promotion });
    // Check end conditions
    if (chess.in_checkmate()) {
      const winner = chess.turn() === 'b' ? game.white : game.black;
      const loser = chess.turn() === 'b' ? game.black : game.white;
      // Update rating if human vs human
      if (!game.vsAI) {
        const userA = db.data.users[winner];
        const userB = db.data.users[loser];
        const [newA, newB] = updateRatings(userA.rating, userB.rating, 1);
        userA.rating = newA;
        userB.rating = newB;
        userA.coins += 10;
        await incrementQuest(winner, 'win');
        await incrementQuest(winner, 'checkmate');
        await db.write();
      } else {
        const user = db.data.users[game.white];
        if (winner === game.white) {
          user.coins += 10;
          user.rating += 5;
          await incrementQuest(game.white, 'win');
          await incrementQuest(game.white, 'checkmate');
        } else {
          user.rating = Math.max(100, user.rating - 5);
        }
        await db.write();
      }
      io.to(gameId).emit('gameOver', { winner, loser, reason: 'checkmate' });
      delete activeGames[gameId];
      return;
    }
    if (chess.in_draw() || chess.in_stalemate() || chess.in_threefold_repetition() || chess.insufficient_material()) {
      // Draw scenario
      if (!game.vsAI) {
        const userA = db.data.users[game.white];
        const userB = db.data.users[game.black];
        const [newA, newB] = updateRatings(userA.rating, userB.rating, 0.5);
        userA.rating = newA;
        userB.rating = newB;
        userA.coins += 5;
        userB.coins += 5;
        await db.write();
      } else {
        // vs AI draw: adjust rating slightly
        const user = db.data.users[game.white];
        user.coins += 5;
        await db.write();
      }
      io.to(gameId).emit('gameOver', { winner: null, reason: 'draw' });
      delete activeGames[gameId];
      return;
    }
    // If vs AI and now it is AI's turn, compute AI move
    if (game.vsAI && chess.turn() === 'b') {
      const best = getBestMove(chess, game.aiLevel);
      if (best) {
        chess.move(best);
        // Broadcast AI move
        io.to(gameId).emit('move', best);
        // Check again for end of game
        if (chess.in_checkmate()) {
          const winner = 'ai';
          const loser = game.white;
          const user = db.data.users[game.white];
          // Player lost
          user.rating = Math.max(100, user.rating - 5);
          await db.write();
          io.to(gameId).emit('gameOver', { winner, loser, reason: 'checkmate' });
          delete activeGames[gameId];
        } else if (chess.in_draw() || chess.in_stalemate() || chess.in_threefold_repetition() || chess.insufficient_material()) {
          const user = db.data.users[game.white];
          user.coins += 5;
          await db.write();
          io.to(gameId).emit('gameOver', { winner: null, reason: 'draw' });
          delete activeGames[gameId];
        }
      }
    }
  });

  // Chat messages
  socket.on('chat', ({ gameId, username, message }) => {
    io.to(gameId).emit('chat', { username, message });
  });

  // Resign: user gives up
  socket.on('resign', async ({ gameId, username }) => {
    const game = activeGames[gameId];
    if (!game) return;
    const loser = username.toLowerCase();
    const winner = (loser === game.white ? game.black : game.white);
    if (!game.vsAI) {
      const userA = db.data.users[winner];
      const userB = db.data.users[loser];
      const [newA, newB] = updateRatings(userA.rating, userB.rating, 1);
      userA.rating = newA;
      userB.rating = newB;
      userA.coins += 10;
      await incrementQuest(winner, 'win');
      await db.write();
    } else {
      const user = db.data.users[game.white];
      if (loser === game.white) {
        user.rating = Math.max(100, user.rating - 5);
      } else {
        user.rating += 5;
        await incrementQuest(game.white, 'win');
      }
      await db.write();
    }
    io.to(gameId).emit('gameOver', { winner, loser, reason: 'resignation' });
    delete activeGames[gameId];
  });

  socket.on('disconnect', () => {
    // Remove from waiting queue on disconnect
    const idx = waitingPlayers.findIndex((p) => p.socket === socket);
    if (idx !== -1) waitingPlayers.splice(idx, 1);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Telegram Chess server listening on port ${PORT}`);
});