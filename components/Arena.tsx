import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { resolveCombat, generateEnemy } from '../services/gameEngine';
import { generateCombatSummary } from '../services/geminiService';

const Arena = () => {
  const { player, updateCombatResult, lastCombatResult } = useGame();
  const [ranking, setRanking] = useState(1204);
  const [isFighting, setIsFighting] = useState(false);
  const [message, setMessage] = useState('');

  const handleFight = async () => {
      if (player.arenaTickets <= 0) {
          setMessage("No tickets remaining today.");
          return;
      }

      setIsFighting(true);
      setMessage("Entering the arena...");
      
      // Generate a "Player-like" enemy
      const enemy = generateEnemy(player.level);
      enemy.name = "Gladiator " + Math.floor(Math.random() * 1000);
      enemy.flavorText = "Another aspiring champion.";
      
      setTimeout(async () => {
          const result = resolveCombat(player, enemy);
          updateCombatResult(result);
          
          if (result.won) {
              setRanking(prev => Math.max(1, prev - Math.floor(Math.random() * 10 + 5)));
              const summary = await generateCombatSummary(result.log.map(l => l.message).join('\n').substring(0, 300), true);
              setMessage(summary);
          } else {
              setMessage("You were humiliated in the sands.");
          }
          
          setIsFighting(false);
      }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-4xl font-serif text-rome-gold mb-2">The Colosseum</h2>
        <p className="text-neutral-400 mb-8">Prove your worth against other gladiators. Rise in the ranks.</p>

        <div className="bg-neutral-900/80 border border-rome-stone p-8 rounded-lg shadow-2xl">
            <div className="flex justify-center gap-12 mb-8">
                <div>
                    <div className="text-xs text-neutral-500 uppercase">Current Rank</div>
                    <div className="text-3xl font-bold text-white">#{ranking}</div>
                </div>
                <div>
                    <div className="text-xs text-neutral-500 uppercase">League</div>
                    <div className="text-3xl font-bold text-yellow-500">Copper</div>
                </div>
            </div>

            {message && (
                <div className="mb-6 p-4 bg-neutral-800 rounded border border-neutral-600 text-neutral-200 italic animate-fade-in">
                    {message}
                </div>
            )}

            <button 
                onClick={handleFight}
                disabled={isFighting || player.hp < 20}
                className={`w-full py-4 text-xl font-bold font-serif rounded transition-all
                ${isFighting ? 'bg-neutral-700 cursor-wait' : 'bg-rome-gold hover:bg-yellow-600 text-rome-dark'}`}
            >
                {isFighting ? "Fighting..." : "Challenge Opponent (1 Ticket)"}
            </button>
            
            <p className="mt-4 text-xs text-neutral-500">Tickets refresh daily. Losses do not grant XP.</p>
        </div>
    </div>
  );
};

export default Arena;