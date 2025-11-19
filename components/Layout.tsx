import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Location } from '../types';
import { calculateDerivedStats } from '../services/gameEngine';

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { player, setLocation, currentLocation, logout, chatMessages, sendChatMessage, notifications, removeNotification } = useGame();
  const derived = calculateDerivedStats(player);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (isChatOpen && chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [chatMessages, isChatOpen]);

  const handleChatSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (chatInput.trim()) {
          sendChatMessage(chatInput);
          setChatInput('');
      }
  };

  const NavButton = ({ loc, label, icon }: { loc: Location, label: string, icon: string }) => (
    <button
      onClick={() => setLocation(loc)}
      className={`flex items-center space-x-2 px-4 py-3 rounded transition-all duration-200 w-full md:w-auto whitespace-nowrap
        ${currentLocation === loc 
          ? 'bg-rome-gold text-rome-dark font-bold shadow-lg scale-105' 
          : 'bg-rome-stone/30 hover:bg-rome-stone/50 text-rome-light'}`}
    >
      <span>{icon}</span>
      <span className="font-serif tracking-wider">{label}</span>
    </button>
  );

  const getBackground = (loc: Location) => {
      switch(loc) {
          case Location.Home: return 'https://picsum.photos/id/1054/1920/1080'; 
          case Location.Expedition: return 'https://picsum.photos/id/1039/1920/1080'; 
          case Location.Arena: return 'https://picsum.photos/id/1028/1920/1080'; 
          case Location.Town: return 'https://picsum.photos/id/1076/1920/1080'; 
          case Location.Inventory: return 'https://picsum.photos/id/1048/1920/1080'; 
          case Location.Leaderboard: return 'https://picsum.photos/id/1015/1920/1080'; 
          default: return 'https://picsum.photos/id/1054/1920/1080';
      }
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col md:flex-row text-sm md:text-base overflow-hidden">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
          {notifications.map(n => (
              <div 
                key={n.id} 
                className={`px-6 py-3 rounded shadow-2xl border flex items-center gap-3 animate-slide-in pointer-events-auto cursor-pointer
                ${n.type === 'achievement' ? 'bg-yellow-900/90 border-yellow-500 text-yellow-100' :
                  n.type === 'loot' ? 'bg-blue-900/90 border-blue-500 text-blue-100' :
                  'bg-neutral-800/90 border-neutral-600 text-white'}`}
                onClick={() => removeNotification(n.id)}
              >
                  <span className="text-2xl">
                      {n.type === 'achievement' ? '🏆' : n.type === 'loot' ? '🎒' : 'ℹ️'}
                  </span>
                  <div>
                      <div className="font-bold text-xs uppercase tracking-wider opacity-70">{n.type}</div>
                      <div className="text-sm">{n.message}</div>
                  </div>
              </div>
          ))}
      </div>

      {/* Mobile Header Stats */}
      <div className="md:hidden bg-rome-dark p-2 border-b border-rome-stone flex justify-between items-center sticky top-0 z-50 shrink-0">
         <div className="flex flex-col">
             <span className="font-serif text-rome-gold font-bold">{player.name} (Lvl {player.level})</span>
             <div className="w-32 h-2 bg-neutral-800 rounded-full mt-1 border border-neutral-600 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-red-700 transition-all" style={{ width: `${(player.hp / derived.maxHp) * 100}%` }}></div>
             </div>
         </div>
         <div className="flex gap-3 text-xs items-center">
             <span className="text-yellow-400">💰 {player.gold}</span>
             <button onClick={logout} className="text-xs bg-neutral-800 p-1 px-2 rounded border border-neutral-600">Exit</button>
         </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-rome-dark/95 border-r border-rome-stone/50 flex flex-col shrink-0 md:h-screen z-20">
        <div className="p-6 text-center border-b border-rome-stone/30 hidden md:block">
          <h1 className="font-serif text-2xl text-rome-gold mb-1">ROME: ASCENDANT</h1>
          <p className="text-xs text-neutral-400">Rise, {player.name}</p>
        </div>

        <nav className="flex md:flex-col p-2 md:p-4 gap-2 overflow-x-auto md:overflow-visible scrollbar-hide">
          <NavButton loc={Location.Home} label="Overview" icon="🏛️" />
          <NavButton loc={Location.Expedition} label="Expedition" icon="🌲" />
          <NavButton loc={Location.Arena} label="Arena" icon="⚔️" />
          <NavButton loc={Location.Town} label="City" icon="🏺" />
          <NavButton loc={Location.Inventory} label="Gear" icon="🎒" />
          <NavButton loc={Location.Leaderboard} label="Rankings" icon="🏆" />
        </nav>

        {/* Desktop Stats Panel */}
        <div className="hidden md:block p-4 mt-auto border-t border-rome-stone/30 bg-neutral-900/50">
            <div className="mb-4">
                <div className="flex justify-between mb-1">
                    <span className="text-red-400">Health</span>
                    <span>{player.hp} / {derived.maxHp}</span>
                </div>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-700 transition-all duration-500" style={{ width: `${(player.hp / derived.maxHp) * 100}%` }}></div>
                </div>
            </div>
            <div className="mb-4">
                <div className="flex justify-between mb-1">
                    <span className="text-blue-400">XP</span>
                    <span>{Math.floor((player.xp / player.xpToNext) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-700 transition-all duration-500" style={{ width: `${(player.xp / player.xpToNext) * 100}%` }}></div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                 <div className="bg-neutral-800 p-2 rounded flex items-center justify-center gap-1 text-yellow-500 border border-yellow-900/30">
                    <span>💰</span> {player.gold}
                 </div>
                 <div className="bg-neutral-800 p-2 rounded flex items-center justify-center gap-1 text-green-500 border border-green-900/30">
                    <span>⚡</span> {player.energy}/{player.maxEnergy}
                 </div>
            </div>
            <button 
                onClick={logout} 
                className="w-full py-2 bg-neutral-800 hover:bg-red-900/30 text-neutral-400 hover:text-red-400 border border-neutral-700 rounded transition-colors text-xs uppercase tracking-widest"
            >
                Logout
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col h-screen overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
            style={{ 
                backgroundImage: `linear-gradient(rgba(28, 25, 23, 0.92), rgba(28, 25, 23, 0.95)), url(${getBackground(currentLocation)})` 
            }}
        ></div>

        {/* Scrollable Content */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8">
             <div className="max-w-5xl mx-auto pb-20">
                 {children}
             </div>
        </div>

        {/* Global Chat Floating Panel */}
        <div className={`absolute bottom-0 right-0 md:right-4 z-50 w-full md:w-80 transition-transform duration-300 ease-in-out
            ${isChatOpen ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'}`}>
            
            <div className="bg-neutral-900 border border-rome-stone rounded-t-lg shadow-2xl flex flex-col h-96">
                {/* Chat Header */}
                <button 
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="p-3 bg-neutral-800 rounded-t-lg border-b border-neutral-700 flex justify-between items-center hover:bg-neutral-750 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="font-serif text-rome-gold font-bold">Global Chat</span>
                        <span className="text-xs text-neutral-500">({chatMessages.length} msgs)</span>
                    </div>
                    <span className="text-neutral-400">{isChatOpen ? '▼' : '▲'}</span>
                </button>

                {/* Chat Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/40 backdrop-blur-sm">
                    {chatMessages.map((msg) => (
                        <div key={msg.id} className={`text-xs md:text-sm break-words animate-fade-in ${msg.isPlayer ? 'text-right' : 'text-left'}`}>
                            <span className={`font-bold ${msg.sender === 'System' ? 'text-red-400' : msg.isPlayer ? 'text-rome-gold' : 'text-blue-400'}`}>
                                {msg.sender}:
                            </span>
                            <span className="text-neutral-300 ml-2">{msg.text}</span>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleChatSubmit} className="p-2 bg-neutral-800 border-t border-neutral-700 flex gap-2">
                    <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Say something..."
                        className="flex-1 bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-rome-gold"
                        maxLength={50}
                    />
                    <button type="submit" className="px-3 py-1 bg-rome-gold text-rome-dark font-bold rounded text-xs">
                        Send
                    </button>
                </form>
            </div>
        </div>

      </main>
    </div>
  );
};

export default Layout;