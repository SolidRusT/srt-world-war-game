/**
 * AI Player implementation for Risk-inspired strategy game
 */

/**
 * Base AI player for the game
 */
class AIPlayer {
  /**
   * Create a new AIPlayer
   * @param {string} playerId - ID of the AI player
   * @param {string} difficulty - Difficulty level (easy, medium, hard)
   */
  constructor(playerId, difficulty = 'medium') {
    this.playerId = playerId;
    this.difficulty = difficulty;
    
    // Memory of past turns and state
    this.memory = {
      attackedBy: {}, // Keeps track of players who attacked this AI
      territoryHistory: [], // Territory counts over time
      successfulAttacks: {}, // Track success rates against different players
      targetValue: {} // Value assigned to different territories
    };
  }

  /**
   * Perform the AI player's turn
   * @param {GameState} gameState - Current game state
   * @returns {Object} Actions taken during the turn
   */
  performTurn(gameState) {
    const actions = {
      reinforcement: [],
      attacks: [],
      fortification: null
    };
    
    // Update AI memory with current game state
    this.updateMemory(gameState);
    
    // Reinforcement phase
    if (gameState.phase === 'reinforcement') {
      actions.reinforcement = this.performReinforcement(gameState);
    }
    
    // Attack phase
    if (gameState.phase === 'attack') {
      actions.attacks = this.performAttacks(gameState);
    }
    
    // Fortification phase
    if (gameState.phase === 'fortification') {
      actions.fortification = this.performFortification(gameState);
    }
    
    return actions;
  }

  /**
   * Update AI memory with new game state
   * @param {GameState} gameState - Current game state
   */
  updateMemory(gameState) {
    const player = gameState.players.find(p => p.id === this.playerId);
    if (!player) return;
    
    // Update territory history
    this.memory.territoryHistory.push({
      turn: gameState.turn,
      count: player.territories.length
    });
    
    // Keep only the last 10 turns
    if (this.memory.territoryHistory.length > 10) {
      this.memory.territoryHistory.shift();
    }
    
    // Update territory values
    this.updateTerritoryValues(gameState);
    
    // Check recent attacks against this player
    const recentAttacks = gameState.eventLog
      .filter(event => 
        event.type === 'attack' && 
        event.defendingPlayerId === this.playerId && 
        event.turn >= gameState.turn - 3
      );
    
    // Update memory of players who attacked this AI
    for (const attack of recentAttacks) {
      if (!this.memory.attackedBy[attack.attackingPlayerId]) {
        this.memory.attackedBy[attack.attackingPlayerId] = 0;
      }
      this.memory.attackedBy[attack.attackingPlayerId]++;
    }
  }

  /**
   * Update territory values for strategic decision making
   * @param {GameState} gameState - Current game state
   */
  updateTerritoryValues(gameState) {
    const player = gameState.players.find(p => p.id === this.playerId);
    if (!player) return;
    
    for (const territory of gameState.territories) {
      let value = 10; // Base value
      
      // Territories with more adjacent territories are more valuable (connectivity)
      const adjacentCount = territory.adjacentTerritories.length;
      value += adjacentCount * 2;
      
      // Territories in continents with fewer total territories are more valuable
      const continent = gameState.continents.find(c => c.id === territory.continent);
      if (continent) {
        // Smaller continents are easier to control
        const continentSize = continent.territories.length;
        value += (12 - continentSize) * 3;
        
        // Bonus for continent control value
        value += continent.bonusArmies * 5;
        
        // Check how many territories in this continent we already control
        const controlledInContinent = player.territories.filter(
          id => gameState.territories.find(t => t.id === id).continent === continent.id
        ).length;
        
        // If we control most of the continent, value completion highly
        if (controlledInContinent > continentSize / 2) {
          value += 20;
        }
      }
      
      // Territories with resources are more valuable
      if (territory.resources) {
        for (const [type, amount] of Object.entries(territory.resources)) {
          value += amount * 3;
          
          // Prioritize research in early game if technologies are enabled
          if (type === 'research' && gameState.turn < 5 && gameState.config.enableTechnologies) {
            value += 10;
          }
          
          // Prioritize wealth in mid-game
          if (type === 'wealth' && gameState.turn >= 5 && gameState.turn < 15) {
            value += 5;
          }
          
          // Prioritize production in late game
          if (type === 'production' && gameState.turn >= 15) {
            value += 8;
          }
        }
      }
      
      // Special features add value
      if (territory.features) {
        if (territory.features.hasResearchCenter) value += 15;
        if (territory.features.hasCapital) value += 10;
        if (territory.features.hasPort) value += 5;
      }
      
      this.memory.targetValue[territory.id] = value;
    }
  }

