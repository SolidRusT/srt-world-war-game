import React, { useState } from 'react';
import './EventsDisplay.css';

/**
 * Component to display active events and event history
 */
const EventsDisplay = ({ gameState, currentPlayerId }) => {
  const [activeTab, setActiveTab] = useState('active');
  
  if (!gameState || !gameState.eventsManager) {
    return (
      <div className="events-display empty-state">
        <p>No events to display.</p>
      </div>
    );
  }
  
  // Get active events for the current player
  const activeEvents = gameState.eventsManager.getPlayerActiveEvents(currentPlayerId);
  
  // Get event history (last 10 events)
  const eventHistory = gameState.eventsManager.eventHistory
    .filter(event => event.targetPlayerId === currentPlayerId)
    .slice(-10)
    .reverse();
  
  const renderEventItem = (event) => {
    const categoryClass = `event-category-${event.category}`;
    
    return (
      <div key={`${event.id}-${event.startTurn || event.turn}`} className={`event-item ${categoryClass}`}>
        <div className="event-header">
          <h4 className="event-name">{event.name}</h4>
          {event.duration > 0 && event.endTurn && (
            <span className="event-duration">
              {event.endTurn - gameState.turn} turns left
            </span>
          )}
        </div>
        <p className="event-message">{event.message}</p>
        <div className="event-effects">
          {renderEventEffects(event)}
        </div>
      </div>
    );
  };
  
  const renderEventEffects = (event) => {
    switch (event.effectType) {
      case 'resource':
        return (
          <div className="effect-resource">
            {Object.entries(event.resourceEffect).map(([resource, value]) => (
              <span key={resource} className={value > 0 ? 'positive' : 'negative'}>
                {resource}: {value > 0 ? '+' : ''}{value}
              </span>
            ))}
          </div>
        );
        
      case 'armies':
        return (
          <div className="effect-armies">
            <span className={event.armyEffect > 0 ? 'positive' : 'negative'}>
              Armies: {event.armyEffect > 0 ? '+' : ''}{event.armyEffect}
            </span>
          </div>
        );
        
      case 'combat':
        return (
          <div className="effect-combat">
            {event.combatEffect.attackModifier && (
              <span className={event.combatEffect.attackModifier > 0 ? 'positive' : 'negative'}>
                Attack: {event.combatEffect.attackModifier > 0 ? '+' : ''}{event.combatEffect.attackModifier}
              </span>
            )}
            {event.combatEffect.defenseModifier && (
              <span className={event.combatEffect.defenseModifier > 0 ? 'positive' : 'negative'}>
                Defense: {event.combatEffect.defenseModifier > 0 ? '+' : ''}{event.combatEffect.defenseModifier}
              </span>
            )}
          </div>
        );
        
      case 'territory':
        return (
          <div className="effect-territory">
            {event.territoryEffect.feature && (
              <span className="positive">
                {event.territoryEffect.feature.replace('has', '')}: {event.territoryEffect.value ? 'Added' : 'Removed'}
              </span>
            )}
            {event.territoryEffect.resources && Object.entries(event.territoryEffect.resources).map(([resource, value]) => (
              <span key={resource} className={value > 0 ? 'positive' : 'negative'}>
                {resource}: {value > 0 ? '+' : ''}{value}
              </span>
            ))}
          </div>
        );
        
      case 'rebellion':
        return (
          <div className="effect-rebellion">
            <span className="negative">
              Army Loss: {event.rebellionStrength}
            </span>
            {event.territoryLostOnRebellion && (
              <span className="negative">
                Risk of territory loss
              </span>
            )}
          </div>
        );
        
      case 'card':
        return (
          <div className="effect-card">
            <span className={event.cardEffect > 0 ? 'positive' : 'negative'}>
              Cards: {event.cardEffect > 0 ? '+' : ''}{event.cardEffect}
            </span>
          </div>
        );
        
      case 'movement':
        return (
          <div className="effect-movement">
            <span className={event.movementEffect.rangeModifier > 0 ? 'positive' : 'negative'}>
              Movement: {event.movementEffect.rangeModifier > 0 ? '+' : ''}{event.movementEffect.rangeModifier}
            </span>
          </div>
        );
        
      default:
        return <span>Multiple effects</span>;
    }
  };
  
  return (
    <div className="events-display">
      <div className="events-tabs">
        <button 
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Events ({activeEvents.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Event History
        </button>
      </div>
      
      <div className="events-content">
        {activeTab === 'active' && (
          <>
            {activeEvents.length === 0 ? (
              <p className="no-events">No active events.</p>
            ) : (
              activeEvents.map(event => renderEventItem(event))
            )}
          </>
        )}
        
        {activeTab === 'history' && (
          <>
            {eventHistory.length === 0 ? (
              <p className="no-events">No events in history.</p>
            ) : (
              eventHistory.map(event => renderEventItem(event))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventsDisplay;
