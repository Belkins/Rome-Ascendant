import { Player, Enemy, CombatResult, CombatLogEntry, Item, ItemSlot, ItemRarity, StatType } from '../types';

export const calculateDerivedStats = (player: Player) => {
  const strength = player.stats[StatType.Strength] + getEquippedStatBonus(player, StatType.Strength);
  const dexterity = player.stats[StatType.Dexterity] + getEquippedStatBonus(player, StatType.Dexterity);
  const agility = player.stats[StatType.Agility] + getEquippedStatBonus(player, StatType.Agility);
  const constitution = player.stats[StatType.Constitution] + getEquippedStatBonus(player, StatType.Constitution);
  const intelligence = player.stats[StatType.Intelligence] + getEquippedStatBonus(player, StatType.Intelligence);
  const charisma = player.stats[StatType.Charisma] + getEquippedStatBonus(player, StatType.Charisma);

  // Base damage from stats
  const baseMin = Math.floor(strength * 1.5);
  const baseMax = Math.floor(strength * 2.5);

  // Weapon damage
  const weapon = player.equipped[ItemSlot.Weapon];
  const weaponMin = weapon?.damageMin || 2;
  const weaponMax = weapon?.damageMax || 4;

  // Total Damage
  const totalMin = baseMin + weaponMin;
  const totalMax = baseMax + weaponMax;

  // Armor
  let totalArmor = Math.floor(agility * 0.5);
  Object.values(player.equipped).forEach(item => {
    if (item) totalArmor += (item.armor || 0);
  });

  // HP
  const maxHp = Math.floor(constitution * 12) + (player.level * 10);
  
  // Crit Chance
  const critChance = Math.min(50, Math.floor(intelligence * 0.5 + dexterity * 0.2)); // %

  return {
    damageMin: totalMin,
    damageMax: totalMax,
    armor: totalArmor,
    maxHp,
    critChance,
    hitChance: 80 + (dexterity * 0.5),
    // Effective Stats
    strength,
    dexterity,
    agility,
    constitution,
    intelligence,
    charisma
  };
};

const getEquippedStatBonus = (player: Player, stat: StatType): number => {
  let bonus = 0;
  Object.values(player.equipped).forEach(item => {
    if (item && item.stats && item.stats[stat]) {
      bonus += item.stats[stat]!;
    }
  });
  return bonus;
};

export const generateEnemy = (level: number): Enemy => {
  const scale = level * 1.2;
  const hp = Math.floor(40 * scale);
  const dmgMin = Math.floor(4 * scale);
  const dmgMax = Math.floor(8 * scale);
  
  const names = ['Wolf', 'Bandit', 'Deserter', 'Bear', 'Barbarian', 'Lion', 'Gladiator', 'Centurion'];
  const name = names[Math.floor(Math.random() * names.length)];

  return {
    name,
    level,
    hp, // Current HP (starts full)
    maxHp: hp,
    damageMin: dmgMin,
    damageMax: dmgMax,
    armor: Math.floor(level * 2),
    xpReward: Math.floor(10 + (level * 15)),
    goldReward: Math.floor(5 + (level * 8))
  };
};

