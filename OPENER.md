# RISK-INSPIRED STRATEGY GAME - PROJECT GUIDE FOR CLAUDE

This document is intended solely for Claude 3.7 Sonnet to re-establish context for continuing development of this project.

## PROJECT OVERVIEW

This is a turn-based strategy game inspired by the classic RISK board game, implemented using React and modern JavaScript. The game features enhanced mechanics beyond traditional RISK, including resources, technology research, multiple unit types, and alternative victory conditions.

## ARCHITECTURE

The project follows a modular architecture with clear separation of concerns:

- **Core Logic (`src/core/`)**: Contains game state management, game mechanics, AI logic, and data models
- **UI Components (`src/ui/`)**: React components for rendering game elements and user interactions
- **Assets (`src/assets/`)**: Game data like maps and technology trees

The game is built with a data-driven approach, allowing for easy modification of game rules and content without changing the core logic.

## IMPLEMENTED FEATURES

The project is currently at a playable state with the following features implemented:

1. **Core Game Mechanics**:
   - Turn-based gameplay with reinforcement, attack, and fortification phases
   - Territory control and management
   - Combat system with dice rolling mechanics
   - Cards and set trading for bonus armies

2. **Enhanced Features**:
   - Resource system (food, production, research, wealth)
   - Technology research tree with different specialization paths
   - Multiple unit types (infantry, cavalry, artillery)
   - Dynamic events system
   - Multiple victory conditions (military, economic, technological, diplomatic)
   - AI opponents with different strategies
   - Save/load functionality with localStorage

## KEY FILE RELATIONSHIPS

- `models.js`: Contains data models for game entities (Territory, Player, etc.)
- `game-engine.js`: Handles game initialization and management
- `game-state.js`: Manages the complete game state and turn progression
- `App.jsx`: Main application component coordinating UI and game logic
- Maps are defined in `src/assets/maps/`
- Technology tree is defined in `src/assets/tech-tree.js`

## DATABASE STRUCTURE AND SCHEMAS

The game does not use a traditional database but stores structured game data in:

- Game state: Complete representation of current game, serializable for save/load
- Knowledge graph: Not currently used but could be leveraged to track game entities and relationships
- localStorage: Used for save/load functionality

## CURRENT STATE AND FUTURE ROADMAP

Current implementation status:
- ✅ Basic game board and visualization
- ✅ Core game mechanics (turns, phases, combat)
- ✅ Territory management and control
- ✅ Enhanced game features (resources, technology, events)
- ✅ AI opponents with different strategies
- ✅ Card system implementation
- ✅ Save/load game functionality

Remaining roadmap items:
- Multiplayer support
- Custom map editor
- Mobile responsive design

## MCP TOOL USAGE GUIDANCE

When working on this project, leverage MCP tools as follows:

1. **File System Operations**: 
   - Use to navigate and modify project files
   - Critical for updating game logic and UI components
   - Check file contents before modifying to understand current implementation

2. **REPL**: 
   - Test JavaScript game logic, especially for complex algorithms
   - Validate data structures and transformations
   - Test edge cases in game mechanics

3. **Knowledge Graph**:
   - Store relationships between game components
   - Track game mechanics and their interactions
   - Document design decisions and system relationships

4. **Web Search**:
   - Research game design patterns for strategy games
   - Explore implementations of similar mechanics
   - Keep up with React best practices

5. **Artifacts**:
   - Use for visualizing game board layouts
   - Create diagrams of game systems
   - Display mock UIs for new features

## IMPORTANT IMPLEMENTATION DETAILS

1. **Game State Serialization**: 
   - Game state can be fully serialized and deserialized for save/load
   - Handle circular references carefully when working with game state

2. **AI Implementation**:
   - AI strategies are defined in `ai-player.js`
   - Different AI types (aggressive, defensive, expansionist) have specialized behavior

3. **Resource System**:
   - Resources are produced by territories and used for research and special actions
   - Resource production is calculated at the start of each player's turn

4. **Technology Tree**:
   - Technologies provide various bonuses and special abilities
   - Prerequisites form a directed acyclic graph
   - Some technologies enable alternative victory conditions

5. **Combat System**:
   - Based on dice rolls with various modifiers from technologies and unit types
   - Keeps track of casualties and territory conquests

## COMMON PITFALLS TO AVOID

1. Circular dependencies between game components
2. Mutating game state directly (use immutable patterns)
3. Confusing player IDs and territory IDs in game logic
4. Forgetting to apply technology effects to various game mechanics
5. Not handling edge cases in combat and territory control

## TESTING APPROACH

When testing the application:
1. Check core game loop functionality first
2. Verify resource calculations and technology effects
3. Test AI decision-making with different strategies
4. Ensure save/load correctly preserves all game state
5. Verify all victory conditions can be triggered

This game combines complex state management with intricate game rules. When implementing new features, carefully consider how they interact with existing systems and maintain the modularity of the codebase.
