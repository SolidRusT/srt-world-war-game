/**
 * Get the total armies in a territory
 * @param {Object} territory - The territory object
 * @returns {number} The total number of armies
 */
function getTotalArmies(territory) {
  if (typeof territory.getTotalArmies === 'function') {
    // Use the existing method if available
    return territory.getTotalArmies();
  }
  
  // Otherwise calculate it manually
  return (territory.armies.infantry || 0) + 
         ((territory.armies.cavalry || 0) * 3) + 
         ((territory.armies.artillery || 0) * 5);
}

/**
 * Helper functions for game mechanics used by multiple components
 */

/**
 * Manually advance the game to the next phase
 * This is an implementation of GameState.nextPhase() for components that don't have
 * direct access to the method
 * 
 * @param {Object} gameState - The current game state
 * @returns {Object} Updated game state
 */
function nextPhase(gameState) {
  // Store the current phase for reference
  const currentPhase = gameState.phase;
  
  switch (currentPhase) {
    case 'reinforcement':
      gameState.phase = 'attack';
      // Reset the card awarded flag at the start of the attack phase
      gameState.cardAwarded = false;
      break;
      
    case 'attack':
      gameState.phase = 'fortification';
      break;
      
    case 'fortification':
      gameState.phase = 'reinforcement';
      // Move to next player
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      
      // Skip eliminated players
      while (gameState.players[gameState.currentPlayerIndex].eliminated) {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      }
      
      // Increment turn counter if completed a full round
      if (gameState.currentPlayerIndex === 0) {
        gameState.turn++;
      }
      
      // Calculate and apply resource production if enabled
      if (gameState.config && gameState.config.enableResources && gameState.resourceManager) {
        gameState.resourceManager.calculateResourceProduction(
          gameState.players[gameState.currentPlayerIndex].id
        );
      }
      break;
  }
  
  return gameState;
}

/**
 * Check if a player controls an entire continent
 * This is an implementation of GameState.playerControlsContinent() for components
 * that don't have direct access to the method
 * 
 * @param {Object} gameState - The current game state
 * @param {string} playerId - ID of the player to check
 * @param {string} continentId - ID of the continent to check
 * @returns {boolean} True if player controls the continent
 */
function playerControlsContinent(gameState, playerId, continentId) {
  const continent = gameState.continents.find(c => c.id === continentId);
  if (!continent) return false;
  
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return false;
  
  return continent.territories.every(terrId => 
    player.territories.includes(terrId)
  );
}

/**
 * Resolve an attack between two territories
 * This is a simplified combat system for AI players
 * 
 * @param {Object} gameState - The current game state
 * @param {string} fromTerritoryId - ID of the attacking territory
 * @param {string} toTerritoryId - ID of the defending territory
 * @param {Object} options - Attack options (attackDice)
 * @returns {Object} Attack result
 */
function resolveAttack(gameState, fromTerritoryId, toTerritoryId, options = {}) {
  const fromTerritory = gameState.territories.find(t => t.id === fromTerritoryId);
  const toTerritory = gameState.territories.find(t => t.id === toTerritoryId);
  
  // Verify territories exist
  if (!fromTerritory || !toTerritory) {
    return { success: false, error: 'Invalid territory' };
  }
  
  // Verify the player owns the attacking territory
  if (fromTerritory.occupyingPlayer !== options.playerId) {
    return { success: false, error: 'You do not control the attacking territory' };
  }
  
  // Verify the player doesn't own the defending territory
  if (toTerritory.occupyingPlayer === options.playerId) {
    return { success: false, error: 'You cannot attack your own territory' };
  }
  
  // Verify the attacking territory has enough armies
  if (getTotalArmies(fromTerritory) < 2) {
    return { success: false, error: 'Need at least 2 armies to attack' };
  }
  
  // Verify the attack dice count
  const attackDice = options.attackDice || 1;
  if (attackDice < 1 || attackDice > 3) {
    return { success: false, error: 'Invalid attack dice count' };
  }
  
  // Verify the attacking territory has enough armies for the dice count
  if (getTotalArmies(fromTerritory) <= attackDice) {
    return { success: false, error: 'Not enough armies for selected dice count' };
  }
  
  // Determine defense dice count (1 or 2)
  const defenseDice = Math.min(2, getTotalArmies(toTerritory));
  
  // Roll the dice
  const attackRolls = rollDice(attackDice);
  const defenseRolls = rollDice(defenseDice);
  
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
  
  // Apply casualties
  // Attacker losses
  fromTerritory.armies.infantry -= attackerLosses;
  
  // Defender losses
  toTerritory.armies.infantry -= defenderLosses;
  
  // Check if defender is defeated
  let territoryConquered = false;
  if (getTotalArmies(toTerritory) <= 0) {
    territoryConquered = true;
    
    // Move armies automatically for AI
    const movingArmies = Math.min(getTotalArmies(fromTerritory) - 1, attackDice);
    
    // Handle conquest
    toTerritory.occupyingPlayer = fromTerritory.occupyingPlayer;
    toTerritory.armies.infantry = movingArmies;
    fromTerritory.armies.infantry -= movingArmies;
    
    // Update territory ownership lists
    const player = gameState.players.find(p => p.id === fromTerritory.occupyingPlayer);
    const defender = gameState.players.find(p => p.id === options.defenderId);
    
    if (player && !player.territories.includes(toTerritoryId)) {
      player.territories.push(toTerritoryId);
    }
    
    if (defender) {
      defender.territories = defender.territories.filter(id => id !== toTerritoryId);
      
      // Check if defender is eliminated
      if (defender.territories.length === 0) {
        defender.eliminated = true;
        
        // Transfer defender's cards to attacker
        if (player) {
          player.cards = player.cards.concat(defender.cards || []);
          defender.cards = [];
        }
      }
    }
    
    // Flag that a card should be awarded
    gameState.cardAwarded = true;
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
 * Roll dice and return the results
 * @param {number} count - Number of dice to roll
 * @returns {number[]} Array of dice roll results
 */
function rollDice(count) {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(Math.floor(Math.random() * 6) + 1);
  }
  return results;
}

export { nextPhase, playerControlsContinent, resolveAttack, getTotalArmies };
