const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabaseClient = null;
if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('⚠️  Supabase credentials are not configured. Falling back to in-memory storage.');
}

const memoryUsers = new Map();
const memoryUserSkins = new Map();
const memoryGames = [];

function normaliseTelegramId(telegramId) {
  if (telegramId === undefined || telegramId === null) {
    throw new Error('telegramId is required');
  }
  return String(telegramId);
}

function getOrCreateMemoryUser(telegramId, profile = {}) {
  const id = normaliseTelegramId(telegramId);
  const now = new Date();
  const existing = memoryUsers.get(id) || {
    telegram_id: id,
    rating: 1500,
    coins: 0,
    created_at: now,
    owned_skins: [],
  };

  const updated = {
    ...existing,
    username: profile.username ?? existing.username ?? null,
    first_name: profile.firstName ?? existing.first_name ?? null,
    last_name: profile.lastName ?? existing.last_name ?? null,
    updated_at: now,
  };

  memoryUsers.set(id, updated);
  if (!memoryUserSkins.has(id)) {
    memoryUserSkins.set(id, new Set(updated.owned_skins || []));
  }

  return updated;
}

async function getOrCreateUser(telegramId, profile = {}) {
  if (!supabaseClient) {
    return getOrCreateMemoryUser(telegramId, profile);
  }

  const id = normaliseTelegramId(telegramId);

  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('telegram_id', id)
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('DB error (select user):', error);
    throw error;
  }

  if (data) {
    return data;
  }

  const now = new Date().toISOString();
  const newUser = {
    telegram_id: id,
    username: profile.username ?? null,
    first_name: profile.firstName ?? null,
    last_name: profile.lastName ?? null,
    rating: 1500,
    coins: 0,
    created_at: now,
    updated_at: now,
  };

  const { data: inserted, error: insertError } = await supabaseClient
    .from('users')
    .insert(newUser)
    .select()
    .single();

  if (insertError) {
    console.error('DB error (insert user):', insertError);
    throw insertError;
  }

  return inserted;
}

async function registerUser(telegramId, profile = {}) {
  return getOrCreateUser(telegramId, profile);
}

async function getUser(telegramId) {
  if (!supabaseClient) {
    return memoryUsers.get(normaliseTelegramId(telegramId)) || null;
  }

  const id = normaliseTelegramId(telegramId);
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('telegram_id', id)
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('DB error (select user):', error);
    throw error;
  }

  return data || null;
}

async function updateRating(telegramId, newRating) {
  if (!supabaseClient) {
    const user = getOrCreateMemoryUser(telegramId);
    user.rating = newRating;
    memoryUsers.set(normaliseTelegramId(telegramId), user);
    return;
  }

  const id = normaliseTelegramId(telegramId);
  const { error } = await supabaseClient
    .from('users')
    .update({ rating: newRating, updated_at: new Date().toISOString() })
    .eq('telegram_id', id);

  if (error) {
    console.error('DB error (update rating):', error);
    throw error;
  }
}

async function updateCoins(telegramId, amountChange) {
  if (!supabaseClient) {
    const user = getOrCreateMemoryUser(telegramId);
    user.coins = (user.coins || 0) + amountChange;
    if (user.coins < 0) {
      user.coins = 0;
    }
    memoryUsers.set(normaliseTelegramId(telegramId), user);
    return user.coins;
  }

  const id = normaliseTelegramId(telegramId);

  const { data, error } = await supabaseClient.rpc('increment_user_coins', {
    user_id: id,
    delta: amountChange,
  });

  if (!error) {
    return data;
  }

  console.error('DB error (update coins via RPC):', error);

  try {
    const user = await getOrCreateUser(id);
    const newBalance = Math.max(0, (user.coins || 0) + amountChange);
    const { data: updated, error: updateError } = await supabaseClient
      .from('users')
      .update({ coins: newBalance, updated_at: new Date().toISOString() })
      .eq('telegram_id', id)
      .select('coins')
      .single();

    if (updateError) {
      console.error('DB error (update coins fallback):', updateError);
      throw updateError;
    }

    return updated?.coins ?? newBalance;
  } catch (fallbackError) {
    console.error('Failed to update coins:', fallbackError);
    throw fallbackError;
  }
}

async function recordGameResult(gameId, whiteId, blackId, winnerId, movesPgn) {
  if (!supabaseClient) {
    memoryGames.push({
      id: gameId,
      white_id: whiteId,
      black_id: blackId,
      winner_id: winnerId,
      pgn: movesPgn,
      ended_at: new Date().toISOString(),
    });
    return;
  }

  const payload = {
    id: gameId,
    white_id: whiteId,
    black_id: blackId,
    winner_id: winnerId,
    pgn: movesPgn,
    ended_at: new Date().toISOString(),
  };

  const { error } = await supabaseClient.from('games').insert(payload);
  if (error) {
    console.error('DB error (insert game):', error);
    throw error;
  }
}

async function getTopPlayers(limit = 10) {
  if (!supabaseClient) {
    return Array.from(memoryUsers.values())
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit)
      .map((user) => ({ username: user.username, rating: user.rating }));
  }

  const { data, error } = await supabaseClient
    .from('users')
    .select('username, rating')
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('DB error (getTopPlayers):', error);
    return [];
  }

  return data;
}

async function getUserSkinIds(telegramId) {
  if (!supabaseClient) {
    const user = getOrCreateMemoryUser(telegramId);
    const owned = memoryUserSkins.get(normaliseTelegramId(telegramId)) || new Set();
    user.owned_skins = Array.from(owned);
    return user.owned_skins;
  }

  const id = normaliseTelegramId(telegramId);
  const { data, error } = await supabaseClient
    .from('user_skins')
    .select('skin_id')
    .eq('telegram_id', id);

  if (error) {
    console.error('DB error (getUserSkinIds):', error);
    return [];
  }

  return (data || []).map((row) => row.skin_id);
}

async function addUserSkin(telegramId, skinId) {
  if (!supabaseClient) {
    const id = normaliseTelegramId(telegramId);
    const owned = memoryUserSkins.get(id) || new Set();
    owned.add(skinId);
    memoryUserSkins.set(id, owned);
    return;
  }

  const id = normaliseTelegramId(telegramId);
  const { error } = await supabaseClient.from('user_skins').insert({
    telegram_id: id,
    skin_id: skinId,
  });

  if (error && error.code !== '23505') {
    console.error('DB error (addUserSkin):', error);
    throw error;
  }
}

module.exports = {
  getOrCreateUser,
  registerUser,
  getUser,
  updateRating,
  updateCoins,
  recordGameResult,
  getTopPlayers,
  getUserSkinIds,
  addUserSkin,
};