  /**
   * Perform the reinforcement phase
   * @param {GameState} gameState - Current game state
   * @returns {Array} Reinforcement actions
   */
  performReinforcement(gameState) {
    const player = gameState.players.find(p => p.id === this.playerId);
    if (!player) return [];
    
    // Get reinforcement count
    let reinforcements = 0;
    
    if (gameState.config.enableResources) {
      // Use resource manager for calculation
      const production = gameState.resourceManager.calculateResourceProduction(this.playerId);
      reinforcements = Math.max(3, Math.floor(player.territories.length / 3));
      
      // Add continent bonuses
      for (const continent of gameState.continents) {
        if (gameState.playerControlsContinent(this.playerId, continent.id)) {
          reinforcements += continent.bonusArmies;
        }
      }
    } else {
      // Standard RISK rules
      reinforcements = Math.max(3, Math.floor(player.territories.length / 3));
      
      // Add continent bonuses
      for (const continent of gameState.continents) {
        if (gameState.playerControlsContinent(this.playerId, continent.id)) {
          reinforcements += continent.bonusArmies;
        }
      }
    }
    
    // If no reinforcements, end phase
    if (reinforcements <= 0) {
      gameState.nextPhase();
      return [];
    }
    
    // Identify border territories (adjacent to enemy territories)
    const borderTerritories = player.territories.filter(id => {
      const territory = gameState.territories.find(t => t.id === id);
      return territory.adjacentTerritories.some(adjId => {
        const adjTerritory = gameState.territories.find(t => t.id === adjId);
        return adjTerritory.occupyingPlayer !== this.playerId;
      });
    });
    
    // Calculate priority for each border territory
    const territoryPriorities = borderTerritories.map(id => {
      const territory = gameState.territories.find(t => t.id === id);
      
      // Base priority on territory value
      let priority = this.memory.targetValue[id] || 10;
      
      // Prioritize territories with fewer armies
      priority -= territory.getTotalArmies() * 2;
      
      // Prioritize territories adjacent to weak enemy territories
      const attackOpportunities = territory.adjacentTerritories.filter(adjId => {
        const adjTerritory = gameState.territories.find(t => t.id === adjId);
        return (
          adjTerritory.occupyingPlayer !== this.playerId &&
          adjTerritory.getTotalArmies() < territory.getTotalArmies()
        );
      }).length;
      
      priority += attackOpportunities * 5;
      
      // Prioritize territories that are part of continents we're close to controlling
      const continent = gameState.continents.find(c => c.id === territory.continent);
      if (continent) {
        const controlledInContinent = player.territories.filter(
          terId => gameState.territories.find(t => t.id === terId).continent === continent.id
        ).length;
        
        if (controlledInContinent >= continent.territories.length - 2) {
          priority += 15;
        }
      }
      
      return { id, priority };
    });
    
    // Sort territories by priority (highest first)
    territoryPriorities.sort((a, b) => b.priority - a.priority);
    
    // Distribute reinforcements
    const reinforcementActions = [];
    let remainingReinforcements = reinforcements;
    
    // Distribute proportionally to priority, with more priority getting more reinforcements
    const totalPriority = territoryPriorities.reduce((sum, t) => sum + Math.max(1, t.priority), 0);
    
    for (const { id, priority } of territoryPriorities) {
      if (remainingReinforcements <= 0) break;
      
      // Calculate share based on priority
      const share = Math.max(1, Math.floor(
        (Math.max(1, priority) / totalPriority) * reinforcements
      ));
      
      const allocated = Math.min(share, remainingReinforcements);
      remainingReinforcements -= allocated;
      
      reinforcementActions.push({
        territoryId: id,
        armies: allocated
      });
    }
    
    // If there are still reinforcements left, add them to the highest priority territory
    if (remainingReinforcements > 0 && territoryPriorities.length > 0) {
      reinforcementActions[0].armies += remainingReinforcements;
    }
    
    // Process reinforcements
    for (const action of reinforcementActions) {
      // In a real implementation, this would call the game engine to place armies
      const territory = gameState.territories.find(t => t.id === action.territoryId);
      territory.armies.infantry += action.armies;
    }
    
    // Move to the next phase
    gameState.nextPhase();
    
    return reinforcementActions;
  }

