import React, { useState, useEffect, useRef } from 'react';
import { Enemy, Player, CombatResult, CombatLogEntry, Item } from '../types';
import { calculateDerivedStats, generateRandomItem } from '../services/gameEngine';

interface CombatSceneProps {
    player: Player;
    enemy: Enemy;
    onComplete: (result: CombatResult) => void;
}

type CombatState = 'START' | 'PLAYER_TURN' | 'ENEMY_TURN' | 'VICTORY' | 'DEFEAT';

const CombatScene: React.FC<CombatSceneProps> = ({ player, enemy, onComplete }) => {
    const derivedStats = calculateDerivedStats(player);
    
    // Combat State
    const [combatState, setCombatState] = useState<CombatState>('START');
    const [turn, setTurn] = useState(1);
    const [logs, setLogs] = useState<CombatLogEntry[]>([]);
    
    // Entity State
    const [playerHp, setPlayerHp] = useState(player.hp);
    const [enemyHp, setEnemyHp] = useState(enemy.hp);
    const [enemyMaxHp] = useState(enemy.maxHp); // Static max for reference
    
    // Cooldowns & Buffs
    const [cooldowns, setCooldowns] = useState({ heavy: 0, heal: 0 });
    const [isDefending, setIsDefending] = useState(false);
    
    // Visuals
    const [shake, setShake] = useState(false);
    const [damageFlash, setDamageFlash] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    // Initialize Fight
    useEffect(() => {
        addLog("BATTLE STARTED!", `You face a Level ${enemy.level} ${enemy.name}.`);
        setTimeout(() => setCombatState('PLAYER_TURN'), 1000);
    }, []);

    // Check Win/Loss
    useEffect(() => {
        if (enemyHp <= 0 && combatState !== 'VICTORY') {
            setCombatState('VICTORY');
            setTimeout(finishFightWin, 1500);
        } else if (playerHp <= 0 && combatState !== 'DEFEAT') {
            setCombatState('DEFEAT');
            setTimeout(finishFightLoss, 1500);
        }
    }, [enemyHp, playerHp]);

    const addLog = (title: string, message: string, isPlayer: boolean = true, isCrit: boolean = false) => {
        setLogs(prev => [...prev, {
            round: turn,
            attacker: isPlayer ? 'Player' : 'Enemy',
            damage: 0,
            isCrit,
            isMiss: false,
            message: message
        }]);
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const triggerFlash = () => {
        setDamageFlash(true);
        setTimeout(() => setDamageFlash(false), 300);
    };

    const playerAction = (action: 'attack' | 'heavy' | 'defend' | 'heal') => {
        if (combatState !== 'PLAYER_TURN') return;

        let damage = 0;
        let isCrit = false;
        let logMsg = "";

        // Reset Defend status from previous turn if any (though usually resets on turn start)
        // Actually defend logic applies to NEXT turn damage taken.

        switch (action) {
            case 'attack':
                isCrit = Math.random() * 100 < derivedStats.critChance;
                damage = Math.floor(Math.random() * (derivedStats.damageMax - derivedStats.damageMin + 1)) + derivedStats.damageMin;
                if (isCrit) damage = Math.floor(damage * 1.5);
                damage = Math.max(1, damage - Math.floor(enemy.armor / 2));
                
                logMsg = isCrit ? `CRITICAL HIT! You struck for ${damage} damage!` : `You attacked for ${damage} damage.`;
                setEnemyHp(prev => Math.max(0, prev - damage));
                addLog("Attack", logMsg, true, isCrit);
                break;

            case 'heavy':
                // 150% Damage, but Cooldown
                isCrit = Math.random() * 100 < derivedStats.critChance;
                const baseDmg = Math.floor(Math.random() * (derivedStats.damageMax - derivedStats.damageMin + 1)) + derivedStats.damageMin;
                damage = Math.floor(baseDmg * 1.6); // 1.6x multiplier
                if (isCrit) damage = Math.floor(damage * 1.5);
                damage = Math.max(1, damage - Math.floor(enemy.armor / 2));

                logMsg = `You unleashed a heavy blow for ${damage} damage!`;
                setEnemyHp(prev => Math.max(0, prev - damage));
                setCooldowns(prev => ({ ...prev, heavy: 4 })); // 3 turn CD
                addLog("Heavy Strike", logMsg, true, isCrit);
                triggerShake();
                break;

            case 'defend':
                setIsDefending(true);
                addLog("Defend", "You raise your guard, reducing incoming damage.", true);
                break;

            case 'heal':
                const healAmount = Math.floor(derivedStats.maxHp * 0.25);
                setPlayerHp(prev => Math.min(derivedStats.maxHp, prev + healAmount));
                setCooldowns(prev => ({ ...prev, heal: 5 })); // 4 turn CD
                addLog("Second Wind", `You bandage your wounds, recovering ${healAmount} HP.`, true);
                break;
        }

        if (enemyHp > damage) { // Only switch turn if enemy didn't just die
            setCombatState('ENEMY_TURN');
            setTimeout(executeEnemyTurn, 1200);
        }
    };

    const executeEnemyTurn = () => {
        if (enemyHp <= 0) return;

        // 10% chance enemy misses based on agility?
        const hitChance = 90 - (derivedStats.agility * 0.5); 
        const isHit = Math.random() * 100 < hitChance;

        if (!isHit) {
            addLog("Dodge", `${enemy.name} attacked but you dodged!`, false);
        } else {
            let damage = Math.floor(Math.random() * (enemy.damageMax - enemy.damageMin + 1)) + enemy.damageMin;
            
            // Mitigation
            let mitigation = Math.floor(derivedStats.armor / 2);
            if (isDefending) {
                mitigation += Math.floor(damage * 0.5); // 50% reduction
                setIsDefending(false); // Reset defend
            }
            
            damage = Math.max(1, damage - mitigation);
            
            setPlayerHp(prev => Math.max(0, prev - damage));
            addLog("Enemy Attack", `${enemy.name} hit you for ${damage} damage.`, false);
            triggerFlash();
            triggerShake();
        }

        // Tick Cooldowns
        setCooldowns(prev => ({
            heavy: Math.max(0, prev.heavy - 1),
            heal: Math.max(0, prev.heal - 1)
        }));

        setTurn(prev => prev + 1);
        
        if (playerHp > 0) {
            setCombatState('PLAYER_TURN');
        }
    };

    const finishFightWin = () => {
        let rewardItems: Item[] = [];
        if (Math.random() < 0.4) {
            rewardItems.push(generateRandomItem(enemy.level));
        }

        // Construct enemy object with end state HP for display
        const finalEnemy = { ...enemy, hp: 0 };

        const result: CombatResult = {
            won: true,
            log: logs,
            enemy: finalEnemy,
            rewards: {
                xp: enemy.xpReward,
                gold: enemy.goldReward,
                items: rewardItems
            }
        };
        onComplete(result);
    };

    const finishFightLoss = () => {
        const finalEnemy = { ...enemy, hp: enemyHp };
        const result: CombatResult = {
            won: false,
            log: logs,
            enemy: finalEnemy
        };
        onComplete(result);
    };

    return (
        <div className={`relative w-full max-w-4xl mx-auto p-4 md:p-8 rounded-lg border border-rome-stone bg-neutral-950 shadow-2xl overflow-hidden ${shake ? 'animate-shake' : ''}`}>
            {damageFlash && <div className="absolute inset-0 bg-red-900/30 z-10 pointer-events-none transition-opacity"></div>}
            
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <div className="text-xs text-neutral-500 font-mono">TURN {turn}</div>
                <div className={`font-serif text-xl font-bold tracking-widest ${combatState === 'PLAYER_TURN' ? 'text-green-400 animate-pulse' : 'text-red-400'}`}>
                    {combatState === 'PLAYER_TURN' ? 'YOUR TURN' : combatState === 'ENEMY_TURN' ? 'ENEMY TURN' : combatState === 'VICTORY' ? 'VICTORY' : 'DEFEAT'}
                </div>
                <div className="text-xs text-neutral-500 font-mono">VS {enemy.name.toUpperCase()}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mb-8">
                {/* Player Side */}
                <div className="flex flex-col justify-end items-center md:items-start relative">
                    <div className="mb-2 text-rome-gold font-bold text-lg font-serif">{player.name}</div>
                    
                    {/* Player HP Bar */}
                    <div className="w-full h-6 bg-neutral-900 rounded border border-neutral-700 relative overflow-hidden mb-4 shadow-inner">
                        <div className="absolute inset-0 flex items-center justify-center text-xs z-10 text-white font-bold drop-shadow-md">
                            {playerHp} / {derivedStats.maxHp}
                        </div>
                        <div 
                            className="h-full bg-green-700 transition-all duration-300" 
                            style={{ width: `${(playerHp / derivedStats.maxHp) * 100}%` }}
                        ></div>
                    </div>

                    <div className="text-6xl md:text-8xl select-none filter drop-shadow-lg grayscale hover:grayscale-0 transition-all">🛡️</div>
                    {isDefending && <div className="mt-2 text-blue-400 text-sm font-bold animate-bounce">DEFENDING</div>}
                </div>

                {/* Enemy Side */}
                <div className="flex flex-col justify-end items-center md:items-end relative">
                     <div className="mb-2 text-red-400 font-bold text-lg font-serif">{enemy.name} (Lvl {enemy.level})</div>
                    
                    {/* Enemy HP Bar */}
                    <div className="w-full h-6 bg-neutral-900 rounded border border-neutral-700 relative overflow-hidden mb-4 shadow-inner">
                        <div className="absolute inset-0 flex items-center justify-center text-xs z-10 text-white font-bold drop-shadow-md">
                            {enemyHp} / {enemyMaxHp}
                        </div>
                        <div 
                            className="h-full bg-red-700 transition-all duration-300" 
                            style={{ width: `${(enemyHp / enemyMaxHp) * 100}%` }}
                        ></div>
                    </div>

                    <div className={`text-6xl md:text-8xl select-none filter drop-shadow-lg ${combatState === 'ENEMY_TURN' ? 'scale-110' : ''} transition-transform`}>🐺</div>
                </div>
            </div>

            {/* Controls / Log */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Action Bar */}
                <div className="md:col-span-2 grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => playerAction('attack')}
                        disabled={combatState !== 'PLAYER_TURN'}
                        className="p-4 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-600 rounded group transition-all active:scale-95"
                    >
                        <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">⚔️</div>
                        <div className="font-bold text-neutral-200">Attack</div>
                        <div className="text-[10px] text-neutral-500">Basic Damage</div>
                    </button>

                    <button 
                        onClick={() => playerAction('heavy')}
                        disabled={combatState !== 'PLAYER_TURN' || cooldowns.heavy > 0}
                        className="p-4 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-600 rounded group transition-all active:scale-95 relative overflow-hidden"
                    >
                        {cooldowns.heavy > 0 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-bold text-2xl text-white z-10">{cooldowns.heavy}</div>}
                        <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🔨</div>
                        <div className="font-bold text-neutral-200">Heavy Strike</div>
                        <div className="text-[10px] text-neutral-500">High Dmg • 3 Turn CD</div>
                    </button>

                    <button 
                        onClick={() => playerAction('defend')}
                        disabled={combatState !== 'PLAYER_TURN'}
                        className="p-4 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-600 rounded group transition-all active:scale-95"
                    >
                        <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🛡️</div>
                        <div className="font-bold text-neutral-200">Defend</div>
                        <div className="text-[10px] text-neutral-500">Reduce Next Dmg</div>
                    </button>

                    <button 
                        onClick={() => playerAction('heal')}
                        disabled={combatState !== 'PLAYER_TURN' || cooldowns.heal > 0}
                        className="p-4 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-600 rounded group transition-all active:scale-95 relative overflow-hidden"
                    >
                         {cooldowns.heal > 0 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-bold text-2xl text-white z-10">{cooldowns.heal}</div>}
                        <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">❤️</div>
                        <div className="font-bold text-neutral-200">Second Wind</div>
                        <div className="text-[10px] text-neutral-500">Heal 25% • 4 Turn CD</div>
                    </button>
                </div>

                {/* Live Log */}
                <div className="bg-black/40 rounded border border-white/5 p-2 h-48 md:h-auto overflow-y-auto font-mono text-xs space-y-1">
                    {logs.map((l, i) => (
                        <div key={i} className={`${l.isCrit ? 'text-yellow-400 font-bold' : l.attacker === 'Player' ? 'text-green-400' : 'text-red-400'} animate-fade-in`}>
                            {l.attacker === 'Player' ? '> ' : '< '} {l.message}
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>
    );
};

export default CombatScene;