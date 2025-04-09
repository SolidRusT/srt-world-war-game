import React, { useState, useEffect } from 'react';
import GameBoard from './ui/GameBoard';
import GameDashboard from './ui/GameDashboard';
import TechTree from './ui/TechTree';
import CardSystem from './ui/CardSystem';
import SaveLoadMenu from './ui/SaveLoadMenu';
import GameEngine from './core/game-engine';
import { GameState } from './core/models.js';
import { AIPlayerFactory } from './core/ai-player';
import createSampleCards from './core/sample-cards';
import SaveLoadSystem from './core/save-load-system';
import './App.css';

const App = () => {
  const [gameEngine, setGameEngine] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [aiPlayers, setAiPlayers] = useState({});
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [activeView, setActiveView] = useState('game'); // 'game', 'tech', 'cards', 'settings'
  const [showSaveLoadMenu, setShowSaveLoadMenu] = useState(false);
  const [gameConfig, setGameConfig] = useState({
    mapId: 'classic',
    playerCount: 4,
    aiPlayers: 3,
    enableTechnologies: true,
    enableResources: true,
    enableEvents: true,
    enableAlliances: true,
    victoryConditions: ['military', 'economic', 'technological', 'diplomatic']
  });
  
  // Initialize game on component mount
  useEffect(() => {
    // Check for autosave
    if (SaveLoadSystem.saveExists('autosave')) {
      const loadFromAutoSave = window.confirm('An autosave was found. Do you want to load it?');
      if (loadFromAutoSave) {
        loadGame('autosave');
        return;
      }
    }
    
    initializeGame();
  }, []);
  
  // Create autosave periodically
  useEffect(() => {
    if (!gameState || gameState.gameOver) return;
    
    const autosaveInterval = setInterval(() => {
      SaveLoadSystem.createAutoSave(gameState);
    }, 60000); // Autosave every minute
    
    return () => clearInterval(autosaveInterval);
  }, [gameState]);
  
  // Initialize a new game
  const initializeGame = () => {
    // Create game engine
    const engine = new GameEngine(gameConfig);
    
    // Initialize game state
    const state = engine.initializeGame();
    
    // Set human player ID
    const humanPlayerId = state.players[0].id;
    
    // Add some sample cards for testing
    const territoryIds = state.territories.map(t => t.id);
    const sampleCards = createSampleCards(territoryIds);
    state.players[0].cards = sampleCards.slice(0, 5); // Give the human player 5 cards
    
    // Create AI players
    const aiTypes = ['aggressive', 'defensive', 'expansionist', 'balanced'];
    const ais = {};
    
    for (let i = 1; i < state.players.length; i++) {
      const playerId = state.players[i].id;
      const aiType = aiTypes[i % aiTypes.length];
      ais[playerId] = AIPlayerFactory.createAI(playerId, aiType, 'medium');
    }
    
    setGameEngine(engine);
    setGameState(state);
    setCurrentPlayerId(humanPlayerId);
    setAiPlayers(ais);
  };
  
  // Handle AI turns
  useEffect(() => {
    if (!gameState || !gameEngine || gameState.gameOver) return;
    
    const currentPlayer = gameState.getCurrentPlayer();
    
    // If current player is AI, process AI turn
    if (currentPlayer && currentPlayer.id !== currentPlayerId && !currentPlayer.eliminated) {
      const ai = aiPlayers[currentPlayer.id];
      
      if (ai) {
        // Small delay to make AI turns visible
        const aiTurnTimeout = setTimeout(() => {
          // Perform AI turn
          const actions = ai.performTurn(gameState);
          console.log(`AI Player ${currentPlayer.name} actions:`, actions);
          
          // Update game state (in a real implementation, this would happen through the game engine)
          setGameState({ ...gameState });
        }, 1000);
        
        return () => clearTimeout(aiTurnTimeout);
      }
    }
  }, [gameState, gameEngine, currentPlayerId, aiPlayers]);
  
  // Check for game over
  useEffect(() => {
    if (gameState && gameState.gameOver && gameState.winner) {
      alert(`Game Over! ${gameState.winner.name} has won the game!`);
    }
  }, [gameState]);
  
  // Handler for territory selection
  const handleTerritoryClick = (territoryId) => {
    setSelectedTerritory(territoryId);
    
    // Get territory details
    const territory = gameState.territories.find(t => t.id === territoryId);
    console.log('Selected territory:', territory);
  };
  
  // Handler for ending the current phase
  const handleEndPhase = () => {
    if (!gameState || gameState.gameOver) return;
    
    // Check if it's the human player's turn
    if (gameState.getCurrentPlayer().id !== currentPlayerId) return;
    
    // Move to the next phase
    gameState.nextPhase();
    setGameState({ ...gameState });
  };
  
  // Handler for placing armies during reinforcement
  const handlePlaceArmies = (territoryId, armyCount) => {
    if (!gameState || gameState.gameOver) return;
    
    // Check if it's the human player's turn and the reinforcement phase
    if (gameState.getCurrentPlayer().id !== currentPlayerId || 
        gameState.phase !== 'reinforcement') return;
    
    // Create reinforcement map
    const reinforcements = {
      [territoryId]: armyCount
    };
    
    // Process reinforcement
    gameEngine.processReinforcement(currentPlayerId, reinforcements);
    setGameState({ ...gameState });
  };
  
  // Handler for attacking during attack phase
  const handleAttack = (fromTerritoryId, toTerritoryId, attackDice) => {
    if (!gameState || gameState.gameOver) return;
    
    // Check if it's the human player's turn and the attack phase
    if (gameState.getCurrentPlayer().id !== currentPlayerId || 
        gameState.phase !== 'attack') return;
    
    // Process attack
    const result = gameState.combatSystem.resolveAttack(
      fromTerritoryId,
      toTerritoryId,
      { attackDice }
    );
    
    console.log('Attack result:', result);
    setGameState({ ...gameState });
    
    // Show attack result
    if (result.success) {
      let message = `Attack result: ${result.attackerLosses} attacker(s) lost, ${result.defenderLosses} defender(s) lost.`;
      
      if (result.territoryConquered) {
        message += ` You conquered ${result.defendingTerritory}!`;
      }
      
      alert(message);
    }
  };
  
  // Handler for fortifying during fortification phase
  const handleFortify = (fromTerritoryId, toTerritoryId, armyCount) => {
    if (!gameState || gameState.gameOver) return;
    
    // Check if it's the human player's turn and the fortification phase
    if (gameState.getCurrentPlayer().id !== currentPlayerId || 
        gameState.phase !== 'fortification') return;
    
    // Process fortification
    gameEngine.processFortification(
      currentPlayerId,
      fromTerritoryId,
      toTerritoryId,
      armyCount
    );
    
    setGameState({ ...gameState });
  };
  
  // Handler for starting tech research
  const handleResearchTech = (techId) => {
    if (!gameState || !gameState.techManager || gameState.gameOver) return;
    
    // Start research
    const result = gameState.techManager.startResearch(currentPlayerId, techId);
    
    if (result) {
      console.log(`Started researching ${techId}`);
      setGameState({ ...gameState });
    } else {
      alert('Cannot research this technology at this time.');
    }
  };
  
  // Handler for trading in cards
  const handleTradeCards = (cardIds) => {
    if (!gameState || gameState.gameOver) return;
    
    // Check if it's the reinforcement phase
    if (gameState.phase !== 'reinforcement') {
      alert('Cards can only be traded during the Reinforcement phase.');
      return;
    }
    
    // Process card trade
    const result = gameState.processCardTrade(currentPlayerId, cardIds);
    
    if (result.success) {
      // Show success message
      let message = `Traded in cards for ${result.armies} armies!`;
      
      if (result.territoryBonuses && result.territoryBonuses.length > 0) {
        message += ` Including bonus armies for: ${result.territoryBonuses.join(', ')}`;
      }
      
      alert(message);
      setGameState({ ...gameState });
    } else {
      // Show error message
      alert(result.error || 'Failed to trade cards. Please try again.');
    }
  };
  
  // Handler for saving the game
  const handleSaveGame = (saveName) => {
    if (!gameState) return false;
    
    const success = SaveLoadSystem.saveGame(gameState, saveName);
    
    if (success) {
      alert(`Game saved as "${saveName}"!`);
      return true;
    } else {
      alert('Failed to save game. Please try again.');
      return false;
    }
  };
  
  // Handler for loading a game
  const handleLoadGame = (saveName) => {
    return loadGame(saveName);
  };
  
  // Load a game from a save
  const loadGame = (saveName) => {
    const serializedState = SaveLoadSystem.loadGame(saveName);
    
    if (!serializedState) {
      alert('Failed to load game. Save file may be corrupted or missing.');
      return false;
    }
    
    try {
      // Recreate game state from serialized data
      const loadedState = GameState.deserialize(serializedState);
      
      // Recreate game engine
      const engine = new GameEngine(loadedState.config);
      engine.gameState = loadedState;
      
      // Set the human player ID
      const humanPlayerId = loadedState.players.find(p => !p.id.startsWith('ai')).id;
      
      // Create AI players
      const aiTypes = ['aggressive', 'defensive', 'expansionist', 'balanced'];
      const ais = {};
      
      for (const player of loadedState.players) {
        if (player.id !== humanPlayerId) {
          const aiIndex = parseInt(player.id.replace('ai', '')) - 1;
          const aiType = aiTypes[aiIndex % aiTypes.length];
          ais[player.id] = AIPlayerFactory.createAI(player.id, aiType, 'medium');
        }
      }
      
      // Update state
      setGameEngine(engine);
      setGameState(loadedState);
      setCurrentPlayerId(humanPlayerId);
      setAiPlayers(ais);
      setActiveView('game');
      
      alert(`Game "${saveName}" loaded successfully!`);
      setShowSaveLoadMenu(false);
      return true;
    } catch (error) {
      console.error('Error loading game:', error);
      alert(`Error loading game: ${error.message}`);
      return false;
    }
  };
  
  // Render loading state
  if (!gameState || !gameEngine) {
    return <div className="loading">Initializing game...</div>;
  }
  
  // Get the human player
  const humanPlayer = gameState.players.find(p => p.id === currentPlayerId);
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>RISK-Inspired Strategy Game</h1>
        
        <nav className="main-nav">
          <button 
            className={`nav-button ${activeView === 'game' ? 'active' : ''}`}
            onClick={() => setActiveView('game')}
          >
            Game Board
          </button>
          
          {gameState?.config?.enableTechnologies && (
            <button 
              className={`nav-button ${activeView === 'tech' ? 'active' : ''}`}
              onClick={() => setActiveView('tech')}
            >
              Technology
            </button>
          )}
          
          <button 
            className={`nav-button ${activeView === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveView('cards')}
          >
            Cards ({humanPlayer.cards.length})
          </button>
          
          <button 
            className={`nav-button ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveView('settings')}
          >
            Settings
          </button>
          
          <button className="save-load-button" onClick={() => setShowSaveLoadMenu(true)}>
            Save/Load
          </button>
          
          <button className="new-game-button" onClick={initializeGame}>
            New Game
          </button>
        </nav>
      </header>
      
      <main className="app-content">
        {activeView === 'game' && (
          <div className="game-view">
            <GameBoard 
              gameState={gameState}
              onTerritoryClick={handleTerritoryClick}
            />
            
            <GameDashboard 
              gameState={gameState}
              currentPlayerId={currentPlayerId}
              onEndPhase={handleEndPhase}
              onPlaceArmies={handlePlaceArmies}
              onAttack={handleAttack}
              onFortify={handleFortify}
            />
          </div>
        )}
        
        {activeView === 'tech' && gameState?.config?.enableTechnologies && (
          <TechTree 
            gameState={gameState}
            playerId={currentPlayerId}
            onResearchTech={handleResearchTech}
          />
        )}
        
        {activeView === 'cards' && (
          <CardSystem
            gameState={gameState}
            playerId={currentPlayerId}
            onTradeCards={handleTradeCards}
          />
        )}
        
        {activeView === 'settings' && (
          <div className="settings-view">
            <h2>Game Settings</h2>
            <p>Settings functionality coming soon!</p>
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <p>RISK-Inspired Strategy Game &copy; 2025</p>
      </footer>
      
      {/* Save/Load Modal */}
      {showSaveLoadMenu && (
        <>
          <div className="modal-backdrop" onClick={() => setShowSaveLoadMenu(false)}></div>
          <SaveLoadMenu 
            onSave={handleSaveGame}
            onLoad={handleLoadGame}
            onClose={() => setShowSaveLoadMenu(false)}
          />
        </>
      )}
    </div>
  );
};

export default App;
