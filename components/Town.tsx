import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { StatType, ItemRarity } from '../types';
import { TRAIN_COST, calculateDerivedStats } from '../services/gameEngine';
import { getOracleWisdom } from '../services/geminiService';

const StatTrainer: React.FC<{ stat: StatType }> = ({ stat }) => {
    const { player, trainStat } = useGame();
    const val = player.stats[stat];
    const cost = TRAIN_COST(val);
    const canAfford = player.gold >= cost;

    return (
        <div className="flex justify-between items-center p-3 bg-neutral-800 rounded border border-neutral-700">
            <div>
                <div className="font-bold text-neutral-200">{stat}</div>
                <div className="text-xs text-neutral-500">Current: {val}</div>
            </div>
            <button 
              onClick={() => trainStat(stat, cost)}
              disabled={!canAfford}
              className={`px-3 py-1 rounded text-sm font-bold flex flex-col items-end transition-colors
              ${canAfford ? 'bg-rome-gold text-rome-dark hover:bg-yellow-500' : 'bg-neutral-700 text-neutral-500'}`}
            >
                <span>Train</span>
                <span className="text-[10px]">Cost: {cost} 💰</span>
            </button>
        </div>
    )
};

const Town = () => {
  const { player, addGold, healPlayer, marketStock, buyItem, refreshMarket } = useGame();
  const [activeTab, setActiveTab] = useState<'training' | 'market' | 'temple'>('training');
  const [prophecy, setProphecy] = useState('');
  const derived = calculateDerivedStats(player);

  useEffect(() => {
      if (activeTab === 'temple' && !prophecy) {
          getOracleWisdom().then(setProphecy);
      }
  }, [activeTab]);

  const healCost = Math.max(10, Math.floor((derived.maxHp - player.hp) * 0.5));
  const canHeal = player.hp < derived.maxHp && player.gold >= healCost;

  return (
    <div>
        <div className="flex space-x-4 mb-6 border-b border-neutral-700 pb-2 overflow-x-auto">
            <button 
                onClick={() => setActiveTab('training')}
                className={`text-lg md:text-xl font-serif px-4 py-2 whitespace-nowrap transition-colors ${activeTab === 'training' ? 'text-rome-gold border-b-2 border-rome-gold' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
                Ludus (Train)
            </button>
            <button 
                onClick={() => setActiveTab('market')}
                className={`text-lg md:text-xl font-serif px-4 py-2 whitespace-nowrap transition-colors ${activeTab === 'market' ? 'text-rome-gold border-b-2 border-rome-gold' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
                Forum (Market)
            </button>
            <button 
                onClick={() => setActiveTab('temple')}
                className={`text-lg md:text-xl font-serif px-4 py-2 whitespace-nowrap transition-colors ${activeTab === 'temple' ? 'text-rome-gold border-b-2 border-rome-gold' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
                Temple & Jobs
            </button>
        </div>

        {activeTab === 'training' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div className="bg-neutral-900/80 p-6 rounded shadow-xl border border-rome-stone">
                    <h3 className="text-lg font-serif mb-4 text-white">Improve Attributes</h3>
                    <div className="space-y-2">
                        {Object.values(StatType).map(s => <StatTrainer key={s} stat={s} />)}
                    </div>
                </div>
                <div className="bg-neutral-900/80 p-6 rounded shadow-xl border border-rome-stone h-fit">
                     <h3 className="text-lg font-serif mb-4 text-white">Physician</h3>
                     <div className="flex justify-between items-center mb-4">
                         <span>Health: {player.hp} / {derived.maxHp}</span>
                         <div className="w-32 h-2 bg-neutral-800 rounded-full overflow-hidden">
                             <div className="h-full bg-red-600" style={{ width: `${(player.hp / derived.maxHp) * 100}%` }}></div>
                         </div>
                     </div>
                     {player.hp < derived.maxHp ? (
                        <button 
                            onClick={() => {
                                if (player.gold >= healCost) {
                                    addGold(-healCost);
                                    healPlayer(derived.maxHp - player.hp);
                                }
                            }}
                            disabled={!canHeal}
                            className={`w-full py-2 border text-center rounded transition-colors
                                ${canHeal 
                                    ? 'bg-red-900/50 border-red-700 text-red-200 hover:bg-red-900 cursor-pointer' 
                                    : 'bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed'}`}
                        >
                            Heal Wounds ({healCost} Gold)
                        </button>
                     ) : (
                         <div className="text-center text-green-500 py-2 border border-green-900/30 bg-green-900/10 rounded">
                             You are fully healthy.
                         </div>
                     )}
                </div>
            </div>
        )}

        {activeTab === 'market' && (
             <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-4 bg-neutral-900/80 p-4 rounded border border-rome-stone">
                    <div>
                        <h3 className="text-xl font-serif text-rome-gold">The Merchant's Stall</h3>
                        <p className="text-neutral-400 text-sm">New wares arrive daily.</p>
                    </div>
                    <button 
                        onClick={refreshMarket}
                        className="text-xs text-neutral-500 underline hover:text-rome-gold"
                    >
                        Refresh Stock (Debug)
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {marketStock.map(item => {
                        const canBuy = player.gold >= item.value;
                        return (
                            <div key={item.id} className={`p-3 rounded border flex flex-col gap-2 relative group
                                ${item.rarity === ItemRarity.Legendary ? 'border-orange-500 bg-orange-900/10' : 
                                item.rarity === ItemRarity.Epic ? 'border-purple-500 bg-purple-900/10' :
                                item.rarity === ItemRarity.Rare ? 'border-blue-500 bg-blue-900/10' :
                                'border-neutral-700 bg-neutral-800'}`}>
                                
                                <div className="flex items-start gap-2">
                                    <img src={item.icon} className="w-12 h-12 rounded bg-neutral-900" alt="icon" />
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-bold text-sm truncate ${
                                            item.rarity === ItemRarity.Legendary ? 'text-orange-400' : 
                                            item.rarity === ItemRarity.Epic ? 'text-purple-400' :
                                            item.rarity === ItemRarity.Rare ? 'text-blue-400' : 'text-neutral-300'
                                        }`}>{item.name}</div>
                                        <div className="text-[10px] text-neutral-500 uppercase">{item.rarity} {item.slot}</div>
                                        <div className="text-xs text-neutral-400 mt-1">
                                            {item.damageMin && <span>Dmg: {item.damageMin}-{item.damageMax} </span>}
                                            {item.armor && <span>Armor: {item.armor} </span>}
                                            {Object.entries(item.stats).map(([key, val]) => (
                                                <span key={key} className="ml-1 text-green-400">+{val} {key.substr(0,3)}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-2">
                                    <button 
                                        onClick={() => buyItem(item)}
                                        disabled={!canBuy}
                                        className={`w-full py-2 rounded text-sm font-bold flex justify-between px-4
                                        ${canBuy 
                                            ? 'bg-rome-gold text-rome-dark hover:bg-yellow-500' 
                                            : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'}`}
                                    >
                                        <span>Buy</span>
                                        <span>{item.value} 💰</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>
        )}

        {activeTab === 'temple' && (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-neutral-900/80 p-6 rounded border border-purple-900/50 shadow-[0_0_30px_rgba(88,28,135,0.2)]">
                    <h3 className="text-2xl font-serif text-purple-400 mb-2">Oracle of Delphi</h3>
                    <p className="text-neutral-300 italic font-serif text-lg mb-4">"{prophecy}"</p>
                    <button onClick={() => getOracleWisdom().then(setProphecy)} className="text-sm text-purple-400 hover:underline">Ask again...</button>
                </div>

                <div className="bg-neutral-900/80 p-6 rounded border border-rome-stone">
                    <h3 className="text-xl font-serif text-yellow-600 mb-2">Stable Work</h3>
                    <p className="text-neutral-400 mb-4">Work in the stables to earn a meager living. Takes time, but is safe.</p>
                    <button 
                        onClick={() => {
                            alert("You worked for 1 hour and earned 15 Gold.");
                            addGold(15);
                        }}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded transition-colors"
                    >
                        Work (Instant for MVP) - Gain 15 💰
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default Town;