  /**
   * Perform the attack phase
   * @param {GameState} gameState - Current game state
   * @returns {Array} Attack actions
   */
  performAttacks(gameState) {
    const player = gameState.players.find(p => p.id === this.playerId);
    if (!player) return [];
    
    const attacks = [];
    let continuingAttacks = true;
    const attackLimit = this.getAttackLimit(); // Limit based on difficulty
    
    // Continue attacking until we reach the limit or decide to stop
    while (continuingAttacks && attacks.length < attackLimit) {
      const attack = this.findBestAttack(gameState);
      
      if (!attack) {
        continuingAttacks = false;
        continue;
      }
      
      // Execute the attack
      const result = gameState.combatSystem.resolveAttack(
        attack.fromTerritoryId,
        attack.toTerritoryId,
        { attackDice: attack.attackDice }
      );
      
      attacks.push({
        ...attack,
        result: result.success ? result : { success: false }
      });
      
      // Update success rate metrics
      const defenderId = gameState.territories.find(t => t.id === attack.toTerritoryId)?.occupyingPlayer;
      if (defenderId) {
        if (!this.memory.successfulAttacks[defenderId]) {
          this.memory.successfulAttacks[defenderId] = { success: 0, total: 0 };
        }
        
        this.memory.successfulAttacks[defenderId].total++;
        
        if (result.success && result.territoryConquered) {
          this.memory.successfulAttacks[defenderId].success++;
        }
      }
      
      // Decide whether to continue attacking
      if (this.shouldContinueAttacking(gameState, attacks)) {
        continuingAttacks = true;
      } else {
        continuingAttacks = false;
      }
    }
    
    // Move to the next phase
    gameState.nextPhase();
    
    return attacks;
  }