export const resolveCombat = (player: Player, enemy: Enemy): CombatResult => {
  const pStats = calculateDerivedStats(player);
  let pHp = player.hp; // Use current HP
  let eHp = enemy.maxHp;
  const log: CombatLogEntry[] = [];
  let round = 1;

  // Create a copy of enemy to track damage for the result object
  const resultEnemy = { ...enemy };

  while (pHp > 0 && eHp > 0 && round < 50) {
    // Player turn
    const pRoll = Math.random() * 100;
    const pHit = pRoll < pStats.hitChance;
    
    if (pHit) {
      const isCrit = Math.random() * 100 < pStats.critChance;
      let dmg = Math.floor(Math.random() * (pStats.damageMax - pStats.damageMin + 1)) + pStats.damageMin;
      if (isCrit) dmg = Math.floor(dmg * 1.5);
      
      // Enemy Armor Reduction (Simple flat reduction for now, min 1 dmg)
      const actualDmg = Math.max(1, dmg - Math.floor(enemy.armor / 2));
      eHp -= actualDmg;
      
      log.push({
        round,
        attacker: 'Player',
        damage: actualDmg,
        isCrit,
        isMiss: false,
        message: `You struck ${enemy.name} for ${actualDmg} damage!`
      });
    } else {
      log.push({
        round,
        attacker: 'Player',
        damage: 0,
        isCrit: false,
        isMiss: true,
        message: `You missed ${enemy.name}.`
      });
    }

    if (eHp <= 0) break;

    // Enemy Turn
    // 10% chance player dodges based on Agility difference (simplified)
    const dodgeChance = Math.min(25, pStats.agility * 0.5); 
    const eHit = Math.random() * 100 > dodgeChance;

    if (eHit) {
      let eDmg = Math.floor(Math.random() * (enemy.damageMax - enemy.damageMin + 1)) + enemy.damageMin;
      const actualEDmg = Math.max(1, eDmg - Math.floor(pStats.armor / 3));
      pHp -= actualEDmg;

      log.push({
        round,
        attacker: 'Enemy',
        damage: actualEDmg,
        isCrit: false,
        isMiss: false,
        message: `${enemy.name} hit you for ${actualEDmg} damage.`
      });
    } else {
      log.push({
        round,
        attacker: 'Enemy',
        damage: 0,
        isCrit: false,
        isMiss: true,
        message: `${enemy.name} attacked but you dodged!`
      });
    }

    round++;
  }

  const won = pHp > 0;
  resultEnemy.hp = Math.max(0, eHp); // Update the result enemy HP
  let rewardItems: Item[] = [];

  // 30% drop chance
  if (won && Math.random() < 0.3) {
    rewardItems.push(generateRandomItem(enemy.level));
  }

  return {
    won,
    log,
    enemy: resultEnemy,
    rewards: won ? {
      xp: enemy.xpReward,
      gold: enemy.goldReward,
      items: rewardItems
    } : undefined
  };
};

export const generateRandomItem = (level: number): Item => {
  const slots = Object.values(ItemSlot);
  const slot = slots[Math.floor(Math.random() * slots.length)];
  const rarities = Object.values(ItemRarity);
  
  // Rarity bias
  let rarity = ItemRarity.Common;
  const roll = Math.random();
  if (roll > 0.95) rarity = ItemRarity.Legendary;
  else if (roll > 0.85) rarity = ItemRarity.Epic;
  else if (roll > 0.70) rarity = ItemRarity.Rare;
  else if (roll > 0.50) rarity = ItemRarity.Uncommon;

  const baseVal = level * 10;
  const statMult = {
    [ItemRarity.Common]: 1,
    [ItemRarity.Uncommon]: 1.5,
    [ItemRarity.Rare]: 2,
    [ItemRarity.Epic]: 3,
    [ItemRarity.Legendary]: 5
  }[rarity];

  const newItem: Item = {
    id: Math.random().toString(36).substring(7),
    name: `${rarity} ${slot}`,
    slot,
    rarity,
    levelReq: Math.max(1, level - 1),
    value: Math.floor(baseVal * statMult),
    stats: {},
    icon: `https://picsum.photos/seed/${Math.random()}/64/64`
  };

  // Add stats based on rarity
  const numStats = Object.keys(ItemRarity).indexOf(rarity) + 1;
  const statTypes = Object.values(StatType);
  
  for(let i=0; i<numStats; i++) {
     const stat = statTypes[Math.floor(Math.random() * statTypes.length)];
     newItem.stats[stat] = (newItem.stats[stat] || 0) + Math.floor((Math.random() * level + 1) * statMult);
  }

  if (slot === ItemSlot.Weapon) {
      newItem.damageMin = Math.floor(level * statMult);
      newItem.damageMax = Math.floor(level * 2 * statMult);
      newItem.name = `${rarity} Gladius`;
  } else if (slot !== ItemSlot.Ring && slot !== ItemSlot.Amulet) {
      newItem.armor = Math.floor(level * statMult);
      newItem.name = `${rarity} ${slot}`;
  } else {
      newItem.name = `${rarity} Band`;
  }

  return newItem;
};

export const XP_TABLE = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1));

export const TRAIN_COST = (currentStatValue: number) => Math.floor(currentStatValue * 5);