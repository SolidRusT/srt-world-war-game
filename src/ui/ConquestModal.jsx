import React, { useState, useEffect } from 'react';
import './ConquestModal.css';

/**
 * Modal component for handling army movements after territory conquest
 */
const ConquestModal = ({ pendingConquest, gameState, onComplete, onClose }) => {
  const [armyCount, setArmyCount] = useState(pendingConquest?.minArmies || 1);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [unitDistribution, setUnitDistribution] = useState({
    infantry: pendingConquest?.minArmies || 1,
    cavalry: 0,
    artillery: 0
  });
  
  // Set initial army count to minimum required
  useEffect(() => {
    if (pendingConquest) {
      setArmyCount(pendingConquest.minArmies);
      setUnitDistribution({
        infantry: pendingConquest.minArmies,
        cavalry: 0,
        artillery: 0
      });
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
  
  // Calculate total army value from unit distribution
  const calculateDistributionValue = (distribution) => {
    return distribution.infantry + 
           (distribution.cavalry * 3) + 
           (distribution.artillery * 5);
  };
  
  // Handle changes to unit distribution
  const handleUnitChange = (unitType, value) => {
    // Make sure value is a number
    value = parseInt(value, 10) || 0;
    
    // Ensure value is not negative
    value = Math.max(0, value);
    
    // Ensure value doesn't exceed available units
    value = Math.min(value, fromTerritory.armies[unitType]);
    
    // Update the distribution
    const newDistribution = { ...unitDistribution, [unitType]: value };
    
    // Calculate the total army value and update the armyCount
    const newTotal = calculateDistributionValue(newDistribution);
    
    // Check if new total is within allowed range
    if (newTotal >= pendingConquest.minArmies && newTotal <= pendingConquest.maxArmies) {
      setUnitDistribution(newDistribution);
      setArmyCount(newTotal);
    }
  };
  
  // Update unit distribution when armyCount changes (simple mode only)
  const handleArmyCountChange = (e) => {
    const newCount = parseInt(e.target.value, 10);
    if (!showAdvancedOptions) {
      // In simple mode, just modify infantry count
      setUnitDistribution({
        ...unitDistribution,
        infantry: newCount
      });
    }
    setArmyCount(newCount);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (showAdvancedOptions) {
      // Pass both armyCount and unitDistribution
      onComplete(armyCount, unitDistribution);
    } else {
      // Just pass armyCount for backward compatibility
      onComplete(armyCount);
    }
  };
  
  // Validate that distribution equals armyCount
  const distributionIsValid = calculateDistributionValue(unitDistribution) === armyCount;
  
  return (
    <>
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="conquest-modal">
        <div className="conquest-modal-content">
          <h2>Territory Conquered!</h2>
          <p>You have conquered {toTerritory.name} from {fromTerritory.name}.</p>
          <p>How many armies would you like to move?</p>
          
          <form onSubmit={handleSubmit}>
            <div className="options-toggle">
              <button 
                type="button" 
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="toggle-button"
              >
                {showAdvancedOptions ? "Simple Mode" : "Advanced Mode"}
              </button>
            </div>
            
            {!showAdvancedOptions ? (
              <div className="form-group">
                <label htmlFor="army-count">Armies:</label>
                <input
                  id="army-count"
                  type="number"
                  min={pendingConquest.minArmies}
                  max={pendingConquest.maxArmies}
                  value={armyCount}
                  onChange={handleArmyCountChange}
                  required
                />
                <span className="army-range">
                  (Min: {pendingConquest.minArmies}, Max: {pendingConquest.maxArmies})
                </span>
              </div>
            ) : (
              <div className="advanced-options">
                <h4>Select Units to Move:</h4>
                
                <div className="unit-selector">
                  <label htmlFor="infantry-count">Infantry:</label>
                  <input
                    id="infantry-count"
                    type="number"
                    min="0"
                    max={fromTerritory.armies.infantry}
                    value={unitDistribution.infantry}
                    onChange={(e) => handleUnitChange('infantry', e.target.value)}
                  />
                  <span className="available">
                    (Available: {fromTerritory.armies.infantry})
                  </span>
                </div>
                
                <div className="unit-selector">
                  <label htmlFor="cavalry-count">Cavalry (x3):</label>
                  <input
                    id="cavalry-count"
                    type="number"
                    min="0"
                    max={fromTerritory.armies.cavalry}
                    value={unitDistribution.cavalry}
                    onChange={(e) => handleUnitChange('cavalry', e.target.value)}
                  />
                  <span className="available">
                    (Available: {fromTerritory.armies.cavalry})
                  </span>
                </div>
                
                <div className="unit-selector">
                  <label htmlFor="artillery-count">Artillery (x5):</label>
                  <input
                    id="artillery-count"
                    type="number"
                    min="0"
                    max={fromTerritory.armies.artillery}
                    value={unitDistribution.artillery}
                    onChange={(e) => handleUnitChange('artillery', e.target.value)}
                  />
                  <span className="available">
                    (Available: {fromTerritory.armies.artillery})
                  </span>
                </div>
                
                <div className="total-value">
                  Total Army Value: {calculateDistributionValue(unitDistribution)}
                  {!distributionIsValid && (
                    <span className="error">Total must equal {armyCount}</span>
                  )}
                </div>
              </div>
            )}
            
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
              <button 
                type="submit" 
                disabled={showAdvancedOptions && !distributionIsValid}
              >
                Move Armies
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ConquestModal;