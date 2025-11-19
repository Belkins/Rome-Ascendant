export enum StatType {
    Strength = 'Strength',     // Damage
    Dexterity = 'Dexterity',   // Hit Chance
    Agility = 'Agility',       // Dodge / Crit
    Constitution = 'Constitution', // Health
    Intelligence = 'Intelligence', // Learning / Magic Def
    Charisma = 'Charisma'      // Gold / Arena Fame
  }
  
  export enum ItemRarity {
    Common = 'Common',
    Uncommon = 'Uncommon',
    Rare = 'Rare',
    Epic = 'Epic',
    Legendary = 'Legendary'
  }
  
  export enum ItemSlot {
    Weapon = 'Weapon',
    Helmet = 'Helmet',
    Chest = 'Chest',
    Gloves = 'Gloves',
    Boots = 'Boots',
    Shield = 'Shield',
    Amulet = 'Amulet',
    Ring = 'Ring'
  }
  
  export interface Item {
    id: string;
    name: string;
    slot: ItemSlot;
    rarity: ItemRarity;
    levelReq: number;
    value: number;
    stats: Partial<Record<StatType, number>>;
    armor?: number;
    damageMin?: number;
    damageMax?: number;
    icon?: string;
  }
  
  export interface PlayerStats {
    [StatType.Strength]: number;
    [StatType.Dexterity]: number;
    [StatType.Agility]: number;
    [StatType.Constitution]: number;
    [StatType.Intelligence]: number;
    [StatType.Charisma]: number;
  }
  
  export interface Player {
    name: string;
    level: number;
    xp: number;
    xpToNext: number;
    gold: number;
    rubies: number; // Premium currency
    hp: number;
    maxHp: number;
    energy: number;
    maxEnergy: number;
    arenaTickets: number;
    stats: PlayerStats;
    inventory: Item[];
    equipped: Partial<Record<ItemSlot, Item>>;
    battlesWon: number;
    completedAchievements: string[];
  }
  
  export interface Enemy {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    damageMin: number;
    damageMax: number;
    armor: number;
    xpReward: number;
    goldReward: number;
    flavorText?: string;
  }
  
  export interface CombatLogEntry {
    round: number;
    attacker: 'Player' | 'Enemy';
    damage: number;
    isCrit: boolean;
    isMiss: boolean;
    message: string;
  }
  
  export interface CombatResult {
    won: boolean;
    log: CombatLogEntry[];
    enemy: Enemy; // Added enemy snapshot for UI
    rewards?: {
      xp: number;
      gold: number;
      items: Item[];
    };
  }
  
  export interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
    isPlayer: boolean;
  }
  
  export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: (player: Player) => boolean;
  }

  export interface GameNotification {
    id: string;
    message: string;
    type: 'achievement' | 'loot' | 'info';
  }
  
  export enum Location {
    Home = 'Home',
    Expedition = 'Expedition',
    Arena = 'Arena',
    Town = 'Town',
    Inventory = 'Inventory',
    Leaderboard = 'Leaderboard'
  }