  /**
   * Find the best attack opportunity
   * @param {GameState} gameState - Current game state
   * @returns {Object|null} Attack details or null if no good attack found
   */
  findBestAttack(gameState) {
    const player = gameState.players.find(p => p.id === this.playerId);
    if (!player) return null;
    
    // Find territories that can attack (have at least 2 armies)
    const attackingTerritories = player.territories
      .map(id => gameState.territories.find(t => t.id === id))
      .filter(t => t && t.getTotalArmies() >= 2);
    
    if (attackingTerritories.length === 0) return null;
    
    // Find all possible attacks
    const possibleAttacks = [];
    
    for (const territory of attackingTerritories) {
      // Find adjacent enemy territories
      const adjacentEnemies = territory.adjacentTerritories
        .map(id => gameState.territories.find(t => t.id === id))
        .filter(t => t && t.occupyingPlayer !== this.playerId);
      
      for (const enemyTerritory of adjacentEnemies) {
        // Calculate attack score
        const attackerArmies = territory.getTotalArmies();
        const defenderArmies = enemyTerritory.getTotalArmies();
        
        // Skip if clearly outmatched
        if (attackerArmies <= defenderArmies) continue;
        
        // Higher score = better attack opportunity
        let score = (attackerArmies - defenderArmies) * 5;
        
        // Add territory value
        score += this.memory.targetValue[enemyTerritory.id] || 10;
        
        // Bonus for attacking players who attacked us recently
        if (this.memory.attackedBy[enemyTerritory.occupyingPlayer]) {
          score += this.memory.attackedBy[enemyTerritory.occupyingPlayer] * 3;
        }
        
        // Bonus for completing a continent
        const continent = gameState.continents.find(c => c.id === enemyTerritory.continent);
        if (continent) {
          const continentTerritories = gameState.territories.filter(t => t.continent === continent.id);
          const ownedInContinent = continentTerritories.filter(t => t.occupyingPlayer === this.playerId).length;
          
          if (ownedInContinent >= continentTerritories.length - 3) {
            score += 20;
          }
        }
        
        // Determine attack dice count (1-3)
        const maxAttackDice = Math.min(3, attackerArmies - 1);
        
        possibleAttacks.push({
          fromTerritoryId: territory.id,
          toTerritoryId: enemyTerritory.id,
          attackerArmies,
          defenderArmies,
          attackDice: maxAttackDice,
          score
        });
      }
    }
    
    // If no valid attacks, return null
    if (possibleAttacks.length === 0) return null;
    
    // Sort by score and return the best attack
    possibleAttacks.sort((a, b) => b.score - a.score);
    return possibleAttacks[0];
  }

  /**
   * Determine if the AI should continue attacking
   * @param {GameState} gameState - Current game state
   * @param {Array} previousAttacks - Attacks made so far this turn
   * @returns {boolean} True if should continue attacking
   */
  shouldContinueAttacking(gameState, previousAttacks) {
    // Check recent attack success
    const recentAttacks = previousAttacks.slice(-3);
    
    // If last few attacks were unsuccessful, reduce aggression
    if (recentAttacks.length >= 3) {
      const successfulAttacks = recentAttacks.filter(a => 
        a.result && a.result.success && a.result.territoryConquered
      ).length;
      
      if (successfulAttacks === 0) return false;
    }
    
    // Base decision on difficulty and aggressiveness
    switch (this.difficulty) {
      case 'easy':
        // Easy AI is conservative - 40% chance to continue after each attack
        return Math.random() < 0.4;
      
      case 'medium':
        // Medium AI is moderate - 60% chance to continue after each attack
        return Math.random() < 0.6;
      
      case 'hard':
        // Hard AI is aggressive - 80% chance to continue after each attack
        return Math.random() < 0.8;
      
      default:
        return Math.random() < 0.5;
    }
  }

  /**
   * Get attack limit based on difficulty
   * @returns {number} Maximum number of attacks to make
   */
  getAttackLimit() {
    switch (this.difficulty) {
      case 'easy':
        return 3;
      case 'medium':
        return 6;
      case 'hard':
        return 10;
      default:
        return 5;
    }
  }

