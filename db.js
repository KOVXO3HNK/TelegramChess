const users = new Map();

async function registerUser(telegramId, profile = {}) {
  const id = String(telegramId);
  const now = new Date();
  const existing = users.get(id) || {
    telegramId: id,
    createdAt: now,
  };

  const updated = {
    ...existing,
    username: profile.username ?? existing.username ?? null,
    firstName: profile.firstName ?? existing.firstName ?? null,
    lastName: profile.lastName ?? existing.lastName ?? null,
    updatedAt: now,
  };

  users.set(id, updated);
  return updated;
}

function getUser(telegramId) {
  return users.get(String(telegramId)) || null;
}

module.exports = {
  registerUser,
  getUser,
};
