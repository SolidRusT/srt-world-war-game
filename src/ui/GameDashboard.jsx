import React, { useState } from 'react';
import './GameDashboard.css';

/**
 * GameDashboard component for displaying game status and player actions
 */
const GameDashboard = ({ 
  gameState, 
  currentPlayerId, 
  onEndPhase, 
  onPlaceArmies, 
  onAttack, 
  onFortify 
}) => {
  const [selectedAction, setSelectedAction] = useState(null);
  const [reinforcementCount, setReinforcementCount] = useState(0);
  const [selectedSourceTerritory, setSelectedSourceTerritory] = useState(null);
  const [selectedTargetTerritory, setSelectedTargetTerritory] = useState(null);
  const [armyCount, setArmyCount] = useState(1);
  
  if (!gameState) return <div>Loading game state...</div>;
  
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  if (!currentPlayer) return <div>Player not found</div>;
  
  // Get the current player (safely handling both function and property access)
  const getCurrentPlayer = () => {
    if (typeof gameState.getCurrentPlayer === 'function') {
      return gameState.getCurrentPlayer();
    } else if (gameState.currentPlayerIndex !== undefined) {
      return gameState.players[gameState.currentPlayerIndex];
    }
    return null;
  };
  
  const currentTurnPlayer = getCurrentPlayer();
  const isCurrentPlayerTurn = currentTurnPlayer && currentTurnPlayer.id === currentPlayerId;
  
  // Calculate reinforcements
  const calculateReinforcements = () => {
    if (!isCurrentPlayerTurn || gameState.phase !== 'reinforcement') return 0;
    
    // Base reinforcement from territories
    let count = Math.max(3, Math.floor(currentPlayer.territories.length / 3));
    
    // Add continent bonuses
    for (const continent of gameState.continents) {
      if (gameState.playerControlsContinent(currentPlayerId, continent.id)) {
        count += continent.bonusArmies;
      }
    }
    
    return count;
  };
  
  // Format phase name for display
  const formatPhase = (phase) => {
    return phase.charAt(0).toUpperCase() + phase.slice(1);
  };
  
  // Handle reinforcement placement
  const handleReinforcementSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedTargetTerritory) {
      alert('Please select a territory to reinforce');
      return;
    }
    
    if (reinforcementCount <= 0) {
      alert('Please enter a valid number of armies');
      return;
    }
    
    onPlaceArmies(selectedTargetTerritory, reinforcementCount);
    setSelectedTargetTerritory(null);
    setReinforcementCount(0);
  };
  
  // Handle attack submission
  const handleAttackSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedSourceTerritory || !selectedTargetTerritory) {
      alert('Please select source and target territories');
      return;
    }
    
    onAttack(selectedSourceTerritory, selectedTargetTerritory, armyCount);
    setSelectedSourceTerritory(null);
    setSelectedTargetTerritory(null);
    setArmyCount(1);
  };
  
  // Handle fortification submission
  const handleFortifySubmit = (e) => {
    e.preventDefault();
    
    if (!selectedSourceTerritory || !selectedTargetTerritory) {
      alert('Please select source and target territories');
      return;
    }
    
    if (armyCount <= 0) {
      alert('Please enter a valid number of armies');
      return;
    }
    
    onFortify(selectedSourceTerritory, selectedTargetTerritory, armyCount);
    setSelectedSourceTerritory(null);
    setSelectedTargetTerritory(null);
    setArmyCount(1);
  };
  
  // Render the action panel based on current phase
  const renderActionPanel = () => {
    if (!isCurrentPlayerTurn) {
      return (
        <div className="action-panel waiting">
          <h3>Waiting for other players</h3>
          <p>It's {currentTurnPlayer ? currentTurnPlayer.name : 'another player'}'s turn ({formatPhase(gameState.phase)} Phase)</p>
        </div>
      );
    }
    
    switch (gameState.phase) {
      case 'reinforcement':
        return (
          <div className="action-panel reinforcement">
            <h3>Reinforcement Phase</h3>
            <p>Available armies: {calculateReinforcements()}</p>
            
            <form onSubmit={handleReinforcementSubmit}>
              <div className="form-group">
                <label>Territory:</label>
                <select 
                  value={selectedTargetTerritory || ''} 
                  onChange={(e) => setSelectedTargetTerritory(e.target.value)}
                  required
                >
                  <option value="">Select a territory</option>
                  {currentPlayer.territories.map(territoryId => {
                    const territory = gameState.territories.find(t => t.id === territoryId);
                    return (
                      <option key={territoryId} value={territoryId}>
                        {territory.name} ({territory.getTotalArmies()} armies)
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div className="form-group">
                <label>Armies:</label>
                <input
                  type="number"
                  min="1"
                  max={calculateReinforcements()}
                  value={reinforcementCount}
                  onChange={(e) => setReinforcementCount(parseInt(e.target.value))}
                  required
                />
              </div>
              
              <div className="form-buttons">
                <button type="submit">Place Armies</button>
                <button type="button" onClick={() => onEndPhase()}>End Phase</button>
              </div>
            </form>
          </div>
        );
        
      case 'attack':
        return (
          <div className="action-panel attack">
            <h3>Attack Phase</h3>
            
            <form onSubmit={handleAttackSubmit}>
              <div className="form-group">
                <label>From Territory:</label>
                <select 
                  value={selectedSourceTerritory || ''} 
                  onChange={(e) => setSelectedSourceTerritory(e.target.value)}
                  required
                >
                  <option value="">Select source territory</option>
                  {currentPlayer.territories
                    .filter(territoryId => {
                      const territory = gameState.territories.find(t => t.id === territoryId);
                      return territory && territory.getTotalArmies() >= 2;
                    })
                    .map(territoryId => {
                      const territory = gameState.territories.find(t => t.id === territoryId);
                      return (
                        <option key={territoryId} value={territoryId}>
                          {territory.name} ({territory.getTotalArmies()} armies)
                        </option>
                      );
                    })
                  }
                </select>
              </div>
              
              <div className="form-group">
                <label>To Territory:</label>
                <select 
                  value={selectedTargetTerritory || ''} 
                  onChange={(e) => setSelectedTargetTerritory(e.target.value)}
                  required
                  disabled={!selectedSourceTerritory}
                >
                  <option value="">Select target territory</option>
                  {selectedSourceTerritory && 
                    gameState.territories
                      .filter(t => {
                        const sourceTerritory = gameState.territories.find(
                          st => st.id === selectedSourceTerritory
                        );
                        return (
                          sourceTerritory &&
                          sourceTerritory.isAdjacentTo(t.id) &&
                          t.occupyingPlayer !== currentPlayerId
                        );
                      })
                      .map(territory => (
                        <option key={territory.id} value={territory.id}>
                          {territory.name} ({territory.getTotalArmies()} armies)
                        </option>
                      ))
                  }
                </select>
              </div>
              
              <div className="form-group">
                <label>Attack with dice:</label>
                <select
                  value={armyCount}
                  onChange={(e) => setArmyCount(parseInt(e.target.value))}
                  required
                >
                  {selectedSourceTerritory && 
                    [...Array(Math.min(3, 
                      gameState.territories.find(t => t.id === selectedSourceTerritory)?.getTotalArmies() - 1 || 0
                    ))].map((_, index) => (
                      <option key={index + 1} value={index + 1}>{index + 1}</option>
                    ))
                  }
                </select>
              </div>
              
              <div className="form-buttons">
                <button type="submit">Attack</button>
                <button type="button" onClick={() => onEndPhase()}>End Phase</button>
              </div>
            </form>
          </div>
        );
        
      case 'fortification':
        return (
          <div className="action-panel fortification">
            <h3>Fortification Phase</h3>
            
            <form onSubmit={handleFortifySubmit}>
              <div className="form-group">
                <label>From Territory:</label>
                <select 
                  value={selectedSourceTerritory || ''} 
                  onChange={(e) => setSelectedSourceTerritory(e.target.value)}
                  required
                >
                  <option value="">Select source territory</option>
                  {currentPlayer.territories
                    .filter(territoryId => {
                      const territory = gameState.territories.find(t => t.id === territoryId);
                      return territory && territory.getTotalArmies() >= 2;
                    })
                    .map(territoryId => {
                      const territory = gameState.territories.find(t => t.id === territoryId);
                      return (
                        <option key={territoryId} value={territoryId}>
                          {territory.name} ({territory.getTotalArmies()} armies)
                        </option>
                      );
                    })
                  }
                </select>
              </div>
              
              <div className="form-group">
                <label>To Territory:</label>
                <select 
                  value={selectedTargetTerritory || ''} 
                  onChange={(e) => setSelectedTargetTerritory(e.target.value)}
                  required
                  disabled={!selectedSourceTerritory}
                >
                  <option value="">Select target territory</option>
                  {selectedSourceTerritory && 
                    gameState.territories
                      .filter(t => {
                        const sourceTerritory = gameState.territories.find(
                          st => st.id === selectedSourceTerritory
                        );
                        return (
                          sourceTerritory &&
                          sourceTerritory.isAdjacentTo(t.id) &&
                          t.occupyingPlayer === currentPlayerId
                        );
                      })
                      .map(territory => (
                        <option key={territory.id} value={territory.id}>
                          {territory.name} ({territory.getTotalArmies()} armies)
                        </option>
                      ))
                  }
                </select>
              </div>
              
              <div className="form-group">
                <label>Armies to move:</label>
                <input
                  type="number"
                  min="1"
                  max={selectedSourceTerritory ? 
                    gameState.territories.find(t => t.id === selectedSourceTerritory)?.getTotalArmies() - 1 : 1}
                  value={armyCount}
                  onChange={(e) => setArmyCount(parseInt(e.target.value))}
                  required
                />
              </div>
              
              <div className="form-buttons">
                <button type="submit">Move Armies</button>
                <button type="button" onClick={() => onEndPhase()}>End Phase</button>
              </div>
            </form>
          </div>
        );
        
      default:
        return <div>Unknown phase</div>;
    }
  };
  
  // Render player info panel
  const renderPlayerInfo = () => {
    return (
      <div className="player-info">
        <h3>Player Information</h3>
        <div className="player-details">
          <p>
            <strong>Name:</strong> {currentPlayer.name}
            <span 
              className="color-indicator" 
              style={{ backgroundColor: currentPlayer.color }}
            ></span>
          </p>
          <p><strong>Territories:</strong> {currentPlayer.territories.length}</p>
          <p><strong>Cards:</strong> {currentPlayer.cards.length}</p>
          
          {gameState.config.enableResources && (
            <div className="resources">
              <h4>Resources</h4>
              <ul>
                <li><span className="resource-icon">🌾</span> Food: {currentPlayer.resources.food}</li>
                <li><span className="resource-icon">⚒️</span> Production: {currentPlayer.resources.production}</li>
                <li><span className="resource-icon">🔬</span> Research: {currentPlayer.resources.research}</li>
                <li><span className="resource-icon">💰</span> Wealth: {currentPlayer.resources.wealth}</li>
              </ul>
            </div>
          )}
          
          {gameState.config.enableTechnologies && currentPlayer.technologies.length > 0 && (
            <div className="technologies">
              <h4>Technologies</h4>
              <ul>
                {currentPlayer.technologies.map(techId => (
                  <li key={techId}>{techId.replace(/-/g, ' ')}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render game status panel
  const renderGameStatus = () => {
    return (
      <div className="game-status">
        <div className="status-header">
          <h3>Game Status</h3>
          <span className="turn-indicator">Turn {gameState.turn}</span>
        </div>
        
        <p className="phase-indicator">
          Current Phase: <strong>{formatPhase(gameState.phase)}</strong>
        </p>
        
        <p className="active-player">
          Active Player: <strong>{currentTurnPlayer ? currentTurnPlayer.name : 'Unknown'}</strong>
          {currentTurnPlayer && (
            <span 
              className="color-indicator" 
              style={{ backgroundColor: currentTurnPlayer.color }}
            ></span>
          )}
        </p>
        
        <div className="player-list">
          <h4>Players</h4>
          <ul>
            {gameState.players.map(player => (
              <li 
                key={player.id} 
                className={player.eliminated ? 'eliminated' : ''}
                style={{ borderLeftColor: player.color }}
              >
                {player.name} - {player.territories.length} territories
                {player.eliminated && <span className="eliminated-tag">Eliminated</span>}
              </li>
            ))}
          </ul>
        </div>
        
        {gameState.config.enableEvents && gameState.activeEvents && gameState.activeEvents.length > 0 && (
          <div className="active-events">
            <h4>Active Events</h4>
            <ul>
              {gameState.activeEvents && gameState.activeEvents.map((event, index) => {
                // Calculate turns remaining
                const turnsRemaining = event.endTurn - gameState.turn;
                return (
                  <li key={`${event.id}-${index}`}>
                    <strong>{event.name}</strong>
                    <span className="event-duration">({turnsRemaining} turns remaining)</span>
                    <p>{event.message}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="game-dashboard">
      <div className="dashboard-left">
        {renderPlayerInfo()}
        {renderGameStatus()}
      </div>
      <div className="dashboard-right">
        {renderActionPanel()}
      </div>
    </div>
  );
};

export default GameDashboard;
