/**
 * Recalcula os bônus de ataque/defesa/vida do jogador com base nos equipamentos.
 * Usa os dados da loja (econ.shop) para somar os bônus de cada slot equipado.
 */
export function recalcEquipmentBonuses(user, shop = {}) {
  if (!user || typeof user !== 'object') return;
  if (!user.equipment) user.equipment = { weapon: null, armor: null, helmet: null, boots: null, shield: null, accessory: null };

  let attack = 0;
  let defense = 0;
  let hp = 0;

  for (const slot of ['weapon', 'armor', 'helmet', 'boots', 'shield', 'accessory']) {
    const itemId = user.equipment[slot];
    if (!itemId) continue;
    const item = shop[itemId];
    if (!item) continue;
    attack += item.attackBonus || 0;
    defense += item.defenseBonus || 0;
    hp += item.hpBonus || 0;
  }

  user.attackBonus = attack;
  user.defenseBonus = defense;
  user.maxHp = Math.max(user.maxHp || 0, 100 + hp); // mantém base mínima de HP
}
