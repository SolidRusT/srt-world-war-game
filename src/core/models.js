/**
 * Core game models for Risk-inspired strategy game
 */

// Import managers for deserialization
import TechManager from './tech-manager.js';
import ResourceManager from './resource-manager.js';

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
    this.activeEvents = [];
    this.cardAwarded = false; // Flag to track if a card should be awarded at the end of the attack phase
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
        // Reset the card awarded flag at the start of the attack phase
        this.cardAwarded = false;
        break;
      case 'attack':
        this.phase = 'fortification';
        break;
      case 'fortification':
        this.phase = 'reinforcement';
        this.nextPlayer();
        // Calculate and apply resource production for the next player if resources are enabled
        if (this.config.enableResources) {
          this.calculateResourceProduction();
        }
        break;
    }
  }
  
  /**
   * Calculate and apply resource production for the current player
   */
  calculateResourceProduction() {
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.eliminated) return;
    
    // Reset resource production
    const baseProduction = {
      food: 0,
      production: 0,
      research: 0,
      wealth: 0
    };
    
    // Add resources from territories
    for (const territoryId of currentPlayer.territories) {
      const territory = this.territories.find(t => t.id === territoryId);
      if (!territory) continue;
      
      // Add base resource production
      Object.entries(territory.resources || {}).forEach(([resource, amount]) => {
        if (baseProduction[resource] !== undefined) {
          baseProduction[resource] += amount;
        }
      });
      
      // Add bonus production from special features
      if (territory.features.hasResearchCenter && baseProduction.research !== undefined) {
        baseProduction.research += 1;
      }
      
      if (territory.features.hasPort && baseProduction.wealth !== undefined) {
        baseProduction.wealth += 1;
      }
    }
    
    // Apply technology bonuses if applicable
    // (This would be implemented in a full tech system)
    
    // Update the player's resources
    Object.entries(baseProduction).forEach(([resource, amount]) => {
      currentPlayer.resources[resource] += amount;
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
      this.victoryType = 'military';
      return true;
    }
    
    // Check for other victory conditions
    return this.checkVictoryConditions();
  }
  
  /**
   * Check for non-military victory conditions
   * @returns {boolean} True if a player has achieved victory
   */
  checkVictoryConditions() {
    // Skip if victory conditions are not enabled
    if (!this.config.victoryConditions || this.config.victoryConditions.length === 0) {
      return false;
    }
    
    // Check each enabled victory condition
    for (const victoryType of this.config.victoryConditions) {
      switch (victoryType) {
        case 'economic':
          // Economic victory: Control majority of wealth-producing territories for 3 consecutive turns
          for (const player of this.players) {
            if (player.eliminated) continue;
            
            // Initialize victory progress if not set
            if (!player.victoryProgress) player.victoryProgress = {};
            if (!player.victoryProgress.economic) player.victoryProgress.economic = { count: 0 };
            
            // Count wealth-producing territories
            const wealthTerritories = this.territories.filter(t => 
              t.resources && t.resources.wealth && t.resources.wealth > 0
            );
            
            const playerWealthTerritories = wealthTerritories.filter(t => 
              t.occupyingPlayer === player.id
            );
            
            // Check if player controls majority of wealth territories
            if (playerWealthTerritories.length > wealthTerritories.length / 2) {
              player.victoryProgress.economic.count++;
              
              // Check if victory condition is met (3 consecutive turns)
              if (player.victoryProgress.economic.count >= 3) {
                this.gameOver = true;
                this.winner = player;
                this.victoryType = 'economic';
                return true;
              }
            } else {
              // Reset counter if condition not met
              player.victoryProgress.economic.count = 0;
            }
          }
          break;
          
        case 'technological':
          // Technological victory: Complete the final technology in the research tree
          for (const player of this.players) {
            if (player.eliminated) continue;
            
            // Check if player has researched the final technology
            const hasTechSupremacy = player.technologies.includes('technological-supremacy');
            
            if (hasTechSupremacy) {
              this.gameOver = true;
              this.winner = player;
              this.victoryType = 'technological';
              return true;
            }
          }
          break;
          
        case 'diplomatic':
          // Diplomatic victory: Form alliances with majority of players for 3 consecutive turns
          for (const player of this.players) {
            if (player.eliminated) continue;
            
            // Initialize victory progress if not set
            if (!player.victoryProgress) player.victoryProgress = {};
            if (!player.victoryProgress.diplomatic) player.victoryProgress.diplomatic = { count: 0 };
            
            // Count active players and allies
            const activePlayers = this.players.filter(p => !p.eliminated);
            const allies = player.allies ? player.allies.filter(allyId => 
              this.players.some(p => p.id === allyId && !p.eliminated)
            ) : [];
            
            // Check if player has alliances with majority of other players
            if (allies.length >= (activePlayers.length - 1) / 2) {
              player.victoryProgress.diplomatic.count++;
              
              // Check if victory condition is met (3 consecutive turns)
              if (player.victoryProgress.diplomatic.count >= 3) {
                this.gameOver = true;
                this.winner = player;
                this.victoryType = 'diplomatic';
                return true;
              }
            } else {
              // Reset counter if condition not met
              player.victoryProgress.diplomatic.count = 0;
            }
          }
          break;
          
        // Add other victory conditions as needed
      }
    }
    
    return false;
  }
  
  /**
   * Serialize the game state for saving
   * @returns {Object} Serialized game state
   */
  serialize() {
    // Create a simplified object that can be serialized to JSON
    return {
      config: this.config,
      players: this.players.map(player => ({
        id: player.id,
        name: player.name,
        color: player.color,
        territories: player.territories,
        cards: player.cards,
        resources: player.resources,
        technologies: player.technologies,
        allies: player.allies,
        eliminated: player.eliminated,
        victoryProgress: player.victoryProgress
      })),
      territories: this.territories.map(territory => ({
        id: territory.id,
        name: territory.name,
        adjacentTerritories: territory.adjacentTerritories,
        continent: territory.continent,
        occupyingPlayer: territory.occupyingPlayer,
        armies: territory.armies,
        resources: territory.resources,
        features: territory.features
      })),
      continents: this.continents.map(continent => ({
        id: continent.id,
        name: continent.name,
        territories: continent.territories,
        bonusArmies: continent.bonusArmies
      })),
      cardDeck: this.cardDeck,
      discardPile: this.discardPile,
      currentPlayerIndex: this.currentPlayerIndex,
      phase: this.phase,
      turn: this.turn,
      gameOver: this.gameOver,
      winner: this.winner ? this.winner.id : null,
      victoryType: this.victoryType,
      eventLog: this.eventLog,
      activeEvents: this.activeEvents,
      cardAwarded: this.cardAwarded
    };
  }
  
  /**
   * Deserialize and create a new GameState from saved data
   * @param {Object} data - Serialized game state
   * @returns {GameState} New game state object
   */
  static deserialize(data) {
    // Create a new GameState instance
    const gameState = new GameState(data.config, [], [], [], []);
    
    // Reconstruct players
    gameState.players = data.players.map(playerData => {
      const player = new Player(playerData.id, playerData.name, playerData.color);
      player.territories = playerData.territories || [];
      player.cards = playerData.cards || [];
      player.resources = playerData.resources || {
        food: 0, production: 0, research: 0, wealth: 0
      };
      player.technologies = playerData.technologies || [];
      player.allies = playerData.allies || [];
      player.eliminated = playerData.eliminated || false;
      player.victoryProgress = playerData.victoryProgress || {};
      return player;
    });
    
    // Reconstruct territories
    gameState.territories = data.territories.map(territoryData => {
      const territory = new Territory(
        territoryData.id,
        territoryData.name,
        territoryData.adjacentTerritories,
        territoryData.continent,
        territoryData.resources
      );
      territory.occupyingPlayer = territoryData.occupyingPlayer;
      territory.armies = territoryData.armies;
      territory.features = territoryData.features;
      return territory;
    });
    
    // Reconstruct continents
    gameState.continents = data.continents.map(continentData => {
      return new Continent(
        continentData.id,
        continentData.name,
        continentData.territories,
        continentData.bonusArmies
      );
    });
    
    // Set remaining properties
    gameState.cardDeck = data.cardDeck || [];
    gameState.discardPile = data.discardPile || [];
    gameState.currentPlayerIndex = data.currentPlayerIndex;
    gameState.phase = data.phase;
    gameState.turn = data.turn;
    gameState.gameOver = data.gameOver;
    gameState.cardAwarded = data.cardAwarded || false;
    gameState.eventLog = data.eventLog || [];
    gameState.activeEvents = data.activeEvents || [];
    gameState.victoryType = data.victoryType;
    
    // Set winner reference if there is one
    if (data.winner) {
      gameState.winner = gameState.players.find(p => p.id === data.winner);
    }
    
    // Recreate the tech manager if technologies are enabled
    if (gameState.config.enableTechnologies) {
      gameState.techManager = new TechManager(gameState);
    }
    
    // Recreate the resource manager if resources are enabled
    if (gameState.config.enableResources) {
      gameState.resourceManager = new ResourceManager(gameState);
    }
    
    return gameState;
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
