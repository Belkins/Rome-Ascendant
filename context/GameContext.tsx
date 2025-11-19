import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Player, StatType, Location, Item, ItemSlot, CombatResult, CombatLogEntry, ChatMessage, Achievement, GameNotification, ItemRarity } from '../types';
import { calculateDerivedStats, XP_TABLE, generateRandomItem } from '../services/gameEngine';
import { generateChatResponse } from '../services/geminiService';

interface GameState {
  isLoggedIn: boolean;
  player: Player;
  currentLocation: Location;
  lastCombatResult: CombatResult | null;
  isProcessing: boolean;
  nextRegenTime: number;
  marketStock: Item[];
  chatMessages: ChatMessage[];
  notifications: GameNotification[];
  achievements: Achievement[];
  login: (username: string) => void;
  logout: () => void;
  setLocation: (loc: Location) => void;
  addGold: (amount: number) => void;
  addXp: (amount: number) => void;
  equipItem: (item: Item) => void;
  unequipItem: (slot: ItemSlot) => void;
  sellItem: (itemId: string) => void;
  buyItem: (item: Item) => void;
  refreshMarket: () => void;
  trainStat: (stat: StatType, cost: number) => void;
  consumeEnergy: (amount: number) => boolean;
  setProcessing: (isProc: boolean) => void;
  updateCombatResult: (result: CombatResult) => void;
  healPlayer: (amount: number) => void;
  regenerate: () => void;
  sendChatMessage: (text: string) => void;
  removeNotification: (id: string) => void;
}

const GameContext = createContext<GameState | undefined>(undefined);

const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_blood', name: 'First Blood', description: 'Win your first battle.', icon: '🗡️', condition: (p) => p.battlesWon >= 1 },
    { id: 'novice', name: 'Novice Gladiator', description: 'Reach Level 5.', icon: '⭐', condition: (p) => p.level >= 5 },
    { id: 'rich', name: 'Merchant', description: 'Possess 1,000 Gold.', icon: '💰', condition: (p) => p.gold >= 1000 },
    { id: 'suited', name: 'Fully Suited', description: 'Equip an item in every slot.', icon: '🛡️', condition: (p) => Object.keys(p.equipped).length >= 8 },
    { id: 'legend', name: 'Legendary', description: 'Own a Legendary item.', icon: '👑', condition: (p) => p.inventory.some(i => i.rarity === ItemRarity.Legendary) || Object.values(p.equipped).some(i => i && i.rarity === ItemRarity.Legendary) },
    { id: 'veteran', name: 'Veteran', description: 'Win 50 battles.', icon: '💀', condition: (p) => p.battlesWon >= 50 },
];

const INITIAL_PLAYER_TEMPLATE: Player = {
  name: 'Gladiator',
  level: 1,
  xp: 0,
  xpToNext: 100,
  gold: 50,
  rubies: 0,
  hp: 100,
  maxHp: 100,
  energy: 20,
  maxEnergy: 20,
  arenaTickets: 5,
  stats: {
    [StatType.Strength]: 5,
    [StatType.Dexterity]: 5,
    [StatType.Agility]: 5,
    [StatType.Constitution]: 5,
    [StatType.Intelligence]: 5,
    [StatType.Charisma]: 5,
  },
  inventory: [],
  equipped: {},
  battlesWon: 0,
  completedAchievements: []
};

