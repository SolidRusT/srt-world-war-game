/**
 * Game engine for Risk-inspired strategy game
 */

import { GameState, Territory, Continent, Player, Card, Technology } from './models.js';
import TechManager from './tech-manager.js';
import ResourceManager from './resource-manager.js';
import EventsManager from './events/events-manager.js';
import classicMap from '../assets/maps/classic-map.js';

/**
 * Handles core game logic and state transitions
 */
class GameEngine {
  /**
   * Create a new GameEngine
   * @param {Object} config - Game configuration options
   */
  constructor(config = {}) {
    this.config = {
      mapId: 'classic',
      playerCount: 4,
      aiPlayers: 3,
      enableTechnologies: true,
      enableResources: true,
      enableEvents: true,
      enableAlliances: true,
      victoryConditions: ['military', 'economic', 'technological'],
      ...config
    };
    
    this.gameState = null;
    this.mapData = null;
  }

  /**
   * Initialize a new game
   * @returns {GameState} The initial game state
   */
  initializeGame() {
    // Load map data
    this.mapData = this.loadMapData(this.config.mapId);
    
    // Create players
    const players = this.createPlayers();
    
    // Create territories
    const territories = this.createTerritories();
    
    // Create continents
    const continents = this.createContinents();
    
    // Create card deck
    const cardDeck = this.createCardDeck(territories);
    
    // Create initial game state
    this.gameState = new GameState(this.config, players, territories, continents, cardDeck);
    
    // Initialize technology manager if technologies are enabled
    if (this.config.enableTechnologies) {
      this.gameState.techManager = new TechManager(this.gameState);
    }
    
    // Initialize resource manager if resources are enabled
    if (this.config.enableResources) {
      this.gameState.resourceManager = new ResourceManager(this.gameState);
    }
    
    // Initialize events manager if events are enabled
    if (this.config.enableEvents) {
      this.gameState.eventsManager = new EventsManager(this.gameState);
    }
    
    // Distribute territories and initial armies
    this.distributeInitialTerritories();
    this.placeInitialArmies();
    
    return this.gameState;
  }

  /**
   * Load map data based on map ID
   * @param {string} mapId - ID of the map to load
   * @returns {Object} Map data
   */
  loadMapData(mapId) {
    // Import map data dynamically based on mapId
    try {
      // For now, we only have the classic map
      if (mapId === 'classic') {
        // This would typically be a dynamic import, but for now we'll rely on the GameBoard component
        // loading the map directly from the import
        return null;
      } else {
        console.error(`Map ID '${mapId}' not found`);
        return null;
      }
    } catch (error) {
      console.error(`Error loading map data for '${mapId}':`, error);
      return null;
    }
  }

  /**
   * Create player objects
   * @returns {Player[]} Array of player objects
   */
  createPlayers() {
    const colors = ['red', 'blue', 'green', 'yellow', 'black', 'purple'];
    const players = [];
    
    // Create human player
    players.push(new Player('p1', 'Player 1', colors[0]));
    
    // Create AI players
    for (let i = 0; i < this.config.aiPlayers; i++) {
      players.push(new Player(`ai${i+1}`, `AI Player ${i+1}`, colors[i+1]));
    }
    
    return players;
  }

  /**
   * Create territory objects based on map data
   * @returns {Territory[]} Array of territory objects
   */
  createTerritories() {
    // Create territory objects from the map data
    // Using the imported classicMap from the top of the file
    const territories = classicMap.territories.map(territoryData => {
      return new Territory(
        territoryData.id,
        territoryData.name,
        territoryData.adjacent,
        territoryData.continent,
        territoryData.resources || {}
      );
    });
    
    return territories;
  }

  /**
   * Create continent objects based on map data
   * @returns {Continent[]} Array of continent objects
   */
  createContinents() {
    // Create continent objects from the map data
    // Using the imported classicMap from the top of the file
    const continents = classicMap.continents.map(continentData => {
      // Find all territories that belong to this continent
      const continentTerritories = classicMap.territories
        .filter(t => t.continent === continentData.id)
        .map(t => t.id);
      
      return new Continent(
        continentData.id,
        continentData.name,
        continentTerritories,
        continentData.bonusArmies
      );
    });
    
    return continents;
  }

