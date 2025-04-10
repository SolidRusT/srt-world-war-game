import React, { useState, useEffect } from 'react';
import './ConquestModal.css';

/**
 * Modal component for handling army movements after territory conquest
 */
const ConquestModal = ({ pendingConquest, gameState, onComplete, onClose }) => {
  const [armyCount, setArmyCount] = useState(pendingConquest?.minArmies || 1);
  
  // Set initial army count to minimum required
  useEffect(() => {
    if (pendingConquest) {
      setArmyCount(pendingConquest.minArmies);
    }
  }, [pendingConquest]);
  
  if (!pendingConquest) return null;
  
  // Get territory names from IDs
  const fromTerritory = gameState.territories.find(t => t.id === pendingConquest.fromTerritoryId);
  const toTerritory = gameState.territories.find(t => t.id === pendingConquest.toTerritoryId);
  
  if (!fromTerritory || !toTerritory) {
    console.error('Territory not found:', {
      fromId: pendingConquest.fromTerritoryId,
      toId: pendingConquest.toTerritoryId
    });
    return null;
  }
  
  // Helper function to calculate total armies in a territory
  const calculateTotalArmies = (territory) => {
    return territory.armies.infantry + 
           (territory.armies.cavalry || 0) * 3 + 
           (territory.armies.artillery || 0) * 5;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(armyCount);
  };
  
  return (
    <>
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="conquest-modal">
        <div className="conquest-modal-content">
          <h2>Territory Conquered!</h2>
          <p>You have conquered {toTerritory.name} from {fromTerritory.name}.</p>
          <p>How many armies would you like to move?</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="army-count">Armies:</label>
              <input
                id="army-count"
                type="number"
                min={pendingConquest.minArmies}
                max={pendingConquest.maxArmies}
                value={armyCount}
                onChange={(e) => setArmyCount(parseInt(e.target.value))}
                required
              />
              <span className="army-range">
                (Min: {pendingConquest.minArmies}, Max: {pendingConquest.maxArmies})
              </span>
            </div>
            
            <div className="conquest-info">
              <div>
                <strong>{fromTerritory.name}</strong> will have {
                  calculateTotalArmies(fromTerritory) - armyCount
                } armies remaining
              </div>
              <div>
                <strong>{toTerritory.name}</strong> will have {armyCount} armies
              </div>
            </div>
            
            <div className="form-buttons">
              <button type="submit">Move Armies</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ConquestModal;