  /**
   * Perform the fortification phase
   * @param {GameState} gameState - Current game state
   * @returns {Object|null} Fortification action or null if no fortification made
   */
  performFortification(gameState) {
    const player = gameState.players.find(p => p.id === this.playerId);
    if (!player) return null;
    
    // Identify territories that can fortify (have at least 2 armies)
    const sourceTerritories = player.territories
      .map(id => gameState.territories.find(t => t.id === id))
      .filter(t => t && t.getTotalArmies() >= 2);
    
    if (sourceTerritories.length === 0) {
      gameState.nextPhase();
      return null;
    }
    
    // Identify interior territories (not bordering enemies)
    const interiorTerritories = sourceTerritories.filter(territory => {
      return !territory.adjacentTerritories.some(adjId => {
        const adjTerritory = gameState.territories.find(t => t.id === adjId);
        return adjTerritory.occupyingPlayer !== this.playerId;
      });
    });
    
    // Identify border territories (adjacent to enemy territories)
    const borderTerritories = player.territories
      .map(id => gameState.territories.find(t => t.id === id))
      .filter(t => {
        return t.adjacentTerritories.some(adjId => {
          const adjTerritory = gameState.territories.find(t => t.id === adjId);
          return adjTerritory.occupyingPlayer !== this.playerId;
        });
      });
    
    // Find the best fortification move
    let bestFortification = null;
    let bestScore = -1;
    
    // Consider moving from interior to border territories
    for (const source of interiorTerritories) {
      for (const target of borderTerritories) {
        // Skip if territories are not adjacent
        if (!source.isAdjacentTo(target.id) || source.id === target.id) continue;
        
        // Skip if source doesn't have enough armies to move
        if (source.getTotalArmies() <= 1) continue;
        
        // Calculate fortification value
        const targetValue = this.memory.targetValue[target.id] || 10;
        const enemyThreat = this.calculateEnemyThreat(gameState, target);
        
        // Higher score = better fortification
        const score = targetValue + enemyThreat * 2 - source.getTotalArmies();
        
        if (score > bestScore) {
          // Determine how many armies to move (leave 1 behind)
          const armiesToMove = Math.max(1, source.getTotalArmies() - 1);
          
          bestFortification = {
            fromTerritoryId: source.id,
            toTerritoryId: target.id,
            armies: armiesToMove
          };
          bestScore = score;
        }
      }
    }
    
    // If no good interior-to-border move found, try other fortifications
    if (!bestFortification) {
      // Find territories with excess armies that are not on critical borders
      const excessTerritories = sourceTerritories.filter(t => t.getTotalArmies() > 3);
      
      for (const source of excessTerritories) {
        for (const targetId of source.adjacentTerritories) {
          const target = gameState.territories.find(t => t.id === targetId);
          
          // Skip if target is not ours
          if (!target || target.occupyingPlayer !== this.playerId) continue;
          
          // Skip if territories are the same
          if (source.id === target.id) continue;
          
          // Calculate strategic value
          const targetValue = this.memory.targetValue[target.id] || 10;
          const sourceValue = this.memory.targetValue[source.id] || 10;
          
          // Only move if target is more valuable
          if (targetValue <= sourceValue) continue;
          
          const score = targetValue - sourceValue;
          
          if (score > bestScore) {
            // Leave at least 1 army behind
            const armiesToMove = Math.max(1, Math.min(
              source.getTotalArmies() - 1,
              Math.ceil(source.getTotalArmies() / 2)
            ));
            
            bestFortification = {
              fromTerritoryId: source.id,
              toTerritoryId: target.id,
              armies: armiesToMove
            };
            bestScore = score;
          }
        }
      }
    }
    
    // Execute the fortification
    if (bestFortification) {
      // In a real implementation, this would call the game engine to move armies
      const source = gameState.territories.find(t => t.id === bestFortification.fromTerritoryId);
      const target = gameState.territories.find(t => t.id === bestFortification.toTerritoryId);
      
      // Move armies (infantry for simplicity)
      source.armies.infantry -= bestFortification.armies;
      target.armies.infantry += bestFortification.armies;
    }
    
    // Move to the next phase
    gameState.nextPhase();
    
    return bestFortification;
  }

  /**
   * Calculate the threat level to a territory from enemy forces
   * @param {GameState} gameState - Current game state
   * @param {Territory} territory - Territory to evaluate
   * @returns {number} Threat level
   */
  calculateEnemyThreat(gameState, territory) {
    let threat = 0;
    
    // Check adjacent enemy territories
    for (const adjId of territory.adjacentTerritories) {
      const adjTerritory = gameState.territories.find(t => t.id === adjId);
      
      if (!adjTerritory || adjTerritory.occupyingPlayer === this.playerId) continue;
      
      // Calculate threat from this territory
      const enemyArmies = adjTerritory.getTotalArmies();
      const ourArmies = territory.getTotalArmies();
      
      // Higher threat if they have more armies than us
      if (enemyArmies > ourArmies) {
        threat += (enemyArmies - ourArmies) * 2;
      } else {
        threat += enemyArmies / 2; // Some threat even if we outnumber them
      }
      
      // Additional threat from aggressive players
      if (this.memory.attackedBy[adjTerritory.occupyingPlayer]) {
        threat += this.memory.attackedBy[adjTerritory.occupyingPlayer] * 2;
      }
    }
    
    return threat;
  }
}

