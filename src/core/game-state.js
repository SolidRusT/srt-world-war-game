/**
 * Enhanced Game State for Risk-inspired strategy game
 */

import ResourceManager from './resource-manager.js';
import TechManager from './tech-manager.js';
import CombatSystem from './combat-system.js';

/**
 * Represents the complete game state with enhanced systems
 */
class GameState {
  /**
   * Create a new GameState
   * @param {Object} config - Game configuration options
   * @param {Player[]} players - List of players
   * @param {Territory[]} territories - List of territories
   * @param {Continent[]} continents - List of continents
   * @param {Card[]} cardDeck - Deck of territory cards
   */
  constructor(config, players, territories, continents, cardDeck) {
    // Game configuration
    this.config = {
      mapId: 'classic',
      enableTechnologies: true,
      enableResources: true,
      enableEvents: true,
      enableAlliances: true,
      victoryConditions: ['military', 'economic', 'technological', 'diplomatic'],
      ...config
    };
    
    // Core game data
    this.players = players;
    this.territories = territories;
    this.continents = continents;
    this.cardDeck = cardDeck;
    this.discardPile = [];
    
    // Game state tracking
    this.currentPlayerIndex = 0;
    this.phase = 'reinforcement'; // reinforcement, attack, fortification
    this.turn = 1;
    this.gameOver = false;
    this.winner = null;
    this.eventLog = [];
    this.hasConqueredTerritoryThisTurn = false;
    
    // Create subsystems
    this.resourceManager = new ResourceManager(this);
    this.techManager = new TechManager(this);
    this.combatSystem = new CombatSystem(this);
    
    // Dynamic events system
    this.events = [];
    this.activeEvents = [];
    
    // Alliance system
    this.alliances = [];
    
    // Victory tracking
    this.victoryProgress = {};
    for (const condition of this.config.victoryConditions) {
      this.victoryProgress[condition] = {};
    }
  }

  /**
   * Get the current player
   * @returns {Player} The current player
   */
  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Advance to the next phase or player
   */
  nextPhase() {
    switch (this.phase) {
      case 'reinforcement':
        this.phase = 'attack';
        break;
      case 'attack':
        this.phase = 'fortification';
        break;
      case 'fortification':
        this.phase = 'reinforcement';
        this.nextPlayer();
        break;
    }
    
    this.eventLog.push({
      type: 'phase-change',
      phase: this.phase,
      playerId: this.getCurrentPlayer().id,
      turn: this.turn
    });
  }

  /**
   * Advance to the next player
   */
  nextPlayer() {
    let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
    
    // Skip eliminated players
    while (this.players[nextIndex].eliminated) {
      nextIndex = (nextIndex + 1) % this.players.length;
      
      // If we've gone through all players and come back to the current one,
      // all other players must be eliminated - game over!
      if (nextIndex === this.currentPlayerIndex) {
        this.gameOver = true;
        this.winner = this.players[this.currentPlayerIndex];
        break;
      }
    }
    
    this.currentPlayerIndex = nextIndex;
    
    // Reset turn-based flags
    this.hasConqueredTerritoryThisTurn = false;
    
    // If we've completed a full round of turns, increment the turn counter
    if (this.currentPlayerIndex === 0) {
      this.turn++;
      this.processTurnEvents();
    }
    
    // Process start-of-turn actions for the new player
    this.processPlayerTurnStart();
  }

  /**
   * Process start-of-turn actions for the current player
   */
  processPlayerTurnStart() {
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.eliminated) return;
    
    // Collect resources
    if (this.config.enableResources) {
      this.resourceManager.collectResources(currentPlayer.id);
    }
    
    // Update research progress
    if (this.config.enableTechnologies) {
      this.techManager.updateResearch(currentPlayer.id);
    }
    
    // Process active events
    if (this.config.enableEvents) {
      this.processPlayerEvents(currentPlayer.id);
    }
    
