import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

const Auth = () => {
  const { login } = useGame();
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length > 0) {
      login(username);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black bg-cover bg-center relative overflow-hidden"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(https://picsum.photos/id/1006/1920/1080)` }}>
      
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

      <div className="z-10 p-8 md:p-12 bg-neutral-900/90 border-2 border-rome-gold rounded-lg shadow-[0_0_50px_rgba(217,119,6,0.3)] text-center max-w-md w-full transform transition-all hover:scale-[1.01]">
        <h1 className="text-5xl md:text-6xl font-serif text-rome-gold mb-2 drop-shadow-lg tracking-tighter">ROME</h1>
        <h2 className="text-2xl md:text-3xl font-serif text-neutral-300 mb-8 tracking-widest">ASCENDANT</h2>
        
        <p className="text-neutral-400 mb-8 font-sans">
          Enter the arena, Gladiator. Your legend begins with a name.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative group">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Gladiator Name"
              className="w-full bg-neutral-800 border border-neutral-600 text-white px-4 py-3 rounded focus:outline-none focus:border-rome-gold focus:ring-1 focus:ring-rome-gold transition-all text-center font-serif text-lg placeholder-neutral-600"
              maxLength={15}
            />
            <div className="absolute inset-0 border border-rome-gold/20 rounded pointer-events-none group-hover:border-rome-gold/50 transition-colors"></div>
          </div>
          
          <button
            type="submit"
            disabled={!username.trim()}
            className={`py-3 px-6 rounded font-serif font-bold text-lg uppercase tracking-wider transition-all duration-300
              ${username.trim() 
                ? 'bg-rome-red text-white hover:bg-red-700 shadow-[0_0_15px_rgba(153,27,27,0.6)] hover:shadow-[0_0_25px_rgba(153,27,27,0.8)] transform hover:-translate-y-0.5' 
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}`}
          >
            Enter World
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-neutral-800 text-xs text-neutral-600 font-mono">
          v1.2.0 • Server: Rome-Alpha • Latency: 12ms
        </div>
      </div>
    </div>
  );
};

export default Auth;