/**
 * Aggressive AI player that focuses on attack
 */
class AggressiveAI extends AIPlayer {
  constructor(playerId, difficulty = 'medium') {
    super(playerId, difficulty);
  }
  
  // Override to be more aggressive
  shouldContinueAttacking(gameState, previousAttacks) {
    // More likely to continue attacking
    return Math.random() < 0.8;
  }
  
  // Override attack limit to be higher
  getAttackLimit() {
    switch (this.difficulty) {
      case 'easy':
        return 5;
      case 'medium':
        return 8;
      case 'hard':
        return 12;
      default:
        return 7;
    }
  }
}

/**
 * Defensive AI player that focuses on holding territory
 */
class DefensiveAI extends AIPlayer {
  constructor(playerId, difficulty = 'medium') {
    super(playerId, difficulty);
  }
  
  // Override to be more conservative
  shouldContinueAttacking(gameState, previousAttacks) {
    // Less likely to continue attacking
    return Math.random() < 0.3;
  }
  
  // Override to prioritize defensive positioning
  performFortification(gameState) {
    // Use the base implementation but give higher priority to border territories
    return super.performFortification(gameState);
  }
}

/**
 * Expansionist AI that focuses on controlling continents
 */
class ExpansionistAI extends AIPlayer {
  constructor(playerId, difficulty = 'medium') {
    super(playerId, difficulty);
  }
  
  // Override to value continent control more
  updateTerritoryValues(gameState) {
    super.updateTerritoryValues(gameState);
    
    const player = gameState.players.find(p => p.id === this.playerId);
    if (!player) return;
    
    // Increase value of territories in continents we're close to controlling
    for (const continent of gameState.continents) {
      const continentTerritories = gameState.territories.filter(t => t.continent === continent.id);
      const controlledCount = continentTerritories.filter(t => t.occupyingPlayer === this.playerId).length;
      const continentSize = continentTerritories.length;
      
      // If we control more than half the continent, increase value of remaining territories
      if (controlledCount > continentSize / 2) {
        const remainingTerritories = continentTerritories.filter(t => t.occupyingPlayer !== this.playerId);
        
        for (const territory of remainingTerritories) {
          // Increase value based on how close we are to controlling the continent
          const controlProgress = controlledCount / continentSize;
          const valueIncrease = Math.round(50 * controlProgress);
          
          this.memory.targetValue[territory.id] = 
            (this.memory.targetValue[territory.id] || 10) + valueIncrease;
        }
      }
    }
  }
}

/**
 * Factory for creating different types of AI players
 */
class AIPlayerFactory {
  /**
   * Create an AI player
   * @param {string} playerId - ID for the AI player
   * @param {string} aiType - Type of AI (random, aggressive, defensive, expansionist)
   * @param {string} difficulty - Difficulty level (easy, medium, hard)
   * @returns {AIPlayer} AI player instance
   */
  static createAI(playerId, aiType = 'random', difficulty = 'medium') {
    // If random type requested, pick one of the AI types
    if (aiType === 'random') {
      const types = ['aggressive', 'defensive', 'expansionist', 'balanced'];
      aiType = types[Math.floor(Math.random() * types.length)];
    }
    
    switch (aiType) {
      case 'aggressive':
        return new AggressiveAI(playerId, difficulty);
      case 'defensive':
        return new DefensiveAI(playerId, difficulty);
      case 'expansionist':
        return new ExpansionistAI(playerId, difficulty);
      case 'balanced':
      default:
        return new AIPlayer(playerId, difficulty);
    }
  }
}

export { AIPlayer, AggressiveAI, DefensiveAI, ExpansionistAI, AIPlayerFactory };
