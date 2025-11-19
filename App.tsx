import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Location } from './types';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Expedition from './components/Expedition';
import Arena from './components/Arena';
import Town from './components/Town';
import Inventory from './components/Inventory';
import Leaderboard from './components/Leaderboard';

const GameRouter = () => {
  const { currentLocation, isLoggedIn } = useGame();

  if (!isLoggedIn) {
      return <Auth />;
  }

  const renderScreen = () => {
    switch (currentLocation) {
      case Location.Home: return <Dashboard />;
      case Location.Expedition: return <Expedition />;
      case Location.Arena: return <Arena />;
      case Location.Town: return <Town />;
      case Location.Inventory: return <Inventory />;
      case Location.Leaderboard: return <Leaderboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderScreen()}
    </Layout>
  );
};

function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}

export default App;