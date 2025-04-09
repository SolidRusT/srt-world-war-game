import React, { useState, useEffect } from 'react';
import Card from './Card';
import './CardSystem.css';

/**
 * CardSystem component for managing cards and trading sets
 */
const CardSystem = ({ gameState, playerId, onTradeCards }) => {
  const [selectedCards, setSelectedCards] = useState([]);
  const [isValidSet, setIsValidSet] = useState(false);
  const [territoryBonus, setTerritoryBonus] = useState([]);
  const [armiesFromTrade, setArmiesFromTrade] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  
  // Get player's cards
  const player = gameState.players.find(p => p.id === playerId);
  const playerCards = player ? player.cards : [];
  
  // Calculate set number (which set is being traded in)
  useEffect(() => {
    if (gameState) {
      const cardTradeEvents = gameState.eventLog.filter(event => event.type === 'card-trade');
      setSetNumber(cardTradeEvents.length + 1);
    }
  }, [gameState]);
  
  // Calculate armies for a set
  const calculateArmiesForSet = (setNum) => {
    if (setNum <= 1) return 4;
    if (setNum === 2) return 6;
    if (setNum === 3) return 8;
    if (setNum === 4) return 10;
    if (setNum === 5) return 12;
    if (setNum === 6) return 15;
    
    // After the 6th set, each additional set is worth 5 more armies
    return 15 + (setNum - 6) * 5;
  };
  
  // Check if a set of cards is valid for trading
  const checkValidSet = (cards) => {
    if (cards.length !== 3) return false;
    
    // Count card types
    const types = cards.map(cardId => {
      const card = playerCards.find(c => c.id === cardId);
      return card ? card.type : null;
    }).filter(Boolean);
    
    const typeCounts = {};
    
    for (const type of types) {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
    
    // Check for wild cards
    const wildCount = typeCounts['wild'] || 0;
    
    // Case 1: Three of the same type
    const sameTypeCount = Math.max(...Object.values(typeCounts).filter(count => count <= 3), 0);
    if (sameTypeCount + wildCount >= 3) return true;
    
    // Case 2: One of each type (infantry, cavalry, artillery)
    const uniqueTypes = Object.keys(typeCounts).filter(type => type !== 'wild').length;
    if (uniqueTypes + wildCount >= 3) return true;
    
    return false;
  };
  
  // Calculate territory bonus
  const calculateTerritoryBonus = (cards) => {
    const bonusTerritories = [];
    
    for (const cardId of cards) {
      const card = playerCards.find(c => c.id === cardId);
      if (!card) continue;
      
      if (card.territoryId) {
        const territory = gameState.territories.find(t => t.id === card.territoryId);
        if (territory && territory.occupyingPlayer === playerId) {
          bonusTerritories.push(territory.name);
        }
      }
    }
    
    return bonusTerritories;
  };
  
  // Update set validity and bonuses when selected cards change
  useEffect(() => {
    if (selectedCards.length === 3) {
      const validSet = checkValidSet(selectedCards);
      setIsValidSet(validSet);
      
      if (validSet) {
        const territories = calculateTerritoryBonus(selectedCards);
        setTerritoryBonus(territories);
        
        // Calculate armies (base + territory bonuses)
        const baseArmies = calculateArmiesForSet(setNumber);
        const bonusArmies = territories.length * 2;
        setArmiesFromTrade(baseArmies + bonusArmies);
      } else {
        setTerritoryBonus([]);
        setArmiesFromTrade(0);
      }
    } else {
      setIsValidSet(false);
      setTerritoryBonus([]);
      setArmiesFromTrade(0);
    }
  }, [selectedCards, playerId, setNumber]);
  
  // Handle card selection
  const handleCardClick = (cardId) => {
    if (selectedCards.includes(cardId)) {
      // Deselect the card
      setSelectedCards(selectedCards.filter(id => id !== cardId));
    } else {
      // Select the card (up to 3)
      if (selectedCards.length < 3) {
        setSelectedCards([...selectedCards, cardId]);
      }
    }
  };
  
  // Handle trading cards
  const handleTradeCards = () => {
    if (!isValidSet) return;
    
    onTradeCards(selectedCards);
    setSelectedCards([]);
  };
  
  // Group cards by type for organization
  const groupCardsByType = () => {
    const groups = {
      infantry: [],
      cavalry: [],
      artillery: [],
      wild: []
    };
    
    for (const card of playerCards) {
      if (groups[card.type]) {
        groups[card.type].push(card);
      }
    }
    
    return groups;
  };
  
  // Check if the player is forced to trade in cards
  const isForcedTrade = playerCards.length >= 5;
  
  // Render the card system
  return (
    <div className="card-system">
      <div className="card-system-header">
        <h2>Territory Cards</h2>
        <div className="card-stats">
          <span className="card-count">
            {playerCards.length} Card{playerCards.length !== 1 ? 's' : ''}
          </span>
          
          {isForcedTrade && (
            <span className="forced-trade-warning">
              You must trade in a set of cards!
            </span>
          )}
        </div>
      </div>
      
      {playerCards.length === 0 ? (
        <div className="no-cards-message">
          <p>You don't have any cards yet. Conquer a territory to earn a card!</p>
        </div>
      ) : (
        <>
          <div className="card-selection-area">
            <div className="selected-cards">
              <h3>Selected Cards</h3>
              <div className="selected-cards-container">
                {selectedCards.length === 0 ? (
                  <div className="no-selected-cards">
                    Select up to 3 cards to form a set
                  </div>
                ) : (
                  <div className="selected-card-list">
                    {selectedCards.map(cardId => {
                      const card = playerCards.find(c => c.id === cardId);
                      return card ? (
                        <Card 
                          key={cardId}
                          card={card}
                          selected={true}
                          onClick={handleCardClick}
                          gameState={gameState}
                        />
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              
              {selectedCards.length > 0 && (
                <div className="trade-controls">
                  <div className="trade-info">
                    {isValidSet ? (
                      <>
                        <p className="valid-set">Valid set! Trade for {armiesFromTrade} armies.</p>
                        {territoryBonus.length > 0 && (
                          <p className="territory-bonus">
                            Includes territory bonus for: {territoryBonus.join(', ')}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="invalid-set">Not a valid set. Select 3 cards to form a set.</p>
                    )}
                  </div>
                  
                  <div className="trade-buttons">
                    <button 
                      className="clear-button"
                      onClick={() => setSelectedCards([])}
                    >
                      Clear Selection
                    </button>
                    
                    <button 
                      className="trade-button"
                      disabled={!isValidSet}
                      onClick={handleTradeCards}
                    >
                      Trade Cards
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="card-collection">
            <h3>Your Cards</h3>
            <div className="card-groups">
              {Object.entries(groupCardsByType()).map(([type, cards]) => {
                if (cards.length === 0) return null;
                
                return (
                  <div key={type} className="card-group">
                    <h4 className="group-title">{type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                    <div className="card-list">
                      {cards.map(card => (
                        <Card 
                          key={card.id}
                          card={card}
                          selected={selectedCards.includes(card.id)}
                          onClick={handleCardClick}
                          gameState={gameState}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="card-rules">
            <h3>Card Rules</h3>
            <div className="rules-content">
              <p>
                <strong>Earning Cards:</strong> Conquer at least one territory during your turn to earn a card.
              </p>
              <p>
                <strong>Trading Sets:</strong> Trade in sets of 3 cards for armies. Valid sets are:
              </p>
              <ul>
                <li>Three cards of the same type (Infantry, Cavalry, or Artillery)</li>
                <li>One each of Infantry, Cavalry, and Artillery</li>
                <li>Any two cards plus a Wild card</li>
              </ul>
              <p>
                <strong>Territory Bonus:</strong> If you trade in a card showing a territory you control, 
                you receive an additional 2 armies placed on that territory.
              </p>
              <p>
                <strong>Forced Trade:</strong> If you have 5 or more cards at the start of your turn, 
                you must trade in at least one set.
              </p>
              <p>
                <strong>Set Values:</strong> The armies awarded for each set increase with each set traded in:
              </p>
              <ul className="set-values">
                <li><strong>1st set:</strong> 4 armies</li>
                <li><strong>2nd set:</strong> 6 armies</li>
                <li><strong>3rd set:</strong> 8 armies</li>
                <li><strong>4th set:</strong> 10 armies</li>
                <li><strong>5th set:</strong> 12 armies</li>
                <li><strong>6th set:</strong> 15 armies</li>
                <li><strong>7th+ set:</strong> +5 armies per set</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CardSystem;
