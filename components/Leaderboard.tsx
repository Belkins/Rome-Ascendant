import React from 'react';
import { useGame } from '../context/GameContext';

const Leaderboard = () => {
  const { player } = useGame();

  // Simulate a leaderboard list
  const generateLeaderboard = () => {
      const bots = [
          { name: 'Maximus Decimus', level: 50, gold: 50420, class: 'Legend', isMe: false },
          { name: 'Commodus_X', level: 48, gold: 41000, class: 'Emperor', isMe: false },
          { name: 'SpartacusNet', level: 45, gold: 32000, class: 'Rebel', isMe: false },
          { name: 'FlammaTheGreat', level: 42, gold: 28500, class: 'Champion', isMe: false },
          { name: 'Crixus_Alpha', level: 39, gold: 21000, class: 'Warrior', isMe: false },
      ];

      // Insert player somewhere based on level
      const playerEntry = { 
          name: player.name, 
          level: player.level, 
          gold: player.gold, 
          class: 'You',
          isMe: true 
      };

      const all = [...bots, playerEntry].sort((a, b) => b.level - a.level);
      return all;
  };

  const list = generateLeaderboard();

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
            <h2 className="text-4xl font-serif text-rome-gold mb-2">Global Rankings</h2>
            <p className="text-neutral-400">The most renowned names in the Empire.</p>
        </div>

        <div className="bg-neutral-900/80 border border-rome-stone rounded-lg overflow-hidden shadow-2xl">
            <div className="grid grid-cols-12 bg-neutral-950 p-4 font-serif text-neutral-500 border-b border-rome-stone/50 text-xs md:text-sm uppercase tracking-wider">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5">Gladiator</div>
                <div className="col-span-2 text-center">Level</div>
                <div className="col-span-2 text-center">Gold</div>
                <div className="col-span-2 text-center">Title</div>
            </div>

            {list.map((entry, idx) => (
                <div 
                    key={idx} 
                    className={`grid grid-cols-12 p-4 items-center border-b border-neutral-800 last:border-0 transition-colors
                        ${entry.isMe ? 'bg-rome-gold/10 border-l-4 border-l-rome-gold' : 'hover:bg-neutral-800/50'}`}
                >
                    <div className="col-span-1 text-center font-mono text-neutral-500 font-bold">{idx + 1}</div>
                    <div className={`col-span-5 font-bold text-lg ${entry.isMe ? 'text-rome-gold' : 'text-neutral-300'}`}>
                        {entry.name}
                        {entry.isMe && <span className="ml-2 text-[10px] bg-rome-gold text-black px-1 rounded">YOU</span>}
                    </div>
                    <div className="col-span-2 text-center font-mono text-blue-400">{entry.level}</div>
                    <div className="col-span-2 text-center font-mono text-yellow-500">{entry.gold.toLocaleString()}</div>
                    <div className="col-span-2 text-center text-xs text-neutral-500 uppercase">{entry.class}</div>
                </div>
            ))}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-neutral-900 p-4 rounded border border-neutral-800">
                <div className="text-xs text-neutral-500 uppercase">Active Players</div>
                <div className="text-2xl text-green-500 font-mono">1,204</div>
            </div>
            <div className="bg-neutral-900 p-4 rounded border border-neutral-800">
                <div className="text-xs text-neutral-500 uppercase">Total Gold Looted</div>
                <div className="text-2xl text-yellow-500 font-mono">84.2M</div>
            </div>
            <div className="bg-neutral-900 p-4 rounded border border-neutral-800">
                <div className="text-xs text-neutral-500 uppercase">Season Ends In</div>
                <div className="text-2xl text-red-400 font-mono">14 Days</div>
            </div>
        </div>
    </div>
  );
};

export default Leaderboard;