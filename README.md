# RISK-Inspired Strategy Game

A modern turn-based strategy game inspired by the classic world conquest board game RISK®, built with modern web technologies.

## Project Overview

This game reimagines the classic world conquest strategy game with new mechanics and features while maintaining the core appeal of territory control, army management, and tactical decision-making.

## Features

- Global map with territories and continents
- Turn-based gameplay with multiple phases (reinforcement, attack, fortification)
- Multiple unit types with different strengths
- Resource management system
- Technology research tree with different specialization paths
- Dynamic events that affect gameplay
- Multiple paths to victory
- Alliance system for diplomacy
- AI opponents with different strategies and difficulty levels

## Core Game Mechanics

- **Territory Control**: Conquer and hold territories across the global map
- **Army Management**: Build and deploy armies of different types
- **Resource System**: Gather food, production, research, and wealth
- **Technology Tree**: Research technologies for special abilities and bonuses
- **Combat System**: Strategic dice-based combat with bonuses from technologies and unit types
- **Multiple Victory Paths**: Win through military dominance, economic power, technological superiority, or diplomatic alliances

## Project Structure

```
risk-inspired-game/
├── docs/                  # Documentation
│   ├── game_rules.md      # Game rules and mechanics
│   └── design_notes.md    # Design decisions and rationale
├── src/                   # Source code
│   ├── core/              # Core game logic
│   │   ├── models.js      # Data models
│   │   ├── game-engine.js # Game initialization and management
│   │   ├── game-state.js  # Game state management
│   │   ├── combat-system.js # Combat resolution
│   │   ├── resource-manager.js # Resource management
│   │   ├── tech-manager.js # Technology research system
│   │   └── ai-player.js   # AI opponent logic
│   ├── ui/                # User interface
│   │   ├── GameBoard.jsx  # Game board visualization
│   │   ├── GameDashboard.jsx # Game controls and status
│   │   └── TechTree.jsx   # Technology tree visualization
│   ├── assets/            # Game assets
│   │   ├── maps/          # Map definitions
│   │   │   └── classic-map.js # Classic world map
│   │   └── tech-tree.js   # Technology tree definition
│   ├── App.jsx            # Main application component
│   └── App.css            # Application styles
├── tests/                 # Test cases
└── CUSTOM_INSTRUCTIONS.md # Development guidelines
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://your-repository-url/risk-inspired-game.git
   cd risk-inspired-game
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. The application will open automatically in your default browser at `http://localhost:3000`

### Build for Production

To create a production build:

```
npm run build
```

This will create a `dist` directory with the production-ready files.

To preview the production build locally:

```
npm run preview
```

## Game Controls

- **Territory Selection**: Click on a territory to select it
- **Reinforcement Phase**: Choose a territory and the number of armies to place
- **Attack Phase**: Select your territory, then an adjacent enemy territory to attack
- **Fortification Phase**: Move armies from one of your territories to an adjacent one
- **Technology Research**: Navigate to the Technology tab to research new technologies

## Development Roadmap

- [x] Basic game board and visualization
- [x] Core game mechanics (turns, phases, combat)
- [x] Territory management
- [x] Enhanced game features (resources, technology, events)
- [x] AI opponents
- [x] Card system implementation
- [x] Save/load game functionality
- [ ] Multiplayer support
- [ ] Custom map editor
- [ ] Mobile responsive design

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This game is inspired by Hasbro's RISK® board game
- RISK® is a registered trademark of Hasbro, Inc.
