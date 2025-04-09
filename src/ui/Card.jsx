import React from 'react';
import './Card.css';

/**
 * Card component for displaying territory cards
 */
const Card = ({ card, selected, onClick, gameState }) => {
  // Get card details
  const { id, type, territoryId } = card;
  
  // Get territory information if the card is associated with a territory
  const territory = territoryId ? 
    gameState.territories.find(t => t.id === territoryId) : null;
  
  // Determine the icon based on card type
  const getCardIcon = () => {
    switch (type) {
      case 'infantry':
        return '👣';
      case 'cavalry':
        return '🐎';
      case 'artillery':
        return '💣';
      case 'wild':
        return '🃏';
      default:
        return '❓';
    }
  };
  
  // Get color based on continent (if territory exists)
  const getCardColor = () => {
    if (!territory) return '#f8f8f8';
    
    const continent = gameState.continents.find(c => c.id === territory.continent);
    if (!continent) return '#f8f8f8';
    
    return continent.color || '#f8f8f8';
  };
  
  // Check if the player controls the territory
  const isControlledByPlayer = (playerId) => {
    return territory && territory.occupyingPlayer === playerId;
  };
  
  return (
    <div 
      className={`game-card ${selected ? 'selected' : ''}`}
      onClick={() => onClick && onClick(id)}
      style={{ borderColor: getCardColor() }}
    >
      <div className="card-header" style={{ backgroundColor: getCardColor() }}>
        <span className="card-type-icon">{getCardIcon()}</span>
        <span className="card-type">{type.toUpperCase()}</span>
      </div>
      
      <div className="card-body">
        {territory ? (
          <>
            <h3 className="territory-name">{territory.name}</h3>
            <div className="territory-info">
              <span className="continent-name">
                {gameState.continents.find(c => c.id === territory.continent)?.name || 'Unknown'}
              </span>
            </div>
          </>
        ) : (
          <h3 className="wild-card">Wild Card</h3>
        )}
      </div>
      
      <div className="card-footer">
        {territory && Object.entries(territory.resources).length > 0 && (
          <div className="territory-resources">
            {Object.entries(territory.resources).map(([type, amount]) => (
              <span key={type} className="resource-icon" title={`${amount} ${type}`}>
                {type === 'food' && '🌾'}
                {type === 'production' && '⚒️'}
                {type === 'research' && '🔬'}
                {type === 'wealth' && '💰'}
                <small>{amount}</small>
              </span>
            ))}
          </div>
        )}
        
        {territory && (
          <div className="territory-status">
            {isControlledByPlayer(gameState.getCurrentPlayer().id) ? (
              <span className="controlled-territory" title="You control this territory">
                ✓
              </span>
            ) : (
              <span className="uncontrolled-territory" title="You don't control this territory">
                ✗
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