    // Log turn start
    this.eventLog.push({
      type: 'turn-start',
      playerId: currentPlayer.id,
      turn: this.turn
    });
  }

  /**
   * Process global events at the end of each turn
   */
  processTurnEvents() {
    if (!this.config.enableEvents) return;
    
    // Update active events
    this.activeEvents = this.activeEvents.filter(event => {
      event.turnsRemaining--;
      return event.turnsRemaining > 0;
    });
    
    // Chance to trigger a new event
    if (Math.random() < 0.2) { // 20% chance per turn
      this.triggerRandomEvent();
    }
  }

  /**
   * Process events affecting a specific player
   * @param {string} playerId - ID of the player
   */
  processPlayerEvents(playerId) {
    if (!this.config.enableEvents) return;
    
    // Apply effects of active events on this player
    for (const event of this.activeEvents) {
      if (event.affectedPlayers.includes(playerId) || event.affectedPlayers.includes('all')) {
        this.applyEventEffect(event, playerId);
      }
    }
  }

  /**
   * Trigger a random global event
   */
  triggerRandomEvent() {
    // This would be implemented with a library of possible events
    // For now, we'll just add a placeholder event
    
    const eventTypes = [
      'natural-disaster',
      'scientific-breakthrough',
      'economic-boom',
      'plague',
      'civil-unrest'
    ];
    
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    const newEvent = {
      type: randomType,
      name: this.getEventName(randomType),
      description: this.getEventDescription(randomType),
      turnsRemaining: 2 + Math.floor(Math.random() * 3), // 2-4 turns
      affectedPlayers: ['all'],
      affectedTerritories: this.getRandomTerritories(1 + Math.floor(Math.random() * 3)), // 1-3 territories
      effects: this.getEventEffects(randomType)
    };
    
    this.activeEvents.push(newEvent);
    
    // Log event
    this.eventLog.push({
      type: 'event-triggered',
      event: newEvent,
      turn: this.turn
    });
  }

  /**
   * Get event name based on type
   * @param {string} eventType - Type of event
   * @returns {string} Event name
   */
  getEventName(eventType) {
    const eventNames = {
      'natural-disaster': 'Natural Disaster',
      'scientific-breakthrough': 'Scientific Breakthrough',
      'economic-boom': 'Economic Boom',
      'plague': 'Plague Outbreak',
      'civil-unrest': 'Civil Unrest'
    };
    
    return eventNames[eventType] || 'Unknown Event';
  }

  /**
   * Get event description based on type
   * @param {string} eventType - Type of event
   * @returns {string} Event description
   */
  getEventDescription(eventType) {
    const eventDescriptions = {
      'natural-disaster': 'A natural disaster has struck! Affected territories lose 1 army.',
      'scientific-breakthrough': 'A scientific breakthrough has occurred! All players gain +2 research.',
      'economic-boom': 'Economic boom! All players gain +2 wealth.',
      'plague': 'A plague has broken out! Affected territories cannot gain new armies this turn.',
      'civil-unrest': 'Civil unrest has erupted! Affected territories lose 1 army.'
    };
    
    return eventDescriptions[eventType] || 'An event with unknown effects has occurred.';
  }

  /**
   * Get event effects based on type
   * @param {string} eventType - Type of event
   * @returns {Object} Event effects
   */
  getEventEffects(eventType) {
    const eventEffects = {
      'natural-disaster': { armyLoss: 1 },
      'scientific-breakthrough': { resourceGain: { research: 2 } },
      'economic-boom': { resourceGain: { wealth: 2 } },
      'plague': { preventReinforcement: true },
      'civil-unrest': { armyLoss: 1 }
    };
    
    return eventEffects[eventType] || {};
  }

  /**
   * Get random territories from the game
   * @param {number} count - Number of territories to select
   * @returns {string[]} Array of territory IDs
   */
  getRandomTerritories(count) {
    const shuffled = [...this.territories].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(t => t.id);
  }

  /**
   * Apply an event's effect to a player
   * @param {Object} event - The event to apply
   * @param {string} playerId - ID of the player
   */
  applyEventEffect(event, playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.eliminated) return;
    
    const effects = event.effects;
    
    // Resource gain effects
    if (effects.resourceGain) {
      for (const [resourceType, amount] of Object.entries(effects.resourceGain)) {
        if (resourceType in player.resources) {
          player.resources[resourceType] += amount;
        }
      }
    }
    
    // Army loss effects
    if (effects.armyLoss) {
      for (const territoryId of event.affectedTerritories) {
        const territory = this.territories.find(t => t.id === territoryId);
        if (!territory || territory.occupyingPlayer !== playerId) continue;
        
        // Remove armies (starting with infantry)
        if (territory.armies.infantry >= effects.armyLoss) {
          territory.armies.infantry -= effects.armyLoss;
        } else {
          // If not enough infantry, continue with cavalry then artillery
          let remainingLoss = effects.armyLoss - territory.armies.infantry;
          territory.armies.infantry = 0;
          
          if (territory.armies.cavalry >= remainingLoss) {
            territory.armies.cavalry -= remainingLoss;
          } else {
            remainingLoss -= territory.armies.cavalry;
            territory.armies.cavalry = 0;
            territory.armies.artillery = Math.max(0, territory.armies.artillery - remainingLoss);
          }
        }
      }
    }
  }

  /**
   * Create a new alliance between players
   * @param {string} player1Id - ID of the first player
   * @param {string} player2Id - ID of the second player
   * @param {Object} terms - Alliance terms
   * @returns {boolean} True if alliance was created
   */
  createAlliance(player1Id, player2Id, terms) {
    if (!this.config.enableAlliances) return false;
    
    const player1 = this.players.find(p => p.id === player1Id);
    const player2 = this.players.find(p => p.id === player2Id);
    
    if (!player1 || !player2 || player1.eliminated || player2.eliminated) {
      return false;
    }
    
    // Check if an alliance already exists between these players
    const existingAlliance = this.alliances.find(a => 
      (a.player1Id === player1Id && a.player2Id === player2Id) ||
      (a.player1Id === player2Id && a.player2Id === player1Id)
    );
    
    if (existingAlliance) {
      return false;
    }
    
    // Verify both players have the necessary technology for the requested terms
    const allianceRequirements = {
      nonAggression: 'diplomacy',
      resourceSharing: 'trade-agreement',
      militarySupport: 'military-alliance'
    };
    
    for (const [term, value] of Object.entries(terms)) {
      if (value && allianceRequirements[term]) {
        const requiredTech = allianceRequirements[term];
        
        if (!player1.technologies.includes(requiredTech) ||
            !player2.technologies.includes(requiredTech)) {
          return false;
        }
      }
    }
    
    // Create the alliance
    const alliance = {
      id: `alliance-${Date.now()}`,
      player1Id,
      player2Id,
      terms,
      turnsActive: 0
    };
    
    this.alliances.push(alliance);
    
    // Update player allies lists
    player1.allies.push(player2Id);
    player2.allies.push(player1Id);
    
    // Log alliance creation
    this.eventLog.push({
      type: 'alliance-created',
      alliance,
      turn: this.turn
    });
    
    // Check for diplomatic victory progress
    this.checkDiplomaticVictory();
    
    return true;
  }

  /**
   * Break an alliance between players
   * @param {string} allianceId - ID of the alliance to break
   * @param {string} initiatorId - ID of the player breaking the alliance
   * @returns {boolean} True if alliance was broken
   */
  breakAlliance(allianceId, initiatorId) {
    if (!this.config.enableAlliances) return false;
    
    const alliance = this.alliances.find(a => a.id === allianceId);
    if (!alliance) return false;
    
    const { player1Id, player2Id } = alliance;
    
    // Verify the initiator is part of the alliance
    if (initiatorId !== player1Id && initiatorId !== player2Id) {
      return false;
    }
    
    // Remove alliance from the list
    this.alliances = this.alliances.filter(a => a.id !== allianceId);
    
    // Update player allies lists
    const player1 = this.players.find(p => p.id === player1Id);
    const player2 = this.players.find(p => p.id === player2Id);
    
    if (player1) {
      player1.allies = player1.allies.filter(id => id !== player2Id);
    }
    
    if (player2) {
      player2.allies = player2.allies.filter(id => id !== player1Id);
    }
    
    // Log alliance break
    this.eventLog.push({
      type: 'alliance-broken',
      allianceId,
      initiatorId,
      player1Id,
      player2Id,
      turn: this.turn
    });
    
    return true;
  }

  /**
   * Process trade in of cards for armies
   * @param {string} playerId - ID of the player
   * @param {string[]} cardIds - IDs of cards to trade in
   * @returns {Object} Result of the trade
   */
  processCardTrade(playerId, cardIds) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.eliminated) return { success: false, error: 'Invalid player' };
    
    // Check if it's the player's turn and the reinforcement phase
    if (this.getCurrentPlayer().id !== playerId || this.phase !== 'reinforcement') {
      return { success: false, error: 'Not your turn or phase' };
    }
    
    // Check if the player has the cards
    const playerCards = player.cards;
    const cardsToTrade = cardIds.map(id => playerCards.find(card => card.id === id));
    
    if (cardsToTrade.includes(undefined) || cardsToTrade.length !== 3) {
      return { success: false, error: 'Invalid cards' };
    }
    
    // Check if the cards form a valid set
    const isValidSet = this.isValidCardSet(cardsToTrade);
    if (!isValidSet) {
      return { success: false, error: 'Not a valid set' };
    }
    
    // Calculate armies awarded
    const setNumber = this.calculateSetNumber();
    let armies = this.calculateArmiesForSet(setNumber);
    
    // Check for territory bonuses
    let territoryBonuses = [];
    
    for (const card of cardsToTrade) {
      if (card.territoryId) {
        const territory = this.territories.find(t => t.id === card.territoryId);
        if (territory && territory.occupyingPlayer === playerId) {
          armies += 2;
          territoryBonuses.push(territory.name);
        }
      }
    }
    
    // Remove the cards from the player's hand
    player.cards = player.cards.filter(card => !cardIds.includes(card.id));
    
    // Add the cards to the discard pile
    this.discardPile = this.discardPile.concat(cardsToTrade);
    
    // Log card trade
    this.eventLog.push({
      type: 'card-trade',
      playerId,
      cardIds,
      armies,
      territoryBonuses,
      turn: this.turn
    });
    
    return {
      success: true,
      armies,
      territoryBonuses,
      setNumber
    };
  }

  /**
   * Check if a set of cards is valid for trading
   * @param {Card[]} cards - Array of cards to check
   * @returns {boolean} True if the set is valid
   */
  isValidCardSet(cards) {
    if (cards.length !== 3) return false;
    
    // Count card types
    const types = cards.map(card => card.type);
    const typeCounts = {};
    
    for (const type of types) {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
    
    // Check for wild cards
    const wildCount = typeCounts['wild'] || 0;
    
    // Case 1: Three of the same type
    const sameTypeCount = Math.max(...Object.values(typeCounts).filter(count => count <= 3));
    if (sameTypeCount + wildCount >= 3) return true;
    
    // Case 2: One of each type
    const uniqueTypes = Object.keys(typeCounts).filter(type => type !== 'wild').length;
    if (uniqueTypes + wildCount >= 3) return true;
    
    return false;
  }

  /**
   * Calculate which set number is being turned in
   * @returns {number} Set number
   */
  calculateSetNumber() {
    // Count sets traded in so far
    const cardTradeEvents = this.eventLog.filter(event => event.type === 'card-trade');
    return cardTradeEvents.length + 1;
  }

  /**
   * Calculate armies awarded for a card set
   * @param {number} setNumber - Which set is being traded in
   * @returns {number} Number of armies awarded
   */
  calculateArmiesForSet(setNumber) {
    if (setNumber <= 1) return 4;
    if (setNumber === 2) return 6;
    if (setNumber === 3) return 8;
    if (setNumber === 4) return 10;
    if (setNumber === 5) return 12;
    if (setNumber === 6) return 15;
    
    // After the 6th set, each additional set is worth 5 more armies
    return 15 + (setNumber - 6) * 5;
  }

  /**
   * Check if a player controls an entire continent
   * @param {string} playerId - Player ID to check
   * @param {string} continentId - Continent ID to check
   * @returns {boolean} True if player controls the continent
   */
  playerControlsContinent(playerId, continentId) {
    const continent = this.continents.find(c => c.id === continentId);
    if (!continent) return false;
    
    const player = this.players.find(p => p.id === playerId);
    if (!player) return false;
    
    const continentTerritories = this.territories.filter(t => t.continent === continentId);
    
    return continentTerritories.every(territory => territory.occupyingPlayer === playerId);
  }

  /**
   * Check all victory conditions
   * @returns {boolean} True if the game is over
   */
  checkVictoryConditions() {
    // Military victory (total domination)
    const activePlayers = this.players.filter(p => !p.eliminated);
    
    if (activePlayers.length === 1) {
      this.gameOver = true;
      this.winner = activePlayers[0];
      
      this.eventLog.push({
        type: 'victory',
        victoryType: 'military',
        playerId: this.winner.id,
        turn: this.turn
      });
      
      return true;
    }
    
    // Check other victory conditions if enabled
    if (this.config.victoryConditions.includes('economic')) {
      const winner = this.checkEconomicVictory();
      if (winner) return true;
    }
    
    if (this.config.victoryConditions.includes('technological')) {
      const winner = this.checkTechnologicalVictory();
      if (winner) return true;
    }
    
    if (this.config.victoryConditions.includes('diplomatic')) {
      const winner = this.checkDiplomaticVictory();
      if (winner) return true;
    }
    
    return false;
  }

  /**
   * Check for economic victory
   * @returns {boolean} True if a player has achieved economic victory
   */
  checkEconomicVictory() {
    if (!this.config.enableResources) return false;
    
    for (const player of this.players) {
      if (player.eliminated) continue;
      
      // Economic victory requires:
      // 1. Economic Dominance technology
      // 2. Control of territories that produce at least 30 total resources
      if (player.technologies.includes('economic-dominance')) {
        const production = this.resourceManager.calculateResourceProduction(player.id);
        const totalProduction = Object.values(production).reduce((sum, val) => sum + val, 0);
        
        if (totalProduction >= 30) {
          this.gameOver = true;
          this.winner = player;
          
          this.eventLog.push({
            type: 'victory',
            victoryType: 'economic',
            playerId: player.id,
            turn: this.turn
          });
          
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check for technological victory
   * @returns {boolean} True if a player has achieved technological victory
   */
  checkTechnologicalVictory() {
    if (!this.config.enableTechnologies) return false;
    
    for (const player of this.players) {
      if (player.eliminated) continue;
      
      // Technological victory requires:
      // 1. Technological Supremacy technology
      // 2. Research of all technologies in one category
      if (player.technologies.includes('technological-supremacy')) {
        const techCategories = ['military', 'economic', 'diplomatic', 'research'];
        
        for (const category of techCategories) {
          const categoryTechs = this.techManager.techTree[category] || [];
          const techIds = categoryTechs.map(tech => tech.id);
          
          // Check if player has all techs in this category
          const hasAllCategoryTechs = techIds.every(id => player.technologies.includes(id));
          
          if (hasAllCategoryTechs) {
            this.gameOver = true;
            this.winner = player;
            
            this.eventLog.push({
              type: 'victory',
              victoryType: 'technological',
              playerId: player.id,
              turn: this.turn
            });
            
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Check for diplomatic victory
   * @returns {boolean} True if a player has achieved diplomatic victory
   */
  checkDiplomaticVictory() {
    if (!this.config.enableAlliances) return false;
    
    for (const player of this.players) {
      if (player.eliminated) continue;
      
      // Diplomatic victory requires:
      // 1. United Nations technology
      // 2. Alliances with all surviving players
      if (player.technologies.includes('diplomatic-victory')) {
        const otherActivePlayers = this.players.filter(p => 
          !p.eliminated && p.id !== player.id
        );
        
        const alliedPlayers = player.allies;
        
        // Check if player is allied with all other active players
        const hasAllAlliances = otherActivePlayers.every(p => 
          alliedPlayers.includes(p.id)
        );
        
        if (hasAllAlliances && otherActivePlayers.length > 0) {
          this.gameOver = true;
          this.winner = player;
          
          this.eventLog.push({
            type: 'victory',
            victoryType: 'diplomatic',
            playerId: player.id,
            turn: this.turn
          });
          
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Get a serializable representation of the game state
   * @returns {Object} Serialized game state
   */
  serialize() {
    return {
      config: this.config,
      players: this.players,
      territories: this.territories,
      continents: this.continents,
      currentPlayerIndex: this.currentPlayerIndex,
      phase: this.phase,
      turn: this.turn,
      gameOver: this.gameOver,
      winner: this.winner ? this.winner.id : null,
      eventLog: this.eventLog.slice(-50), // Only keep the most recent events
      alliances: this.alliances,
      activeEvents: this.activeEvents
    };
  }

  /**
   * Create a GameState from serialized data
   * @param {Object} data - Serialized game state
   * @returns {GameState} Reconstituted game state
   */
  static deserialize(data) {
    const gameState = new GameState(
      data.config,
      data.players,
      data.territories,
      data.continents,
      [] // Card deck will need to be reconstructed
    );
    
    gameState.currentPlayerIndex = data.currentPlayerIndex;
    gameState.phase = data.phase;
    gameState.turn = data.turn;
    gameState.gameOver = data.gameOver;
    
    if (data.winner) {
      gameState.winner = gameState.players.find(p => p.id === data.winner);
    }
    
    gameState.eventLog = data.eventLog || [];
    gameState.alliances = data.alliances || [];
    gameState.activeEvents = data.activeEvents || [];
    
    return gameState;
  }
}

export default GameState;
