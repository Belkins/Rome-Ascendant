import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { generateEnemy, resolveCombat, XP_TABLE, calculateDerivedStats } from '../services/gameEngine';
import { generateEnemyFlavor, generateCombatSummary, generateDynamicQuestName } from '../services/geminiService';
import { Enemy, CombatLogEntry, ItemRarity, CombatResult, Item, StatType } from '../types';
import CombatScene from './CombatScene';

type LogFilter = 'All' | 'Player Hits' | 'Enemy Hits' | 'Misses' | 'Crits';

const CombatLog = ({ logs }: { logs: CombatLogEntry[] }) => {
    const [filter, setFilter] = useState<LogFilter>('All');

    const filteredLogs = logs.filter(entry => {
        switch (filter) {
            case 'Player Hits': return entry.attacker === 'Player' && !entry.isMiss;
            case 'Enemy Hits': return entry.attacker === 'Enemy' && !entry.isMiss;
            case 'Misses': return entry.isMiss;
            case 'Crits': return entry.isCrit;
            default: return true;
        }
    });

    const filters: LogFilter[] = ['All', 'Player Hits', 'Enemy Hits', 'Misses', 'Crits'];

    return (
        <div className="bg-neutral-950 rounded border border-neutral-800 shadow-inner flex flex-col h-80">
            <div className="flex gap-2 p-2 border-b border-neutral-800 bg-neutral-900/50 overflow-x-auto">
                {filters.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 text-xs rounded border transition-colors whitespace-nowrap
                            ${filter === f
                                ? 'bg-rome-gold text-rome-dark border-rome-gold font-bold'
                                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs md:text-sm scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900">
                {filteredLogs.length === 0 ? (
                    <div className="text-neutral-600 italic text-center mt-10">No entries found.</div>
                ) : (
                    filteredLogs.map((entry, i) => (
                        <div key={i} className={`mb-2 pb-1 border-b border-white/5 last:border-0 ${entry.attacker === 'Player' ? 'text-green-400' : entry.attacker === 'Enemy' ? 'text-red-400' : 'text-neutral-400'}`}>
                            <div className="flex items-center gap-2">
                                {entry.round > 0 && <span className="opacity-30 text-[10px] min-w-[20px]">[{entry.round}]</span>}
                                {entry.isCrit && <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1 rounded border border-yellow-500/30">CRIT</span>}
                                {entry.isMiss && <span className="text-[10px] bg-neutral-500/20 text-neutral-400 px-1 rounded border border-neutral-500/30">MISS</span>}
                                <span>{entry.message}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const RegenTimer = () => {
    const { nextRegenTime, player } = useGame();
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const calculateTimeLeft = () => Math.max(0, Math.ceil((nextRegenTime - Date.now()) / 1000));
        
        setTimeLeft(calculateTimeLeft());
        
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        
        return () => clearInterval(timer);
    }, [nextRegenTime]);

    if (player.energy >= player.maxEnergy) return <span className="text-[10px] text-neutral-500">Energy Full</span>;

    return <span className="text-[10px] text-neutral-400">Regen in: {timeLeft}s</span>;
};

const Expedition = () => {
  const { player, consumeEnergy, updateCombatResult, lastCombatResult, isProcessing, setProcessing } = useGame();
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [flavorText, setFlavorText] = useState<string>('');
  const [questName, setQuestName] = useState<string>('Unknown Lands');
  const [showLog, setShowLog] = useState(false);
  const [summary, setSummary] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [manualMode, setManualMode] = useState(false);

  // Load initial quest name
  useEffect(() => {
      generateDynamicQuestName(player.level).then(setQuestName);
  }, [player.level]);

  const startManualExpedition = async () => {
      if (!consumeEnergy(2)) {
          alert("Not enough energy!");
          return;
      }
      
      const enemy = generateEnemy(player.level);
      const flavor = await generateEnemyFlavor(enemy, 'arena');
      setFlavorText(flavor);
      setCurrentEnemy(enemy);
      setManualMode(true);
      setShowLog(false);
  };

  const handleManualCombatComplete = async (result: CombatResult) => {
      setManualMode(false);
      setProcessing(true);
      
      updateCombatResult(result);
      
      const sum = await generateCombatSummary(result.log.map(l => l.message).join('\n').substring(0, 500), result.won);
      setSummary(sum);
      
      setProcessing(false);
      setShowLog(true);
  };

  const startAutoExpedition = async () => {
    if (!consumeEnergy(2)) {
        alert("Not enough energy! Wait for it to regenerate.");
        return;
    }
    
    setProcessing(true);
    setShowLog(false);
    setSummary('');
    setStatusMessage('');
    setManualMode(false);
    
    const enemy = generateEnemy(player.level);
    setCurrentEnemy(enemy);
    
    // Async flavor text
    const flavor = await generateEnemyFlavor(enemy, 'wilds');
    setFlavorText(flavor);
    
    // Simulate travel time (short for UX)
    setTimeout(async () => {
        const result = resolveCombat(player, enemy);
        updateCombatResult(result);
        
        // Get summary from AI
        const sum = await generateCombatSummary(result.log.map(l => l.message).join('\n').substring(0, 500), result.won);
        setSummary(sum);
        
        setProcessing(false);
        setShowLog(true);
    }, 1500);
  };

  const handleAutoRepeat = async () => {
    const maxRuns = 5;
    if (player.energy < 2) {
        alert("Not enough energy!");
        return;
    }

    setProcessing(true);
    setShowLog(false);
    setSummary("Preparing auto-expedition...");
    setManualMode(false);

    // Local Simulation State
    // We must copy player to track HP loss across multiple battles without updating React state yet
    let simPlayer = { ...player };
    let simXp = player.xp;
    let simXpToNext = player.xpToNext;
    let simLevel = player.level;
    // We need a local copy of stats to simulate the level up stat bump
    let simStats = { ...player.stats }; 

    const batchLog: CombatLogEntry[] = [];
    let totalXp = 0;
    let totalGold = 0;
    const totalItems: Item[] = [];
    let wins = 0;
    let runs = 0;
    let lastEnemy: Enemy | null = null;
    
    for(let i = 0; i < maxRuns; i++) {
        setStatusMessage(`Fighting Battle ${i + 1} of ${maxRuns}...`);
        
        // Check constraints
        if (simPlayer.energy < 2) break;
        if (simPlayer.hp <= 0) break;

        // Artificial delay for UX
        await new Promise(resolve => setTimeout(resolve, 800));

        // Deduct energy locally
        simPlayer.energy -= 2;
        runs++;

        const enemy = generateEnemy(simLevel); // Use simLevel for enemy generation
        lastEnemy = enemy; // Capture the last enemy for the result UI
        
        // Run combat with current local state
        // We must construct a temporary player object with the SIMULATED stats/level
        const combatPlayerState = { ...simPlayer, level: simLevel, stats: simStats };
        const result = resolveCombat(combatPlayerState, enemy);

        // Merge Logs
        batchLog.push({ 
            round: 0, 
            attacker: 'Player', 
            damage: 0, 
            isCrit: false, 
            isMiss: false, 
            message: `--- BATTLE ${i+1} (Lvl ${simLevel}) VS ${enemy.name.toUpperCase()} ---` 
        });
        batchLog.push(...result.log);

        // Calculate damage taken to update simPlayer for next check
        const dmgTaken = result.log
            .filter(l => l.attacker === 'Enemy')
            .reduce((acc, curr) => acc + curr.damage, 0);
        
        simPlayer.hp -= dmgTaken;

        if (result.won && result.rewards) {
            wins++;
            totalXp += result.rewards.xp;
            totalGold += result.rewards.gold;
            totalItems.push(...result.rewards.items);

            // SIMULATE LEVEL UP
            // This is critical so the player gets their heal during the batch
            simXp += result.rewards.xp;
            while (simXp >= simXpToNext) {
                simXp -= simXpToNext;
                simLevel++;
                simXpToNext = XP_TABLE(simLevel);
                
                // Simulate Stat Bump (matches GameContext)
                simStats[StatType.Strength] += 1;
                simStats[StatType.Constitution] += 1;

                // Simulate Full Heal
                const tempPlayerForCalc = { ...simPlayer, level: simLevel, stats: simStats };
                const derived = calculateDerivedStats(tempPlayerForCalc);
                simPlayer.hp = derived.maxHp;

                batchLog.push({ 
                    round: 0, 
                    attacker: 'Player', 
                    damage: 0, 
                    isCrit: false, 
                    isMiss: false, 
                    message: `*** LEVEL UP! Reached Level ${simLevel}. HP Restored. ***` 
                });
            }

        } else {
            // Stop on defeat
             batchLog.push({ 
                round: 0, 
                attacker: 'Enemy', 
                damage: 0, 
                isCrit: false, 
                isMiss: false, 
                message: `!!! DEFEAT - EXPEDITION ENDED EARLY !!!` 
            });
            break;
        }
    }

    // Commit the batch result
    consumeEnergy(runs * 2);

    // Use a placeholder enemy if none generated (shouldn't happen if runs > 0)
    const resultEnemy = lastEnemy || generateEnemy(simLevel);
    if (!lastEnemy && runs === 0) {
        // Failed to start
        setProcessing(false);
        return;
    }
    
    // If last run was a win, enemy HP should be 0 for the visual
    if (wins === runs && lastEnemy) {
        resultEnemy.hp = 0;
    }

    const finalResult: CombatResult = {
        won: wins > 0, 
        log: batchLog,
        enemy: resultEnemy,
        rewards: {
            xp: totalXp,
            gold: totalGold,
            items: totalItems
        }
    };

    updateCombatResult(finalResult);
    
    const sum = `Completed ${runs} expeditions. Won ${wins}. ${wins < runs ? 'Stopped due to defeat.' : ''}`;
    setSummary(sum);
    setFlavorText(`You spent hours patrolling the ${questName}...`);
    setStatusMessage('');
    setProcessing(false);
    setShowLog(true);
  };

  if (manualMode && currentEnemy) {
      return (
          <div className="max-w-5xl mx-auto">
              <CombatScene 
                player={player} 
                enemy={currentEnemy} 
                onComplete={handleManualCombatComplete} 
            />
          </div>
      )
  }

  if (isProcessing) {
      return (
          <div className="flex flex-col items-center justify-center h-96 animate-pulse">
              <div className="text-4xl mb-4">⚔️</div>
              <h2 className="text-2xl font-serif text-rome-gold">
                  {statusMessage || `Traveling to the ${questName}...`}
              </h2>
              <p className="text-neutral-400 mt-2">{flavorText || "Scouting the area..."}</p>
          </div>
      )
  }

  return (
    <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-end mb-6">
            <div>
                <h2 className="text-3xl font-serif text-rome-gold">{questName}</h2>
                <p className="text-neutral-400 text-sm">Province of Italia • Threat Level {player.level}</p>
            </div>
            <div className="text-right">
                <div className="text-sm text-neutral-400">Energy Cost</div>
                <div className="text-xl text-yellow-500 font-bold">2 ⚡</div>
                <RegenTimer />
            </div>
        </div>

        {!showLog ? (
            <div className="bg-neutral-900/90 p-8 rounded-lg border border-rome-stone text-center shadow-2xl">
                <div className="w-32 h-32 mx-auto bg-neutral-800 rounded-full flex items-center justify-center mb-6 border-4 border-neutral-700">
                    <span className="text-6xl">🌲</span>
                </div>
                <p className="mb-8 text-lg text-neutral-300">
                    Venturing into the wilds requires courage. <br/>
                    Enemies here drop standard loot and grant experience.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                        onClick={startManualExpedition}
                        disabled={player.energy < 2 || player.hp <= 0}
                        className={`px-4 py-4 rounded font-serif text-lg font-bold transition-all transform hover:scale-105 flex flex-col items-center gap-1 group
                        ${player.energy < 2 || player.hp <= 0 
                            ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed' 
                            : 'bg-rome-red hover:bg-red-700 text-white shadow-[0_0_20px_rgba(153,27,27,0.5)]'}`}
                    >
                        <span className="text-2xl group-hover:rotate-12 transition-transform">🗡️</span>
                        <span>Manual Combat</span>
                        <span className="text-[10px] opacity-70 font-sans font-normal uppercase tracking-widest">You Control the Fight</span>
                    </button>

                    <button 
                        onClick={startAutoExpedition}
                        disabled={player.energy < 2 || player.hp <= 0}
                        className={`px-4 py-4 rounded font-serif text-lg font-bold transition-all transform hover:scale-105 flex flex-col items-center gap-1 group
                        ${player.energy < 2 || player.hp <= 0 
                            ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed' 
                            : 'bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-neutral-200'}`}
                    >
                        <span className="text-2xl group-hover:translate-x-1 transition-transform">⚡</span>
                        <span>Quick Auto</span>
                         <span className="text-[10px] opacity-70 font-sans font-normal uppercase tracking-widest">Instant Result</span>
                    </button>

                    <button 
                        onClick={handleAutoRepeat}
                        disabled={player.energy < 2 || player.hp <= 0}
                        className={`px-4 py-4 rounded font-serif text-lg font-bold transition-all transform hover:scale-105 flex flex-col items-center gap-1 group
                        ${player.energy < 2 || player.hp <= 0 
                            ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed' 
                            : 'bg-neutral-800 hover:bg-neutral-700 border border-rome-gold/50 text-rome-gold'}`}
                    >
                        <span className="text-2xl group-hover:spin transition-transform">🔄</span>
                        <span>Auto-Repeat x5</span>
                         <span className="text-[10px] opacity-70 font-sans font-normal uppercase tracking-widest">Batch Process</span>
                    </button>
                </div>
            </div>
        ) : (
            <div className="space-y-6 animate-fade-in">
                {/* Result Banner & Enemy Visual */}
                <div className={`p-4 rounded border-l-4 relative overflow-hidden ${lastCombatResult?.won ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'}`}>
                    <div className="flex justify-between items-start relative z-10">
                         <div>
                            <h3 className={`text-2xl font-serif font-bold mb-1 ${lastCombatResult?.won ? 'text-green-400' : 'text-red-400'}`}>
                                {lastCombatResult?.won ? 'EXPEDITION COMPLETE' : 'DEFEAT'}
                            </h3>
                            <p className="text-neutral-300 italic mb-4">"{summary}"</p>
                         </div>
                         {/* Enemy Status Card */}
                         {lastCombatResult?.enemy && (
                             <div className="bg-black/40 p-3 rounded border border-white/10 min-w-[150px]">
                                 <div className="text-xs text-neutral-400 uppercase mb-1">Enemy</div>
                                 <div className="font-bold text-rome-light">{lastCombatResult.enemy.name}</div>
                                 <div className="text-xs text-neutral-500 mb-2">Level {lastCombatResult.enemy.level}</div>
                                 
                                 {/* Enemy HP Bar */}
                                 <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden border border-white/10">
                                     <div 
                                        className="h-full bg-red-600 transition-all duration-500" 
                                        style={{ width: `${(lastCombatResult.enemy.hp / lastCombatResult.enemy.maxHp) * 100}%` }}
                                     ></div>
                                 </div>
                                 <div className="text-[10px] text-right mt-1 text-red-400">
                                     {lastCombatResult.enemy.hp} / {lastCombatResult.enemy.maxHp} HP
                                 </div>
                             </div>
                         )}
                    </div>
                </div>

                {/* Rewards */}
                {lastCombatResult?.won && lastCombatResult.rewards && (
                    <div className="flex flex-col gap-2 py-4 bg-neutral-900/50 rounded border border-rome-stone/30 items-center">
                        <div className="flex gap-8">
                            <div className="text-center">
                                <div className="text-xs text-neutral-500 uppercase">Total Experience</div>
                                <div className="text-xl text-blue-400 font-bold">+{lastCombatResult.rewards.xp} XP</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-neutral-500 uppercase">Total Gold</div>
                                <div className="text-xl text-yellow-400 font-bold">+{lastCombatResult.rewards.gold} Gold</div>
                            </div>
                        </div>
                        {lastCombatResult.rewards.items && lastCombatResult.rewards.items.length > 0 && (
                            <div className="flex gap-2 flex-wrap justify-center mt-2">
                                {lastCombatResult.rewards.items.map((item, idx) => (
                                     <div key={idx} className="text-center animate-bounce delay-75 px-3 py-1 bg-black/30 rounded border border-white/10">
                                        <div className="text-[10px] text-neutral-500 uppercase">Loot</div>
                                        <div className={`text-sm font-bold ${
                                            item.rarity === ItemRarity.Legendary ? 'text-orange-500' :
                                            item.rarity === ItemRarity.Epic ? 'text-purple-400' :
                                            item.rarity === ItemRarity.Rare ? 'text-blue-400' :
                                            item.rarity === ItemRarity.Uncommon ? 'text-green-400' : 'text-neutral-300'
                                        }`}>
                                            {item.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Drop Rates Table */}
                        <div className="mt-6 pt-4 border-t border-neutral-800 w-full max-w-md mx-auto px-4">
                            <p className="text-[10px] uppercase text-neutral-500 text-center mb-2 tracking-widest">Loot Rarity Chances</p>
                            <div className="grid grid-cols-5 gap-1 text-center text-xs bg-black/20 rounded p-2">
                                <div className="flex flex-col">
                                    <span className="text-neutral-400 font-bold">Common</span>
                                    <span className="text-neutral-600">50%</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-green-500 font-bold">Uncommon</span>
                                    <span className="text-green-900/70">20%</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-blue-500 font-bold">Rare</span>
                                    <span className="text-blue-900/70">15%</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-purple-500 font-bold">Epic</span>
                                    <span className="text-purple-900/70">10%</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-orange-500 font-bold">Legendary</span>
                                    <span className="text-orange-900/70">5%</span>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* Log */}
                <div>
                    <div className="flex justify-between mb-2 text-sm text-neutral-400">
                        <span>Combat Log</span>
                        <button onClick={() => setShowLog(false)} className="text-rome-gold hover:underline">Back to Map</button>
                    </div>
                    <CombatLog logs={lastCombatResult?.log || []} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                     <button 
                        onClick={startManualExpedition}
                        className="py-4 bg-rome-red hover:bg-red-700 border border-rome-red text-white font-serif rounded font-bold transition-colors"
                    >
                        Fight Again (Manual)
                    </button>
                    <button 
                        onClick={startAutoExpedition}
                        className="py-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-neutral-300 font-serif rounded"
                    >
                        Quick Auto
                    </button>
                    <button 
                         onClick={handleAutoRepeat}
                        className="py-4 bg-neutral-800 hover:bg-neutral-700 border border-rome-gold/50 text-rome-gold font-serif rounded"
                    >
                        Auto-Repeat x5
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default Expedition;