const db = require('./db');

const availableSkins = [
  { id: 1, name: 'Классический', price: 0 },
  { id: 2, name: 'Деревянный', price: 100 },
  { id: 3, name: 'Марбелья (премиум)', price: 500 },
];

function listSkins() {
  return [...availableSkins];
}

async function buySkin(userTelegramId, skinId) {
  const skin = availableSkins.find((item) => item.id === skinId);
  if (!skin) {
    return { success: false, message: 'Скин не найден' };
  }

  if (skin.price <= 0) {
    return { success: false, message: 'Этот скин не требует покупки' };
  }

  const user = await db.getOrCreateUser(userTelegramId);
  const currentCoins = user?.coins ?? 0;

  if (currentCoins < skin.price) {
    return { success: false, message: 'Недостаточно монет для покупки' };
  }

  await db.updateCoins(userTelegramId, -skin.price);
  await db.addUserSkin(userTelegramId, skinId);

  return { success: true, message: `Скин "${skin.name}" приобретен!` };
}

async function getUserSkins(userTelegramId) {
  const ownedIds = new Set(await db.getUserSkinIds(userTelegramId));
  const skins = availableSkins.filter(
    (skin) => skin.price === 0 || ownedIds.has(skin.id)
  );
  return skins;
}

module.exports = {
  listSkins,
  buySkin,
  getUserSkins,
};
