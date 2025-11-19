import React from 'react';
import { useGame } from '../context/GameContext';
import { calculateDerivedStats } from '../services/gameEngine';
import { StatType, ItemSlot, Item } from '../types';

const Dashboard = () => {
  const { player, achievements } = useGame();
  const derived = calculateDerivedStats(player);

  const getStatDescription = (stat: string) => {
      switch(stat) {
          case 'Strength': return 'Increases minimum and maximum damage deals.';
          case 'Dexterity': return 'Increases chance to hit enemies.';
          case 'Agility': return 'Increases armor and chance to dodge attacks.';
          case 'Constitution': return 'Increases maximum health points.';
          case 'Intelligence': return 'Increases critical strike chance.';
          case 'Charisma': return 'Reduces prices in shops and increases arena fame (Planned).';
          default: return '';
      }
  }

  const StatRow = ({ label, val, bonus }: { label: string, val: number, bonus: number }) => (
    <div 
        className="flex justify-between items-center py-2 border-b border-neutral-800 last:border-0 group relative cursor-help"
        title={getStatDescription(label)}
    >
      <span className="text-neutral-400 group-hover:text-rome-gold transition-colors">{label}</span>
      <span className="font-mono">
        {val} <span className="text-green-500 text-xs">{bonus > 0 ? `(+${bonus})` : ''}</span>
      </span>
    </div>
  );

  const getBaseStat = (type: StatType) => player.stats[type];
  const getStatBonus = (type: StatType) => {
      let bonus = 0;
      Object.values(player.equipped).forEach((item: Item | undefined) => {
          if(item?.stats?.[type]) bonus += item.stats[type]!;
      });
      return bonus;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-serif text-rome-gold border-b border-rome-gold/30 pb-2">Gladiator Profile</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stats Column */}
        <div className="bg-neutral-900/80 p-6 rounded-lg border border-rome-stone shadow-xl">
           <h3 className="text-xl font-serif text-neutral-200 mb-4">Attributes</h3>
           <div className="space-y-1">
             <StatRow label="Strength" val={getBaseStat(StatType.Strength)} bonus={getStatBonus(StatType.Strength)} />
             <StatRow label="Dexterity" val={getBaseStat(StatType.Dexterity)} bonus={getStatBonus(StatType.Dexterity)} />
             <StatRow label="Agility" val={getBaseStat(StatType.Agility)} bonus={getStatBonus(StatType.Agility)} />
             <StatRow label="Constitution" val={getBaseStat(StatType.Constitution)} bonus={getStatBonus(StatType.Constitution)} />
             <StatRow label="Intelligence" val={getBaseStat(StatType.Intelligence)} bonus={getStatBonus(StatType.Intelligence)} />
             <StatRow label="Charisma" val={getBaseStat(StatType.Charisma)} bonus={getStatBonus(StatType.Charisma)} />
           </div>
           <p className="text-xs text-neutral-500 mt-4 italic">* Hover over an attribute to see its effect.</p>
        </div>

        {/* Combat Stats Column */}
        <div className="bg-neutral-900/80 p-6 rounded-lg border border-rome-stone shadow-xl">
            <h3 className="text-xl font-serif text-neutral-200 mb-4">Combat Prowess</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-800 p-3 rounded text-center">
                    <div className="text-xs text-neutral-500 uppercase">Damage</div>
                    <div className="text-xl font-bold text-red-500">{derived.damageMin} - {derived.damageMax}</div>
                </div>
                <div className="bg-neutral-800 p-3 rounded text-center">
                    <div className="text-xs text-neutral-500 uppercase">Armor</div>
                    <div className="text-xl font-bold text-blue-400">{derived.armor}</div>
                </div>
                <div className="bg-neutral-800 p-3 rounded text-center">
                    <div className="text-xs text-neutral-500 uppercase">Crit Chance</div>
                    <div className="text-xl font-bold text-yellow-500">{derived.critChance}%</div>
                </div>
                <div className="bg-neutral-800 p-3 rounded text-center">
                    <div className="text-xs text-neutral-500 uppercase">Hit Chance</div>
                    <div className="text-xl font-bold text-green-500">{Math.floor(derived.hitChance)}%</div>
                </div>
            </div>
        </div>

        {/* Achievements Column */}
        <div className="md:col-span-2 bg-neutral-900/80 p-6 rounded-lg border border-rome-stone shadow-xl">
            <div className="flex justify-between items-end mb-4">
                <h3 className="text-xl font-serif text-neutral-200">Achievements</h3>
                <span className="text-xs text-neutral-500">{player.completedAchievements.length} / {achievements.length} Unlocked</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {achievements.map(ach => {
                    const isUnlocked = player.completedAchievements.includes(ach.id);
                    return (
                        <div key={ach.id} className={`flex items-center gap-3 p-3 rounded border transition-all
                            ${isUnlocked 
                                ? 'bg-neutral-800 border-rome-gold/50 text-neutral-200' 
                                : 'bg-neutral-900 border-neutral-800 text-neutral-600 opacity-60 grayscale'}`}>
                            <div className="text-3xl">{ach.icon}</div>
                            <div>
                                <div className={`font-bold text-sm ${isUnlocked ? 'text-rome-gold' : 'text-neutral-500'}`}>{ach.name}</div>
                                <div className="text-xs">{ach.description}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Currently Equipped Summary */}
        <div className="md:col-span-2 bg-neutral-900/80 p-6 rounded-lg border border-rome-stone shadow-xl">
             <h3 className="text-xl font-serif text-neutral-200 mb-4">Equipment</h3>
             <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {Object.values(ItemSlot).map(slot => {
                    const item = player.equipped[slot];
                    return (
                        <div key={slot} className={`aspect-square rounded border ${item ? 'border-rome-gold bg-neutral-800' : 'border-dashed border-neutral-700 bg-transparent'} flex flex-col items-center justify-center p-1 text-center`}>
                            {item ? (
                                <>
                                <img src={item.icon} alt={item.name} className="w-8 h-8 mb-1 rounded" />
                                <span className="text-[0.6rem] leading-tight text-neutral-300 truncate w-full">{item.name}</span>
                                </>
                            ) : (
                                <span className="text-[0.6rem] text-neutral-600 uppercase">{slot}</span>
                            )}
                        </div>
                    )
                })}
             </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;