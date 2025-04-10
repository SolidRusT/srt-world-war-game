import React from 'react';
import './EventNotification.css';

/**
 * Component to display event notifications as modal popups
 */
const EventNotification = ({ event, onClose }) => {
  if (!event) return null;
  
  const renderEventEffects = () => {
    switch (event.effectType) {
      case 'resource':
        return (
          <div className="effect-details">
            <h4>Resource Effects:</h4>
            <ul>
              {Object.entries(event.resourceEffect).map(([resource, value]) => (
                <li key={resource} className={value > 0 ? 'positive' : 'negative'}>
                  {resource.charAt(0).toUpperCase() + resource.slice(1)}: {value > 0 ? '+' : ''}{value}
                </li>
              ))}
            </ul>
          </div>
        );
        
      case 'armies':
        return (
          <div className="effect-details">
            <h4>Army Effects:</h4>
            <ul>
              <li className={event.armyEffect > 0 ? 'positive' : 'negative'}>
                {event.armyEffect > 0 ? 'Gain' : 'Lose'} {Math.abs(event.armyEffect)} {Math.abs(event.armyEffect) === 1 ? 'army' : 'armies'}
                {event.affectedTerritories && event.affectedTerritories.length === 1 && (
                  <span> in selected territory</span>
                )}
              </li>
            </ul>
          </div>
        );
        
      case 'combat':
        return (
          <div className="effect-details">
            <h4>Combat Effects:</h4>
            <ul>
              {event.combatEffect.attackModifier && (
                <li className={event.combatEffect.attackModifier > 0 ? 'positive' : 'negative'}>
                  Attack rolls: {event.combatEffect.attackModifier > 0 ? '+' : ''}{event.combatEffect.attackModifier}
                </li>
              )}
              {event.combatEffect.defenseModifier && (
                <li className={event.combatEffect.defenseModifier > 0 ? 'positive' : 'negative'}>
                  Defense rolls: {event.combatEffect.defenseModifier > 0 ? '+' : ''}{event.combatEffect.defenseModifier}
                </li>
              )}
              {event.duration > 0 && (
                <li>Duration: {event.duration} {event.duration === 1 ? 'turn' : 'turns'}</li>
              )}
            </ul>
          </div>
        );
        
      case 'territory':
        return (
          <div className="effect-details">
            <h4>Territory Effects:</h4>
            <ul>
              {event.territoryEffect.feature && (
                <li className="positive">
                  {event.territoryEffect.feature.replace('has', '').replace(/([A-Z])/g, ' $1').trim()}: {event.territoryEffect.value ? 'Added' : 'Removed'}
                </li>
              )}
              {event.territoryEffect.resources && Object.entries(event.territoryEffect.resources).map(([resource, value]) => (
                <li key={resource} className={value > 0 ? 'positive' : 'negative'}>
                  {resource.charAt(0).toUpperCase() + resource.slice(1)} production: {value > 0 ? '+' : ''}{value}
                </li>
              ))}
            </ul>
          </div>
        );
        
      case 'rebellion':
        return (
          <div className="effect-details">
            <h4>Rebellion Effects:</h4>
            <ul>
              <li className="negative">
                Lose {event.rebellionStrength} {event.rebellionStrength === 1 ? 'army' : 'armies'} in affected territory
              </li>
              {event.territoryLostOnRebellion && (
                <li className="negative">
                  Territory may be lost if no armies remain
                </li>
              )}
            </ul>
          </div>
        );
        
      case 'card':
        return (
          <div className="effect-details">
            <h4>Card Effects:</h4>
            <ul>
              <li className={event.cardEffect > 0 ? 'positive' : 'negative'}>
                {event.cardEffect > 0 ? 'Gain' : 'Lose'} {Math.abs(event.cardEffect)} {Math.abs(event.cardEffect) === 1 ? 'card' : 'cards'}
              </li>
            </ul>
          </div>
        );
        
      case 'movement':
        return (
          <div className="effect-details">
            <h4>Movement Effects:</h4>
            <ul>
              <li className={event.movementEffect.rangeModifier > 0 ? 'positive' : 'negative'}>
                Movement range: {event.movementEffect.rangeModifier > 0 ? '+' : ''}{event.movementEffect.rangeModifier}
              </li>
              {event.duration > 0 && (
                <li>Duration: {event.duration} {event.duration === 1 ? 'turn' : 'turns'}</li>
              )}
            </ul>
          </div>
        );
        
      default:
        return <p>This event has multiple or special effects.</p>;
    }
  };
  
  // Determine event category style
  const categoryClass = `event-category-${event.category}`;
  
  return (
    <div className="event-notification-overlay">
      <div className={`event-notification ${categoryClass}`}>
        <div className="event-notification-header">
          <h3>{event.name}</h3>
          {event.duration > 0 && (
            <span className="event-duration">
              {event.duration} {event.duration === 1 ? 'turn' : 'turns'}
            </span>
          )}
        </div>
        
        <div className="event-notification-body">
          <p className="event-message">{event.message}</p>
          
          {renderEventEffects()}
          
          {event.affectedTerritories && event.affectedTerritories.length > 0 && (
            <div className="affected-territories">
              <h4>Affected {event.affectedTerritories.length === 1 ? 'Territory' : 'Territories'}:</h4>
              <ul>
                {event.affectedTerritories.map(territoryId => {
                  const territory = event.gameState?.territories.find(t => t.id === territoryId);
                  return (
                    <li key={territoryId}>
                      {territory ? territory.name : territoryId}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        
        <div className="event-notification-footer">
          <button className="close-button" onClick={onClose}>
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventNotification;
