/**
 * Event system for Risk-inspired strategy game
 * Manages random and triggered events that affect gameplay
 */

import { eventTypes, generateEventPool } from './event-types.js';

class EventsManager {
  /**
   * Create a new EventsManager
   * @param {GameState} gameState - Reference to the game state
   */
  constructor(gameState) {
    this.gameState = gameState;
    this.activeEvents = [];
    this.eventHistory = [];
    this.eventPool = generateEventPool();
    this.eventProbability = 0.25; // 25% chance of an event on each turn
  }

  /**
   * Check if an event should be triggered at the start of a player's turn
   * @param {string} playerId - ID of the current player
   * @returns {Object|null} Event that was triggered or null
   */
  checkForEvent(playerId) {
    // Skip if events are disabled in game config
    if (!this.gameState.config.enableEvents) return null;
    
    // Skip for eliminated players
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || player.eliminated) return null;
    
    // Random check based on probability
    if (Math.random() > this.eventProbability) return null;
    
    // Get potential events for the current player
    const potentialEvents = this.eventPool.filter(event => {
      // Skip events that have already been triggered too many times
      const timesTriggerred = this.eventHistory.filter(e => e.type === event.type).length;
      if (timesTriggerred >= event.maxOccurrences) return false;
      
      // Check if the player meets the conditions for this event
      return this.checkEventConditions(event, playerId);
    });
    
    if (potentialEvents.length === 0) return null;
    
    // Select a random event from the potential events
    const selectedEvent = potentialEvents[Math.floor(Math.random() * potentialEvents.length)];
    
    // Prepare the event with specific context
    const preparedEvent = this.prepareEvent(selectedEvent, playerId);
    
    // Apply immediate effects
    this.applyEventEffects(preparedEvent);
    
    // Add to active events if it has duration
    if (preparedEvent.duration > 0) {
      this.activeEvents.push({
        ...preparedEvent,
        startTurn: this.gameState.turn,
        endTurn: this.gameState.turn + preparedEvent.duration
      });
    }
    
    // Add to event history
    this.eventHistory.push({
      ...preparedEvent,
      turn: this.gameState.turn
    });
    
