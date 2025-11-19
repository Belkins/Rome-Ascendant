
# 🏛️ Rome: Ascendant

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-8E75B2?logo=google&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?logo=tailwind-css&logoColor=white)

> **"Rise from the sands of the arena to the heights of the Empire."**

**Rome: Ascendant** is a browser-based Idle RPG that blends classic stat-management mechanics with **Generative AI**. Powered by the Google Gemini API, the game generates dynamic lore, combat narratives, simulated player chatrooms, and mystic prophecies, ensuring no two playthroughs feel exactly the same.

---

## ⚔️ Key Features

### 🤖 AI-Powered Immersion (Gemini 2.5 Flash)
*   **Dynamic Combat Narratives:** Every battle summary is unique, describing your victory or defeat in Roman terminology.
*   **Simulated Global Chat:** The "Global Chat" isn't real players—it's an AI simulation of a bustling MMO chatroom reacting to your messages in real-time.
*   **Procedural Quests:** Quest names and enemy descriptions are generated on the fly to fit the atmosphere.
*   **The Oracle:** Visit the temple for cryptic, AI-generated prophecies based on your current status.

### 🎮 Gameplay Loop
*   **Dual Combat Modes:** 
    *   **Quick Auto:** Instant expeditions for fast resource gathering.
    *   **Manual Turn-Based:** Take direct control in a tactical UI. Manage cooldowns, block attacks, and unleash Heavy Strikes.
*   **Deep Itemization:** Loot system with rarities (**Common** to **Legendary**). Equip weapons, armor, and jewelry to boost stats like *Strength*, *Agility*, and *Charisma*.
*   **Progression:** Level up to restore health and unlock stat points. Manage Energy and Gold.
*   **Economy:** Buy and sell gear in the Market. Work stable jobs when times are tough.
*   **Arena System:** Climb the rankings by defeating rival gladiators.

### 🛠️ Technical Highlights
*   **React 19 & TypeScript:** Built for performance and type safety.
*   **Context API State Management:** centralized game logic handling combat, inventory, and player stats.
*   **Tailwind CSS:** Responsive, dark-mode themed UI using a "Cinzel" and "Lato" typography hierarchy.
*   **Local Persistence:** Auto-saves progress to LocalStorage so you never lose your gladiator.

---

## 📸 Screenshots

| **Dashboard** | **Manual Combat** |
|:---:|:---:|
| *Stats, Gear, and Achievements* | *Turn-based tactical interface* |
| ![Dashboard](https://via.placeholder.com/400x225/1c1917/d97706?text=Dashboard+Preview) | ![Combat](https://via.placeholder.com/400x225/1c1917/991b1b?text=Combat+Scene) |

| **Expedition Results** | **The Market** |
|:---:|:---:|
| *Loot drops and AI summaries* | *Buy and sell rare artifacts* |
| ![Results](https://via.placeholder.com/400x225/1c1917/22c55e?text=Victory+Screen) | ![Market](https://via.placeholder.com/400x225/1c1917/3b82f6?text=Marketplace) |

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   A Google Gemini API Key (Get one [here](https://aistudio.google.com/))

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/rome-ascendant.git
    cd rome-ascendant
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory:
    ```env
    # Your Google Gemini API Key
    API_KEY=your_actual_api_key_here
    ```

4.  **Run the App**
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` (or the port shown in your terminal) to play!

---

## 🗺️ Roadmap

*   [x] Core Loop (Battle, Loot, Level Up)
*   [x] Manual Turn-Based Combat
*   [x] Achievement System
*   [x] Save/Load System
*   [ ] **Blacksmith:** Crafting items from enemy drops.
*   [ ] **Legion System:** Recruit NPCs to fight automatically while you are offline.
*   [ ] **Visual Map:** A map interface for selecting expeditions.
*   [ ] **Boss Raids:** Multi-stage fights against mythological beasts.

---

## 🤝 Contributing

Gladiators are stronger together. If you have ideas for features or improvements:

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <p><i>Built with ❤️ and 🏛️ by [Your Name]</i></p>
</div>