  /**
   * Create the deck of territory cards
   * @param {Territory[]} territories - List of territories
   * @returns {Card[]} Deck of cards
   */
  createCardDeck(territories) {
    const cards = [];
    const types = ['infantry', 'cavalry', 'artillery'];
    
    // Create territory cards
    territories.forEach((territory, index) => {
      const type = types[index % 3];
      cards.push(new Card(`card-${territory.id}`, type, territory.id));
    });
    
    // Add wild cards
    cards.push(new Card('wild-1', 'wild'));
    cards.push(new Card('wild-2', 'wild'));
    
    // Shuffle the deck
    return this.shuffleArray([...cards]);
  }

  /**
   * Randomly distribute territories among players
   */
  distributeInitialTerritories() {
    // Create a copy of the territories array
    const territories = [...this.gameState.territories];
    
    // Shuffle the territories
    this.shuffleArray(territories);
    
    // Distribute territories evenly among players
    const players = this.gameState.players;
    territories.forEach((territory, index) => {
      const playerIndex = index % players.length;
      const player = players[playerIndex];
      
      // Update territory
      territory.occupyingPlayer = player.id;
      territory.armies.infantry = 1;
      
      // Update player
      player.territories.push(territory.id);
    });
  }

  /**
   * Place initial armies on territories
   */
  placeInitialArmies() {
    // Calculate initial armies per player
    const playerCount = this.gameState.players.length;
    let armiesPerPlayer;
    
    switch (playerCount) {
      case 2:
        armiesPerPlayer = 40;
        break;
      case 3:
        armiesPerPlayer = 35;
        break;
      case 4:
        armiesPerPlayer = 30;
        break;
      case 5:
        armiesPerPlayer = 25;
        break;
      case 6:
        armiesPerPlayer = 20;
        break;
      default:
        armiesPerPlayer = 30;
    }
    
    // Subtract the armies already placed during territory distribution
    armiesPerPlayer -= this.gameState.players[0].territories.length;
    
    // Assign remaining armies to each player
    // (in a real implementation, this would be done interactively)
    for (const player of this.gameState.players) {
      let remainingArmies = armiesPerPlayer;
      
      // Distribute armies evenly across player's territories
      const territoriesPerPlayer = player.territories.length;
      const baseArmiesPerTerritory = Math.floor(remainingArmies / territoriesPerPlayer);
      let extraArmies = remainingArmies % territoriesPerPlayer;
      
      for (const territoryId of player.territories) {
        const territory = this.gameState.territories.find(t => t.id === territoryId);
        const extraForThisTerritory = extraArmies > 0 ? 1 : 0;
        
        territory.armies.infantry += baseArmiesPerTerritory + extraForThisTerritory;
        extraArmies--;
      }
    }
  }