    return preparedEvent;
  }

  /**
   * Check if a player meets the conditions for an event
   * @param {Object} event - Event to check
   * @param {string} playerId - ID of the current player
   * @returns {boolean} True if conditions are met
   */
  checkEventConditions(event, playerId) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) return false;
    
    // Check specific conditions
    if (event.conditions) {
      // Check minimum territory count
      if (event.conditions.minTerritories && player.territories.length < event.conditions.minTerritories) {
        return false;
      }
      
      // Check maximum territory count
      if (event.conditions.maxTerritories && player.territories.length > event.conditions.maxTerritories) {
        return false;
      }
      
      // Check minimum turn
      if (event.conditions.minTurn && this.gameState.turn < event.conditions.minTurn) {
        return false;
      }
      
      // Check if player controls a continent
      if (event.conditions.controlsContinent) {
        const continent = this.gameState.continents.find(c => c.id === event.conditions.controlsContinent);
        if (!continent) return false;
        
        const playerControlsContinent = continent.territories.every(terrId => 
          player.territories.includes(terrId)
        );
        
        if (!playerControlsContinent) return false;
      }
      
      // Check if player has a specific technology
      if (event.conditions.hasTechnology && !player.technologies.includes(event.conditions.hasTechnology)) {
        return false;
      }
      
      // Check resource level
      if (event.conditions.minResource) {
        const { type, value } = event.conditions.minResource;
        if (player.resources[type] < value) return false;
      }
    }
    
    return true;
  }

  /**
   * Prepare an event with specific context for the current game state
   * @param {Object} event - Base event template
   * @param {string} playerId - ID of the current player
   * @returns {Object} Prepared event with context
   */
  prepareEvent(event, playerId) {
    const player = this.gameState.players.find(p => p.id === playerId);
    const preparedEvent = { ...event, targetPlayerId: playerId };
    
    // Customize message with player name
    preparedEvent.message = preparedEvent.message.replace('{player}', player.name);
    
    // Determine affected territories for territory-specific events
    if (event.effectScope === 'territory' || event.effectScope === 'territories') {
      // Get eligible territories based on event's target scope
      let eligibleTerritories = [];
      
      switch (event.targetScope) {
        case 'player':
          eligibleTerritories = player.territories;
          break;
        case 'continent':
          if (event.targetContinentId) {
            const continent = this.gameState.continents.find(c => c.id === event.targetContinentId);
            if (continent) {
              eligibleTerritories = player.territories.filter(terrId => 
                continent.territories.includes(terrId)
              );
            }
          }
          break;
        case 'random':
        default:
          eligibleTerritories = player.territories;
          break;
      }
      
      // Select random territories from eligible ones
      const territoryCount = event.territoryCount || 1;
      const selectedTerritories = this.getRandomElements(eligibleTerritories, territoryCount);
      preparedEvent.affectedTerritories = selectedTerritories;
      
      // Update message with territory names
      if (selectedTerritories.length === 1) {
        const territory = this.gameState.territories.find(t => t.id === selectedTerritories[0]);
        preparedEvent.message = preparedEvent.message.replace('{territory}', territory ? territory.name : 'a territory');
      } else if (selectedTerritories.length > 1) {
        const territoryNames = selectedTerritories.map(terrId => {
          const territory = this.gameState.territories.find(t => t.id === terrId);
          return territory ? territory.name : 'Unknown';
        });
        preparedEvent.message = preparedEvent.message.replace('{territories}', territoryNames.join(', '));
      }
    }
    
    return preparedEvent;
  }

  /**
   * Apply the effects of an event
   * @param {Object} event - Event to apply
   */
  applyEventEffects(event) {
    const player = this.gameState.players.find(p => p.id === event.targetPlayerId);
    if (!player) return;
    
    // Apply different effects based on event type
    switch (event.effectType) {
      case 'resource':
        // Modify resources
        if (event.resourceEffect) {
          Object.entries(event.resourceEffect).forEach(([resource, change]) => {
            if (player.resources[resource] !== undefined) {
              player.resources[resource] += change;
              
              // Ensure resources don't go below zero
              if (player.resources[resource] < 0) {
                player.resources[resource] = 0;
              }
            }
          });
        }
        break;
        
      case 'armies':
        // Add or remove armies from territories
        if (event.armyEffect && event.affectedTerritories) {
          event.affectedTerritories.forEach(territoryId => {
            const territory = this.gameState.territories.find(t => t.id === territoryId);
            if (!territory) return;
            
            // Apply change to infantry units
            territory.armies.infantry += event.armyEffect;
            
            // Ensure we don't have negative armies
            if (territory.armies.infantry < 0) {
              territory.armies.infantry = 0;
            }
          });
        }
        break;
        
      case 'combat':
        // Apply combat bonuses/penalties
        // These are handled during combat resolution
        break;
        
      case 'movement':
        // Apply movement bonuses/penalties
        // These are handled during the fortification phase
        break;
        
      case 'territories':
      case 'territory':
        // Change territory features
        if (event.territoryEffect && event.affectedTerritories) {
          event.affectedTerritories.forEach(territoryId => {
            const territory = this.gameState.territories.find(t => t.id === territoryId);
            if (!territory) return;
            
            // Apply feature changes
            if (event.territoryEffect.feature) {
              territory.features[event.territoryEffect.feature] = event.territoryEffect.value;
            }
            
            // Apply resource changes
            if (event.territoryEffect.resources) {
              Object.entries(event.territoryEffect.resources).forEach(([resource, change]) => {
                if (territory.resources[resource] !== undefined) {
                  territory.resources[resource] += change;
                  
                  // Ensure territory resources don't go below zero
                  if (territory.resources[resource] < 0) {
                    territory.resources[resource] = 0;
                  }
                } else if (change > 0) {
                  // Add new resource if it doesn't exist
                  territory.resources[resource] = change;
                }
              });
            }
          });
        }
        break;
        
      case 'rebellion':
        // Rebellion in territory (reduce armies and possibly change ownership)
        if (event.affectedTerritories) {
          event.affectedTerritories.forEach(territoryId => {
            const territory = this.gameState.territories.find(t => t.id === territoryId);
            if (!territory) return;
            
            // Reduce armies
            const rebellionStrength = event.rebellionStrength || 2;
            
            // Remove infantry first
            territory.armies.infantry -= rebellionStrength;
            
            // Ensure we don't have negative armies
            if (territory.armies.infantry < 0) {
              territory.armies.infantry = 0;
            }
            
            // Check if territory is lost due to rebellion
            if (territory.getTotalArmies() === 0 && event.territoryLostOnRebellion) {
              // Territory becomes neutral (no owner)
              player.territories = player.territories.filter(id => id !== territoryId);
              territory.occupyingPlayer = null;
              
              // Add infantry to represent rebels
              territory.armies.infantry = Math.floor(Math.random() * 3) + 1;
            }
          });
        }
        break;
        
      case 'card':
        // Give or take cards
        if (event.cardEffect) {
          if (event.cardEffect > 0) {
            // Give cards to player
            for (let i = 0; i < event.cardEffect; i++) {
              if (this.gameState.cardDeck.length > 0) {
                const card = this.gameState.cardDeck.pop();
                player.cards.push(card);
              }
            }
          } else if (event.cardEffect < 0) {
            // Take random cards from player
            const cardsToTake = Math.min(player.cards.length, Math.abs(event.cardEffect));
            for (let i = 0; i < cardsToTake; i++) {
              const randomIndex = Math.floor(Math.random() * player.cards.length);
              const card = player.cards.splice(randomIndex, 1)[0];
              this.gameState.discardPile.push(card);
            }
          }
        }
        break;
        
      case 'technology':
        // Give or take technologies
        if (event.technologyEffect && event.technologyEffect.id) {
          if (event.technologyEffect.give) {
            // Check if player already has the technology
            if (!player.technologies.includes(event.technologyEffect.id)) {
              player.technologies.push(event.technologyEffect.id);
            }
          } else if (event.technologyEffect.take) {
            // Remove the technology from the player
            player.technologies = player.technologies.filter(tech => tech !== event.technologyEffect.id);
          }
        }
        break;
        
      default:
        // Unknown effect type
        console.warn(`Unknown event effect type: ${event.effectType}`);
        break;
    }
  }

  /**
   * Update active events at the start of a turn
   * @param {string} playerId - ID of the current player
   */
  updateActiveEvents(playerId) {
    // Process expired events
    const currentTurn = this.gameState.turn;
    const expiredEvents = this.activeEvents.filter(event => event.endTurn <= currentTurn);
    
    // Remove expired events and reverse their effects if needed
    expiredEvents.forEach(event => {
      if (event.reverseOnExpire) {
        this.reverseEventEffects(event);
      }
      
      // Add expiration to history
      this.eventHistory.push({
        ...event,
        expired: true,
        turn: currentTurn
      });
    });
    
    // Remove expired events from active list
    this.activeEvents = this.activeEvents.filter(event => event.endTurn > currentTurn);
    
    // Apply ongoing effects for active events that target the current player
    this.activeEvents
      .filter(event => event.targetPlayerId === playerId)
      .forEach(event => {
        if (event.applyEachTurn) {
          this.applyEventEffects(event);
        }
      });
    
    return expiredEvents;
  }

  /**
   * Reverse the effects of an expired event
   * @param {Object} event - Event to reverse
   */
  reverseEventEffects(event) {
    // Implement logic to reverse various effect types
    const player = this.gameState.players.find(p => p.id === event.targetPlayerId);
    if (!player) return;
    
    // Only certain effect types can be reversed
    switch (event.effectType) {
      case 'combat':
        // Combat bonuses/penalties are automatically removed
        break;
        
      case 'movement':
        // Movement bonuses/penalties are automatically removed
        break;
        
      case 'territory':
        // Restore territory features to previous state
        if (event.territoryEffect && event.affectedTerritories) {
          event.affectedTerritories.forEach(territoryId => {
            const territory = this.gameState.territories.find(t => t.id === territoryId);
            if (!territory) return;
            
            // Reverse feature changes
            if (event.territoryEffect.feature) {
              // For boolean features, we just toggle back
              territory.features[event.territoryEffect.feature] = !event.territoryEffect.value;
            }
            
            // Reverse resource changes
            if (event.territoryEffect.resources) {
              Object.entries(event.territoryEffect.resources).forEach(([resource, change]) => {
                if (territory.resources[resource] !== undefined) {
                  territory.resources[resource] -= change;
                  
                  // Ensure territory resources don't go below zero
                  if (territory.resources[resource] < 0) {
                    territory.resources[resource] = 0;
                  }
                }
              });
            }
          });
        }
        break;
        
      default:
        // Other effect types are not reversed
        break;
    }
  }

  /**
   * Get current combat modifiers from active events for a player
   * @param {string} playerId - ID of the player
   * @param {string} territoryId - ID of the territory
   * @param {string} combatType - Type of combat ('attack' or 'defense')
   * @returns {number} Combat modifier
   */
  getCombatModifiers(playerId, territoryId, combatType) {
    let modifier = 0;
    
    // Check active events for combat modifiers
    this.activeEvents
      .filter(event => 
        event.effectType === 'combat' && 
        event.targetPlayerId === playerId &&
        (
          !event.affectedTerritories || 
          event.affectedTerritories.includes(territoryId)
        )
      )
      .forEach(event => {
        if (combatType === 'attack' && event.combatEffect && event.combatEffect.attackModifier) {
          modifier += event.combatEffect.attackModifier;
        } else if (combatType === 'defense' && event.combatEffect && event.combatEffect.defenseModifier) {
          modifier += event.combatEffect.defenseModifier;
        }
      });
    
    return modifier;
  }

  /**
   * Get movement modifiers from active events for a player
   * @param {string} playerId - ID of the player
   * @returns {number} Movement modifier
   */
  getMovementModifiers(playerId) {
    let modifier = 0;
    
    // Check active events for movement modifiers
    this.activeEvents
      .filter(event => 
        event.effectType === 'movement' && 
        event.targetPlayerId === playerId
      )
      .forEach(event => {
        if (event.movementEffect && event.movementEffect.rangeModifier) {
          modifier += event.movementEffect.rangeModifier;
        }
      });
    
    return modifier;
  }

  /**
   * Get a list of active events for a specific player
   * @param {string} playerId - ID of the player
   * @returns {Object[]} Active events for the player
   */
  getPlayerActiveEvents(playerId) {
    return this.activeEvents.filter(event => event.targetPlayerId === playerId);
  }

  /**
   * Helper method to get random elements from an array
   * @param {Array} array - Source array
   * @param {number} count - Number of elements to select
   * @returns {Array} Selected elements
   */
  getRandomElements(array, count) {
    if (!array || array.length === 0) return [];
    if (array.length <= count) return [...array];
    
    const result = [];
    const copy = [...array];
    
    for (let i = 0; i < count; i++) {
      const index = Math.floor(Math.random() * copy.length);
      result.push(copy[index]);
      copy.splice(index, 1);
    }
    
    return result;
  }
}

export default EventsManager;
