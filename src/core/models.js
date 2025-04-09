/**
 * Core game models for Risk-inspired strategy game
 */

/**
 * Represents a territory on the game board
 */
class Territory {
  /**
   * Create a new Territory
   * @param {string} id - Unique identifier for the territory
   * @param {string} name - Display name of the territory
   * @param {string[]} adjacentTerritories - IDs of connected territories
   * @param {string} continent - The continent this territory belongs to
   * @param {Object} resources - Resources provided by this territory
   */
  constructor(id, name, adjacentTerritories, continent, resources = {}) {
    this.id = id;
    this.name = name;
    this.adjacentTerritories = adjacentTerritories;
    this.continent = continent;
    this.occupyingPlayer = null;
    this.armies = {
      infantry: 0,
      cavalry: 0,
      artillery: 0
    };
    this.resources = resources;
    this.features = {
      hasResearchCenter: false,
      hasCapital: false,
      hasPort: false
    };
  }

  /**
   * Get the total number of armies in this territory
   * @returns {number} Total army count
   */
  getTotalArmies() {
    return this.armies.infantry + (this.armies.cavalry * 3) + (this.armies.artillery * 5);
  }

  /**
   * Check if this territory is adjacent to another
   * @param {string} territoryId - The territory ID to check
   * @returns {boolean} True if territories are adjacent
   */
  isAdjacentTo(territoryId) {
    return this.adjacentTerritories.includes(territoryId);
  }
}

/**
 * Represents a continent on the game board
 */
class Continent {
  /**
   * Create a new Continent
   * @param {string} id - Unique identifier for the continent
   * @param {string} name - Display name of the continent
   * @param {string[]} territories - IDs of territories in this continent
   * @param {number} bonusArmies - Number of bonus armies for controlling the continent
   */
  constructor(id, name, territories, bonusArmies) {
    this.id = id;
    this.name = name;
    this.territories = territories;
    this.bonusArmies = bonusArmies;
  }
}

/**
 * Represents a player in the game
 */
class Player {
  /**
   * Create a new Player
   * @param {string} id - Unique identifier for the player
   * @param {string} name - Display name of the player
   * @param {string} color - Player color
   */
  constructor(id, name, color) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.territories = [];
    this.cards = [];
    this.resources = {
      food: 0,
      production: 0,
      research: 0,
      wealth: 0
    };
    this.technologies = [];
    this.allies = [];
    this.eliminated = false;
  }

  /**
   * Calculate the number of reinforcement armies this player receives
   * @param {Continent[]} continents - List of all continents
   * @param {Territory[]} territories - List of all territories
   * @returns {number} Number of reinforcement armies
   */
  getReinforcementArmies(continents, territories) {
    // Base reinforcements from territory count
    let armies = Math.max(3, Math.floor(this.territories.length / 3));
    
    // Add continent bonuses
    for (const continent of continents) {
      const continentTerritories = continent.territories;
      const playerOwnsAll = continentTerritories.every(terrId => 
        this.territories.includes(terrId)
      );
      
      if (playerOwnsAll) {
        armies += continent.bonusArmies;
      }
    }
    
    // Add resource bonuses (to be implemented)
    // TODO: Implement resource-based reinforcements
    
    return armies;
  }
}

/**
 * Represents a card that can be traded for armies
 */
class Card {
  /**
   * Create a new Card
   * @param {string} id - Unique identifier for the card
   * @param {string} type - Card type (infantry, cavalry, artillery, wild)
   * @param {string|null} territoryId - Associated territory ID (null for wild cards)
   */
  constructor(id, type, territoryId = null) {
    this.id = id;
    this.type = type;
    this.territoryId = territoryId;
  }
}

/**
 * Represents a technology that can be researched
 */
class Technology {
  /**
   * Create a new Technology
   * @param {string} id - Unique identifier for the technology
   * @param {string} name - Display name of the technology
   * @param {string} description - Description of the technology's effects
   * @param {string} category - Category of the technology (military, economic, diplomatic)
   * @param {string[]} prerequisites - IDs of prerequisite technologies
   * @param {number} cost - Research cost in research points
   * @param {Function} effect - Function that applies the technology's effects
   */
  constructor(id, name, description, category, prerequisites, cost, effect) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.category = category;
    this.prerequisites = prerequisites;
    this.cost = cost;
    this.effect = effect;
  }
}

/**
 * Represents the complete game state
 */
class GameState {
  /**
   * Create a new GameState
   * @param {Object} config - Game configuration
   * @param {Player[]} players - List of players
   * @param {Territory[]} territories - List of territories
   * @param {Continent[]} continents - List of continents
   * @param {Card[]} cardDeck - Deck of territory cards
   */
  constructor(config = {}, players, territories, continents, cardDeck) {
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
    
    this.players = players;
    this.territories = territories;
    this.continents = continents;
    this.cardDeck = cardDeck;
    this.discardPile = [];
    this.currentPlayerIndex = 0;
    this.phase = 'reinforcement'; // reinforcement, attack, fortification
    this.turn = 1;
    this.gameOver = false;
    this.winner = null;
    this.eventLog = [];
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
    
    // If we've completed a full round of turns, increment the turn counter
    if (this.currentPlayerIndex === 0) {
      this.turn++;
    }
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
    
    return continent.territories.every(terrId => 
      player.territories.includes(terrId)
    );
  }

  /**
   * Check if the game has ended
   * @returns {boolean} True if the game is over
   */
  checkGameEnd() {
    // Check for military victory (one player remaining)
    const activePlayers = this.players.filter(p => !p.eliminated);
    if (activePlayers.length === 1) {
      this.gameOver = true;
      this.winner = activePlayers[0];
      return true;
    }
    
    // TODO: Implement other victory conditions
    
    return false;
  }
}

// Export the models
export {
  Territory,
  Continent,
  Player,
  Card,
  Technology,
  GameState
};