  /**
   * Process a player's reinforcement phase
   * @param {string} playerId - ID of the player
   * @param {Object} reinforcements - Map of territory IDs to army counts
   * @returns {boolean} True if successful
   */
  processReinforcement(playerId, reinforcements) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) return false;
    
    // Verify it's the player's turn and the reinforcement phase
    let isCurrentPlayer = false;
    
    // Check if getCurrentPlayer is a function
    if (typeof this.gameState.getCurrentPlayer === 'function') {
      isCurrentPlayer = this.gameState.getCurrentPlayer().id === playerId;
    } else if (this.gameState.currentPlayerIndex !== undefined) {
      // Use the current player index directly
      isCurrentPlayer = this.gameState.players[this.gameState.currentPlayerIndex].id === playerId;
    }
    
    if (!isCurrentPlayer || this.gameState.phase !== 'reinforcement') {
      return false;
    }
    
    // Calculate allowed reinforcements
    const allowedReinforcements = player.getReinforcementArmies(
      this.gameState.continents,
      this.gameState.territories
    );
    
    // Verify the total reinforcements don't exceed the allowed amount
    const totalReinforcements = Object.values(reinforcements).reduce(
      (sum, count) => sum + count, 0
    );
    
    if (totalReinforcements > allowedReinforcements) {
      return false;
    }
    
    // Apply reinforcements
    for (const [territoryId, count] of Object.entries(reinforcements)) {
      const territory = this.gameState.territories.find(t => t.id === territoryId);
      
      // Verify the player owns the territory
      if (!territory || territory.occupyingPlayer !== playerId) {
        return false;
      }
      
      territory.armies.infantry += count;
    }
    
    // Advance to the next phase
    this.gameState.nextPhase();
    return true;
  }

  /**
   * Process a player's attack
   * @param {string} playerId - ID of the attacking player
   * @param {string} fromTerritoryId - ID of the attacking territory
   * @param {string} toTerritoryId - ID of the defending territory
   * @param {number} attackDice - Number of dice to use (1-3)
   * @returns {Object} Attack result with dice rolls and outcome
   */
  processAttack(playerId, fromTerritoryId, toTerritoryId, attackDice) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: 'Invalid player' };
    
    // Verify it's the player's turn and the attack phase
    let isCurrentPlayer = false;
    
    // Check if getCurrentPlayer is a function on this.gameState
    if (typeof this.gameState.getCurrentPlayer === 'function') {
      isCurrentPlayer = this.gameState.getCurrentPlayer().id === playerId;
    } else if (this.gameState.currentPlayerIndex !== undefined) {
      // Use the current player index directly
      isCurrentPlayer = this.gameState.players[this.gameState.currentPlayerIndex].id === playerId;
    }
    
    // Debug logging to identify the issue
    console.log('Attack validation in game-engine.js:', {
      playerId,
      currentPhase: this.gameState.phase,
      isCurrentPlayer,
      expectedPlayer: this.gameState.players[this.gameState.currentPlayerIndex]?.id
    });
    
    if (!isCurrentPlayer) {
      return { success: false, error: 'Not your turn' };
    }
    
    if (this.gameState.phase !== 'attack') {
      return { success: false, error: 'Not in attack phase' };
    }
    
    const fromTerritory = this.gameState.territories.find(t => t.id === fromTerritoryId);
    const toTerritory = this.gameState.territories.find(t => t.id === toTerritoryId);
    
    // Verify territories exist
    if (!fromTerritory || !toTerritory) {
      return { success: false, error: 'Invalid territory' };
    }
    
    // Verify the player owns the attacking territory
    if (fromTerritory.occupyingPlayer !== playerId) {
      return { success: false, error: 'You do not control the attacking territory' };
    }
    
    // Verify the player doesn't own the defending territory
    if (toTerritory.occupyingPlayer === playerId) {
      return { success: false, error: 'You cannot attack your own territory' };
    }
    
    // Verify the territories are adjacent
    if (!fromTerritory.isAdjacentTo(toTerritoryId)) {
      return { success: false, error: 'Territories are not adjacent' };
    }
    
    // Verify the attacking territory has enough armies
    if (fromTerritory.getTotalArmies() < 2) {
      return { success: false, error: 'Need at least 2 armies to attack' };
    }
    
    // Verify the attack dice count
    if (attackDice < 1 || attackDice > 3) {
      return { success: false, error: 'Invalid attack dice count' };
    }
    
    // Verify the attacking territory has enough armies for the dice count
    if (fromTerritory.getTotalArmies() <= attackDice) {
      return { success: false, error: 'Not enough armies for selected dice count' };
    }
    
    // Determine defense dice count (1 or 2)
    const defenseDice = Math.min(2, toTerritory.getTotalArmies());
    
    // Roll the dice
    const attackRolls = this.rollDice(attackDice);
    const defenseRolls = this.rollDice(defenseDice);
    
    // Sort dice in descending order
    attackRolls.sort((a, b) => b - a);
    defenseRolls.sort((a, b) => b - a);
    
    // Compare dice and determine casualties
    const maxComparisons = Math.min(attackRolls.length, defenseRolls.length);
    let attackerLosses = 0;
    let defenderLosses = 0;
    
    for (let i = 0; i < maxComparisons; i++) {
      if (attackRolls[i] > defenseRolls[i]) {
        defenderLosses++;
      } else {
        attackerLosses++;
      }
    }
    
    // Apply casualties to different unit types in order: infantry, cavalry, artillery
    // Attacker casualties
    let remainingAttackerLosses = attackerLosses;
    
    // Remove infantry first
    const infantryLosses = Math.min(fromTerritory.armies.infantry, remainingAttackerLosses);
    fromTerritory.armies.infantry -= infantryLosses;
    remainingAttackerLosses -= infantryLosses;
    
    // Remove cavalry if needed
    if (remainingAttackerLosses > 0) {
      const cavalryLosses = Math.min(fromTerritory.armies.cavalry, remainingAttackerLosses);
      fromTerritory.armies.cavalry -= cavalryLosses;
      remainingAttackerLosses -= cavalryLosses;
    }
    
    // Remove artillery if needed
    if (remainingAttackerLosses > 0) {
      const artilleryLosses = Math.min(fromTerritory.armies.artillery, remainingAttackerLosses);
      fromTerritory.armies.artillery -= artilleryLosses;
      remainingAttackerLosses -= artilleryLosses;
    }
    
    // Defender casualties
    let remainingDefenderLosses = defenderLosses;
    
    // Remove infantry first
    const defInfantryLosses = Math.min(toTerritory.armies.infantry, remainingDefenderLosses);
    toTerritory.armies.infantry -= defInfantryLosses;
    remainingDefenderLosses -= defInfantryLosses;
    
    // Remove cavalry if needed
    if (remainingDefenderLosses > 0) {
      const defCavalryLosses = Math.min(toTerritory.armies.cavalry, remainingDefenderLosses);
      toTerritory.armies.cavalry -= defCavalryLosses;
      remainingDefenderLosses -= defCavalryLosses;
    }
    
    // Remove artillery if needed
    if (remainingDefenderLosses > 0) {
      const defArtilleryLosses = Math.min(toTerritory.armies.artillery, remainingDefenderLosses);
      toTerritory.armies.artillery -= defArtilleryLosses;
      remainingDefenderLosses -= defArtilleryLosses;
    }
    
    // Check if defender is defeated
    let territoryConquered = false;
    if (toTerritory.getTotalArmies() === 0) {
      territoryConquered = true;
      
      // Instead of automatically moving troops, we'll mark this as pending for the player to decide
      // how many armies to move
      this.gameState.pendingConquest = {
        fromTerritoryId,
        toTerritoryId,
        minArmies: attackDice,
        maxArmies: fromTerritory.getTotalArmies() - 1,
        defenderId: toTerritory.occupyingPlayer
      };
      
      // Flag that a card should be awarded at the end of the attack phase
      // Only awarded once per turn for conquering at least one territory
      if (!this.gameState.cardAwarded) {
        this.gameState.cardAwarded = true;
      }
    }
    
    return {
      success: true,
      attackRolls,
      defenseRolls,
      attackerLosses,
      defenderLosses,
      territoryConquered
    };
  }

  /**
   * Complete a territory conquest by moving armies
   * @param {string} playerId - ID of the conquering player
   * @param {number} armyCount - Number of armies to move
   * @returns {Object} Result of the conquest completion
   */
  completeConquest(playerId, armyCount) {
    // Verify we have a pending conquest
    if (!this.gameState.pendingConquest) {
      return { success: false, error: 'No pending conquest' };
    }
    
    // Get the pending conquest data
    const {
      fromTerritoryId, 
      toTerritoryId, 
      minArmies, 
      maxArmies,
      defenderId
    } = this.gameState.pendingConquest;
    
    // Verify this is the conquering player
    if (playerId !== this.gameState.players[this.gameState.currentPlayerIndex].id) {
      return { success: false, error: 'Not your conquest' };
    }
    
    // Verify the army count is valid
    if (armyCount < minArmies || armyCount > maxArmies) {
      return { 
        success: false, 
        error: `Army count must be between ${minArmies} and ${maxArmies}`,
        minArmies,
        maxArmies
      };
    }
    
    // Get the territories and players
    const player = this.gameState.players.find(p => p.id === playerId);
    const defender = this.gameState.players.find(p => p.id === defenderId);
    const fromTerritory = this.gameState.territories.find(t => t.id === fromTerritoryId);
    const toTerritory = this.gameState.territories.find(t => t.id === toTerritoryId);
    
    // Update territory ownership
    toTerritory.occupyingPlayer = playerId;
    toTerritory.armies.infantry = armyCount;
    fromTerritory.armies.infantry -= armyCount;
    
    // Update player territory lists
    player.territories.push(toTerritoryId);
    defender.territories = defender.territories.filter(id => id !== toTerritoryId);
    
    // Check if defender is eliminated
    if (defender.territories.length === 0) {
      defender.eliminated = true;
      
      // Transfer defender's cards to attacker
      player.cards = player.cards.concat(defender.cards);
      defender.cards = [];
      
      // Check if game is over
      if (typeof this.gameState.checkGameEnd === 'function') {
        this.gameState.checkGameEnd();
      } else if (typeof this.gameState.checkVictoryConditions === 'function') {
        this.gameState.checkVictoryConditions();
      }
    }
    
    // Clear the pending conquest
    this.gameState.pendingConquest = null;
    
    return { 
      success: true, 
      message: `Moved ${armyCount} armies to ${toTerritory.name}`,
      conqueredTerritoryName: toTerritory.name,
      defenderEliminated: defender.eliminated
    };
  }

  /**
   * Process a player's fortification
   * @param {string} playerId - ID of the player
   * @param {string} fromTerritoryId - ID of the source territory
   * @param {string} toTerritoryId - ID of the destination territory
   * @param {number} armyCount - Number of armies to move
   * @returns {boolean} True if successful
   */
  processFortification(playerId, fromTerritoryId, toTerritoryId, armyCount) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) return false;
    
    // Verify it's the player's turn and the fortification phase
    let isCurrentPlayer = false;
    
    // Check if getCurrentPlayer is a function
    if (typeof this.gameState.getCurrentPlayer === 'function') {
      isCurrentPlayer = this.gameState.getCurrentPlayer().id === playerId;
    } else if (this.gameState.currentPlayerIndex !== undefined) {
      // Use the current player index directly
      isCurrentPlayer = this.gameState.players[this.gameState.currentPlayerIndex].id === playerId;
    }
    
    if (!isCurrentPlayer || this.gameState.phase !== 'fortification') {
      return false;
    }
    
    const fromTerritory = this.gameState.territories.find(t => t.id === fromTerritoryId);
    const toTerritory = this.gameState.territories.find(t => t.id === toTerritoryId);
    
    // Verify territories exist
    if (!fromTerritory || !toTerritory) {
      return false;
    }
    
    // Verify the player owns both territories
    if (fromTerritory.occupyingPlayer !== playerId || 
        toTerritory.occupyingPlayer !== playerId) {
      return false;
    }
    
    // Check movement range based on events
    let movementRange = 1;
    if (this.gameState.eventsManager) {
      const movementMod = this.gameState.eventsManager.getMovementModifiers(playerId);
      movementRange += movementMod;
    }
    
    // Check if technology gives movement bonuses - e.g. improved-logistics
    if (player.technologies && player.technologies.includes('improved-logistics')) {
      movementRange += 1;
    }
    
    // Verify the territories are within movement range
    if (movementRange === 1) {
      // Default behavior - territories must be adjacent
      if (!fromTerritory.isAdjacentTo(toTerritoryId)) {
        return false;
      }
    } else {
      // Enhanced movement range - would need a path finding algorithm in a real implementation
      // For now, we'll simplify and just allow movement between any owned territories
      // A better implementation would check for connected paths up to the movement range
    }
    
    // Verify the source territory has enough armies
    if (fromTerritory.getTotalArmies() <= armyCount) {
      return false;
    }
    
    // Move the armies, handling different unit types
    let remainingToMove = armyCount;
    
    // Move infantry first
    const infantryToMove = Math.min(fromTerritory.armies.infantry, remainingToMove);
    if (infantryToMove > 0) {
      fromTerritory.armies.infantry -= infantryToMove;
      toTerritory.armies.infantry += infantryToMove;
      remainingToMove -= infantryToMove;
    }
    
    // Move cavalry if needed and available
    if (remainingToMove > 0) {
      const cavalryToMove = Math.min(fromTerritory.armies.cavalry, Math.ceil(remainingToMove / 3));
      if (cavalryToMove > 0) {
        fromTerritory.armies.cavalry -= cavalryToMove;
        toTerritory.armies.cavalry += cavalryToMove;
        remainingToMove -= cavalryToMove * 3;
      }
    }
    
    // Move artillery if needed and available
    if (remainingToMove > 0) {
      const artilleryToMove = Math.min(fromTerritory.armies.artillery, Math.ceil(remainingToMove / 5));
      if (artilleryToMove > 0) {
        fromTerritory.armies.artillery -= artilleryToMove;
        toTerritory.armies.artillery += artilleryToMove;
        remainingToMove -= artilleryToMove * 5;
      }
    }
    
    // Advance to the next phase/player
    this.gameState.nextPhase();
    return true;
  }

  /**
   * Roll dice and return the results
   * @param {number} count - Number of dice to roll
   * @returns {number[]} Array of dice roll results
   */
  rollDice(count) {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(Math.floor(Math.random() * 6) + 1);
    }
    return results;
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm
   * @param {Array} array - The array to shuffle
   * @returns {Array} The shuffled array
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export default GameEngine;
