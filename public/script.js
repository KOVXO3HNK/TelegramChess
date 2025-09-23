/*
 * Front‑end logic for the Telegram Chess web application. Handles user
 * registration, skin selection, quests, matchmaking, AI games, board
 * interactions and chat via Socket.io.
 */

(() => {
  const socket = io();

  // DOM elements
  const loginPanel = document.getElementById('loginPanel');
  const usernameInput = document.getElementById('usernameInput');
  const loginBtn = document.getElementById('loginBtn');
  const app = document.getElementById('app');
  const welcome = document.getElementById('welcome');
  const ratingEl = document.getElementById('rating');
  const coinsEl = document.getElementById('coins');
  const skinSelect = document.getElementById('skin');
  const questList = document.getElementById('questList');
  const findMatchBtn = document.getElementById('findMatch');
  const aiLevelSelect = document.getElementById('aiLevel');
  const playAIBtn = document.getElementById('playAI');
  const chatArea = document.getElementById('chatArea');
  const messagesEl = document.getElementById('messages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');

  let currentUser = null;
  let currentGameId = null;
  let playerColor = null;
  let board = null;
  let game = null;

  playAIBtn.disabled = true;
  aiLevelSelect.disabled = true;

  window.addEventListener('resize', () => {
    if (board && typeof board.resize === 'function') {
      board.resize();
    }
  });

  // Helper: load user info
  async function loadUser() {
    const res = await fetch(`/api/user/${encodeURIComponent(currentUser)}`);
    if (!res.ok) return;
    const user = await res.json();
    ratingEl.textContent = user.rating;
    coinsEl.textContent = user.coins;
    // apply user skin
    document.body.classList.remove('skin-0', 'skin-1', 'skin-2', 'skin-3', 'skin-4');
    document.body.classList.add(`skin-${user.skin}`);
    skinSelect.value = user.skin;
  }

  // Helper: load quests
  async function loadQuests() {
    const res = await fetch(`/api/quests/${encodeURIComponent(currentUser)}`);
    if (!res.ok) return;
    const questsObj = await res.json();
    questList.innerHTML = '';
    questsObj.quests.forEach((q) => {
      const li = document.createElement('li');
      const progress = `${q.progress}/${q.target}`;
      li.textContent = `${q.description} — ${progress} (награда: ${q.reward} монет)`;
      if (q.completed) {
        li.style.textDecoration = 'line-through';
        li.style.opacity = 0.6;
      }
      questList.appendChild(li);
    });
  }

  // Helper: load skins
  async function loadSkins() {
    const res = await fetch('/api/skins');
    if (!res.ok) return;
    const skins = await res.json();
    skinSelect.innerHTML = '';
    skins.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      skinSelect.appendChild(opt);
    });
  }

  // Handle login click
  loginBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    if (!username) return alert('Введите никнейм с @');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
      currentUser = data.username;
      welcome.textContent = `Добро пожаловать, ${currentUser}!`;
      loginPanel.classList.add('hidden');
      app.classList.remove('hidden');
      await loadSkins();
      await loadUser();
      await loadQuests();
      playAIBtn.disabled = false;
      aiLevelSelect.disabled = false;
    } catch (err) {
      alert(err.message);
    }
  });

  // Handle skin change
  skinSelect.addEventListener('change', async () => {
    const skin = parseInt(skinSelect.value, 10);
    await fetch('/api/select_skin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser, skin })
    });
    await loadUser();
  });

  // Handle find match
  findMatchBtn.addEventListener('click', () => {
    if (!currentUser) return;
    socket.emit('findMatch', { username: currentUser });
    findMatchBtn.disabled = true;
    findMatchBtn.textContent = 'Поиск соперника…';
  });

  // Handle AI level selection
  playAIBtn.addEventListener('click', () => {
    if (!currentUser) {
      return alert('Сначала войдите в игру!');
    }
    const level = parseInt(aiLevelSelect.value, 10);
    if (!level) {
      return alert('Выберите уровень сложности ИИ.');
    }
    playAIBtn.disabled = true;
    aiLevelSelect.disabled = true;
    socket.emit('startAI', { username: currentUser, level });
  });

  // Chat form submission
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!chatInput.value || !currentGameId) return;
    socket.emit('chat', { gameId: currentGameId, username: currentUser, message: chatInput.value });
    chatInput.value = '';
  });

  // Socket event: match found
  socket.on('matchFound', ({ gameId, color, opponent }) => {
    currentGameId = gameId;
    playerColor = color;
    game = new Chess();
    board = Chessboard('board', {
      position: 'start',
      orientation: color,
      draggable: true,
      onDrop: handleDrop,
      responsive: true
    });
    chatArea.classList.remove('hidden');
    findMatchBtn.disabled = false;
    findMatchBtn.textContent = 'Сыграть с игроком';
    aiLevelSelect.disabled = false;
    aiLevelSelect.value = '';
    playAIBtn.disabled = false;
    alert(`Найден соперник: ${opponent}! Вы играете за ${color === 'white' ? 'белых' : 'чёрных'}`);
  });

  // Socket event: AI game created
  socket.on('aiGameCreated', ({ gameId, color }) => {
    currentGameId = gameId;
    playerColor = color;
    game = new Chess();
    board = Chessboard('board', {
      position: 'start',
      orientation: color,
      draggable: true,
      onDrop: handleDrop,
      responsive: true
    });
    chatArea.classList.add('hidden');
    findMatchBtn.disabled = false;
    findMatchBtn.textContent = 'Сыграть с игроком';
    aiLevelSelect.disabled = false;
    aiLevelSelect.value = '';
    playAIBtn.disabled = false;
    alert(`Игра с компьютером началась! Вы играете за белых.`);
  });

  // Socket event: receive move (from server or opponent)
  socket.on('move', (data) => {
    if (!game) return;
    // data may be object like {from:'e2', to:'e4'} or string if AI used chess.js
    if (typeof data === 'string') {
      game.move(data);
    } else {
      game.move({ from: data.from, to: data.to, promotion: data.promotion });
    }
    board.position(game.fen());
  });

  // Socket event: game over
  socket.on('gameOver', async ({ winner, loser, reason }) => {
    alert(
      reason === 'draw'
        ? 'Партия завершилась вничью.'
        : winner === currentUser
        ? 'Поздравляем! Вы победили.'
        : winner === 'ai'
        ? 'Вы проиграли ИИ.'
        : 'Вы проиграли.'
    );
    currentGameId = null;
    playerColor = null;
    board = null;
    game = null;
    chatArea.classList.add('hidden');
    await loadUser();
    await loadQuests();
    playAIBtn.disabled = false;
    aiLevelSelect.disabled = false;
    aiLevelSelect.value = '';
  });

  // Socket event: chat message
  socket.on('chat', ({ username, message }) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${username}:</strong> ${message}`;
    messagesEl.appendChild(li);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });

  // Handle piece drop on board
  function handleDrop(source, target) {
    // Only allow move if it is player's turn
    if (!game || !currentGameId) return 'snapback';
    // Determine if it's player's turn
    const turn = game.turn() === 'w' ? 'white' : 'black';
    if (turn !== playerColor) return 'snapback';
    const moveObj = { from: source, to: target };
    // Always promote to queen for simplicity
    // Detect if move is a promotion move via client
    const piece = game.get(source);
    if (piece && piece.type === 'p' && ((piece.color === 'w' && target[1] === '8') || (piece.color === 'b' && target[1] === '1'))) {
      moveObj.promotion = 'q';
    }
    const move = game.move(moveObj);
    if (move === null) return 'snapback';
    // valid move: update board locally but server remains source of truth
    socket.emit('move', { gameId: currentGameId, from: moveObj.from, to: moveObj.to, promotion: moveObj.promotion });
  }
})();