export const GameProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER_TEMPLATE);
  const [currentLocation, setLocation] = useState<Location>(Location.Home);
  const [lastCombatResult, setLastCombatResult] = useState<CombatResult | null>(null);
  const [isProcessing, setProcessing] = useState(false);
  const [nextRegenTime, setNextRegenTime] = useState<number>(Date.now() + 10000);
  const [marketStock, setMarketStock] = useState<Item[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
      { id: '1', sender: 'System', text: 'Welcome to Rome: Ascendant Global Chat.', timestamp: Date.now(), isPlayer: false }
  ]);
  const [notifications, setNotifications] = useState<GameNotification[]>([]);

  // Persistence Key Ref to handle saving correct user
  const saveKeyRef = useRef<string>('');

  // Login Logic
  const login = (username: string) => {
      const key = `rome_ascendant_save_${username.toLowerCase().trim()}`;
      saveKeyRef.current = key;
      const saved = localStorage.getItem(key);
      
      if (saved) {
          const loadedPlayer = JSON.parse(saved);
          // Merge with template to ensure new fields (like battlesWon) exist
          setPlayer({ ...INITIAL_PLAYER_TEMPLATE, ...loadedPlayer, name: username });
      } else {
          setPlayer({ ...INITIAL_PLAYER_TEMPLATE, name: username });
      }
      setIsLoggedIn(true);
      setLocation(Location.Home);
  };

  const logout = () => {
      setIsLoggedIn(false);
      setPlayer(INITIAL_PLAYER_TEMPLATE);
      saveKeyRef.current = '';
  };

  // Auto-Save
  useEffect(() => {
    if (isLoggedIn && saveKeyRef.current) {
        localStorage.setItem(saveKeyRef.current, JSON.stringify(player));
    }
  }, [player, isLoggedIn]);

  // Achievement Checker
  useEffect(() => {
      if (!isLoggedIn) return;

      let newAchievements: string[] = [];
      ACHIEVEMENTS.forEach(ach => {
          if (!player.completedAchievements.includes(ach.id) && ach.condition(player)) {
              newAchievements.push(ach.id);
              addNotification(`Achievement Unlocked: ${ach.name}`, 'achievement');
          }
      });

      if (newAchievements.length > 0) {
          setPlayer(prev => ({
              ...prev,
              completedAchievements: [...prev.completedAchievements, ...newAchievements]
          }));
      }
  }, [player, isLoggedIn]);

  // Initial Market Generation
  useEffect(() => {
    if (isLoggedIn && marketStock.length === 0) {
        refreshMarket();
    }
  }, [isLoggedIn]);

  // Regeneration Tick
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      regenerate();
      setNextRegenTime(Date.now() + 10000);
    }, 10000); // Every 10s
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const addNotification = (message: string, type: 'achievement' | 'loot' | 'info') => {
      const id = Math.random().toString(36);
      setNotifications(prev => [...prev, { id, message, type }]);
      setTimeout(() => removeNotification(id), 4000);
  };

  const removeNotification = (id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const regenerate = () => {
    setPlayer(prev => {
       const derived = calculateDerivedStats(prev);
       return {
         ...prev,
         hp: Math.min(derived.maxHp, prev.hp + Math.floor(derived.maxHp * 0.05)),
         energy: Math.min(prev.maxEnergy, prev.energy + 1)
       };
    });
  };

  const refreshMarket = () => {
      const newStock: Item[] = [];
      const baseLevel = Math.max(1, player.level);
      for(let i=0; i<6; i++) {
          const itemLevel = Math.random() > 0.7 ? baseLevel + 1 : baseLevel;
          newStock.push(generateRandomItem(itemLevel));
      }
      setMarketStock(newStock);
  };

  const addGold = (amount: number) => {
    setPlayer(prev => ({ ...prev, gold: prev.gold + amount }));
  };

  const addXp = (amount: number) => {
    setPlayer(prev => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let newXpToNext = prev.xpToNext;
      let newStats = { ...prev.stats };
      
      while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel++;
        newXpToNext = XP_TABLE(newLevel);
        newStats[StatType.Strength] += 1;
        newStats[StatType.Constitution] += 1;
        addNotification(`Level Up! You are now level ${newLevel}.`, 'info');
      }

      const newPlayerState = {
          ...prev,
          level: newLevel,
          xp: newXp,
          xpToNext: newXpToNext,
          stats: newStats
      };
      
      if (newLevel > prev.level) {
          const derived = calculateDerivedStats(newPlayerState);
          newPlayerState.hp = derived.maxHp;
          newPlayerState.energy = prev.maxEnergy; 
      }

      return newPlayerState;
    });
  };

  const equipItem = (item: Item) => {
    setPlayer(prev => {
      const currentEquipped = prev.equipped[item.slot];
      const newInventory = prev.inventory.filter(i => i.id !== item.id);
      
      if (currentEquipped) {
        newInventory.push(currentEquipped);
      }

      return {
        ...prev,
        inventory: newInventory,
        equipped: {
          ...prev.equipped,
          [item.slot]: item
        }
      };
    });
  };

  const unequipItem = (slot: ItemSlot) => {
    setPlayer(prev => {
      const item = prev.equipped[slot];
      if (!item) return prev;

      return {
        ...prev,
        equipped: { ...prev.equipped, [slot]: undefined },
        inventory: [...prev.inventory, item]
      };
    });
  };

  const sellItem = (itemId: string) => {
      setPlayer(prev => {
          const item = prev.inventory.find(i => i.id === itemId);
          if (!item) return prev;
          return {
              ...prev,
              gold: prev.gold + item.value,
              inventory: prev.inventory.filter(i => i.id !== itemId)
          };
      });
  };

  const buyItem = (item: Item) => {
      setPlayer(prev => {
          if (prev.gold < item.value) return prev;
          return {
              ...prev,
              gold: prev.gold - item.value,
              inventory: [...prev.inventory, item]
          };
      });
      setMarketStock(prev => prev.filter(i => i.id !== item.id));
  };

  const trainStat = (stat: StatType, cost: number) => {
    setPlayer(prev => {
      if (prev.gold < cost) return prev;
      return {
        ...prev,
        gold: prev.gold - cost,
        stats: {
          ...prev.stats,
          [stat]: prev.stats[stat] + 1
        }
      };
    });
  };

  const consumeEnergy = (amount: number): boolean => {
    if (player.energy < amount) return false;
    setPlayer(prev => ({ ...prev, energy: prev.energy - amount }));
    return true;
  };
  
  const healPlayer = (amount: number) => {
      setPlayer(prev => {
          const derived = calculateDerivedStats(prev);
          return {
              ...prev,
              hp: Math.min(derived.maxHp, prev.hp + amount)
          }
      })
  }

  const updateCombatResult = (result: CombatResult) => {
    setLastCombatResult(result);
    const playerDmgTaken = result.log
        .filter(l => l.attacker === 'Enemy')
        .reduce((acc, curr) => acc + curr.damage, 0);
    
    setPlayer(prev => ({
        ...prev,
        battlesWon: result.won ? prev.battlesWon + 1 : prev.battlesWon,
        hp: Math.max(0, prev.hp - playerDmgTaken)
    }));

    if (result.won && result.rewards) {
        addXp(result.rewards.xp);
        addGold(result.rewards.gold);
        if (result.rewards.items && result.rewards.items.length > 0) {
            const items = result.rewards!.items;
            setPlayer(prev => ({
                ...prev,
                inventory: [...prev.inventory, ...items]
            }));
            // Notify for Rare+ items
            items.forEach(i => {
                if (i.rarity === ItemRarity.Legendary || i.rarity === ItemRarity.Epic || i.rarity === ItemRarity.Rare) {
                    addNotification(`Found ${i.rarity} Item: ${i.name}`, 'loot');
                }
            });
        }
    }
  };

  const sendChatMessage = async (text: string) => {
      if (!text.trim()) return;

      const newMessage: ChatMessage = {
          id: Math.random().toString(36),
          sender: player.name,
          text: text,
          timestamp: Date.now(),
          isPlayer: true
      };

      setChatMessages(prev => [...prev, newMessage]);

      // Trigger Simulated Responses
      try {
        const responses = await generateChatResponse(text, player.name);
        setTimeout(() => {
            const aiMessages = responses.map(line => {
                const [sender, ...content] = line.split(':');
                return {
                    id: Math.random().toString(36),
                    sender: sender.trim(),
                    text: content.join(':').trim(),
                    timestamp: Date.now(),
                    isPlayer: false
                };
            });
            setChatMessages(prev => [...prev, ...aiMessages]);
        }, 2000 + Math.random() * 2000);
      } catch (e) {
          console.error("Chat Error", e);
      }
  }

  return (
    <GameContext.Provider value={{
      isLoggedIn,
      player,
      currentLocation,
      lastCombatResult,
      isProcessing,
      nextRegenTime,
      marketStock,
      chatMessages,
      notifications,
      achievements: ACHIEVEMENTS,
      login,
      logout,
      setLocation,
      addGold,
      addXp,
      equipItem,
      unequipItem,
      sellItem,
      buyItem,
      refreshMarket,
      trainStat,
      consumeEnergy,
      setProcessing,
      updateCombatResult,
      healPlayer,
      regenerate,
      sendChatMessage,
      removeNotification
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
};