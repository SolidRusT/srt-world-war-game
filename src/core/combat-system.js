/**
 * Combat system for Risk-inspired strategy game
 */

/**
 * Handles combat resolution between territories
 */
class CombatSystem {
  /**
   * Create a new CombatSystem
   * @param {GameState} gameState - Reference to the game state
   */
  constructor(gameState) {
    this.gameState = gameState;
    
    // Define unit types and their combat values
    this.unitTypes = {
      infantry: {
        name: 'Infantry',
        attackValue: 1,
        defenseValue: 1,
        icon: '👣',
        color: '#8B0000', // Dark red
        armyValue: 1
      },
      cavalry: {
        name: 'Cavalry',
        attackValue: 1.2,
        defenseValue: 1,
        icon: '🐎',
        color: '#006400', // Dark green
        armyValue: 3
      },
      artillery: {
        name: 'Artillery',
        attackValue: 1,
        defenseValue: 1.5,
        icon: '💣',
        color: '#00008B', // Dark blue
        armyValue: 5
      }
    };
  }

  /**
   * Resolve an attack between territories
   * @param {string} attackingTerritoryId - ID of the attacking territory
   * @param {string} defendingTerritoryId - ID of the defending territory
   * @param {Object} options - Attack options (dice count, etc.)
   * @returns {Object} Attack result
   */
  resolveAttack(attackingTerritoryId, defendingTerritoryId, options = {}) {
    const attackingTerritory = this.gameState.territories.find(t => t.id === attackingTerritoryId);
    const defendingTerritory = this.gameState.territories.find(t => t.id === defendingTerritoryId);
    
    if (!attackingTerritory || !defendingTerritory) {
      return { success: false, error: 'Invalid territory' };
    }
    
    // Verify territories are adjacent
    if (!attackingTerritory.isAdjacentTo(defendingTerritoryId)) {
      return { success: false, error: 'Territories are not adjacent' };
    }
    
    // Get attacking and defending players
    const attackingPlayerId = attackingTerritory.occupyingPlayer;
    const defendingPlayerId = defendingTerritory.occupyingPlayer;
    
    const attackingPlayer = this.gameState.players.find(p => p.id === attackingPlayerId);
    const defendingPlayer = this.gameState.players.find(p => p.id === defendingPlayerId);
    
    if (!attackingPlayer || !defendingPlayer) {
      return { success: false, error: 'Invalid player' };
    }
    
    // Verify players are different
    if (attackingPlayerId === defendingPlayerId) {
      return { success: false, error: 'Cannot attack your own territory' };
    }
    
    // Verify attacking territory has enough armies
    const totalAttackingArmies = attackingTerritory.getTotalArmies();
    if (totalAttackingArmies < 2) {
      return { success: false, error: 'Need at least 2 armies to attack' };
    }
    
    // Determine number of attack dice (1-3)
    const maxAttackDice = Math.min(3, totalAttackingArmies - 1);
    const attackDice = options.attackDice || maxAttackDice;
    
    if (attackDice < 1 || attackDice > maxAttackDice) {
      return { success: false, error: `Invalid attack dice count (must be 1-${maxAttackDice})` };
    }
    
    // Determine number of defense dice (1-2)
    const totalDefendingArmies = defendingTerritory.getTotalArmies();
    const maxDefenseDice = Math.min(2, totalDefendingArmies);
    const defenseDice = options.defenseDice || maxDefenseDice;
    
    // Roll the dice
    const attackRolls = this.rollDice(attackDice, attackingTerritory, 'attack');
    const defenseRolls = this.rollDice(defenseDice, defendingTerritory, 'defense');
    
    // Sort dice in descending order
    attackRolls.sort((a, b) => b.value - a.value);
    defenseRolls.sort((a, b) => b.value - a.value);
    
    // Compare dice and determine casualties
    const results = this.compareDice(attackRolls, defenseRolls, attackingTerritory, defendingTerritory);
    
    // Apply casualties
    const { attackerLosses, defenderLosses } = this.applyCasualties(
      attackingTerritory, 
      defendingTerritory, 
      results.attackerLosses,
      results.defenderLosses
    );
    
    // Check if defender is defeated
    let territoryConquered = false;
    
    if (defendingTerritory.getTotalArmies() === 0) {
      territoryConquered = true;
      
      // Transfer territory ownership
      this.transferTerritory(
        defendingTerritoryId, 
        attackingPlayerId, 
        defendingPlayerId, 
        attackDice
      );
      
      // Move attacking armies into conquered territory
      this.moveArmies(attackingTerritoryId, defendingTerritoryId, attackDice);
      
      // Check if defender is eliminated
      if (defendingPlayer.territories.length === 0) {
        this.eliminatePlayer(defendingPlayerId, attackingPlayerId);
      }
      
      // Check if game is over
      this.gameState.checkVictoryConditions();
    }
    
    // Log the attack
    this.gameState.eventLog.push({
      type: 'attack',
      attackingPlayerId,
      defendingPlayerId,
      attackingTerritoryId,
      defendingTerritoryId,
      attackRolls: attackRolls.map(r => r.value),
      defenseRolls: defenseRolls.map(r => r.value),
      attackerLosses,
      defenderLosses,
      territoryConquered,
      turn: this.gameState.turn
    });
    
    // Return attack results
    return {
      success: true,
      attackRolls,
      defenseRolls,
      attackerLosses,
      defenderLosses,
      territoryConquered,
      attackingTerritory: attackingTerritory.name,
      defendingTerritory: defendingTerritory.name,
      attackingPlayer: attackingPlayer.name,
      defendingPlayer: defendingPlayer.name
    };
  }

  /**
   * Roll dice for combat, applying relevant bonuses
   * @param {number} count - Number of dice to roll
   * @param {Territory} territory - Territory rolling the dice
   * @param {string} type - Type of roll ('attack' or 'defense')
   * @returns {Object[]} Array of dice roll results with bonuses applied
   */
  rollDice(count, territory, type) {
    const rolls = [];
    const player = this.gameState.players.find(p => p.id === territory.occupyingPlayer);
    
    for (let i = 0; i < count; i++) {
      // Base dice roll (1-6)
      const baseRoll = Math.floor(Math.random() * 6) + 1;
      
      // Calculate bonuses from technologies, unit types, etc.
      const bonus = this.calculateCombatBonus(player, territory, type);
      
      // Apply bonus (but keep the visual representation as 1-6)
      const effectiveValue = baseRoll + bonus;
      
      rolls.push({
        value: effectiveValue,
        display: baseRoll,
        bonus
      });
    }
    
    return rolls;
  }

  /**
   * Calculate combat bonus for a territory
   * @param {Player} player - Player controlling the territory
   * @param {Territory} territory - Territory to calculate bonus for
   * @param {string} type - Type of bonus ('attack' or 'defense')
   * @returns {number} Combat bonus
   */
  calculateCombatBonus(player, territory, type) {
    if (!player) return 0;
    
    let bonus = 0;
    
    // Bonuses from unit types
    const hasInfantry = territory.armies.infantry > 0;
    const hasCavalry = territory.armies.cavalry > 0;
    const hasArtillery = territory.armies.artillery > 0;
    
    // Unit type specific bonuses
    if (type === 'attack') {
      if (hasCavalry && player.technologies.includes('cavalry-charge')) {
        bonus += 1;
      }
      if (hasArtillery && player.technologies.includes('artillery-barrage')) {
        bonus += 2;
      }
      if (player.technologies.includes('advanced-infantry')) {
        bonus += hasInfantry ? 1 : 0;
      }
    } else {
      // Defense bonuses
      if (player.technologies.includes('defensive-tactics')) {
        bonus += 1;
      }
      if (territory.getTotalArmies() >= 5 && player.technologies.includes('fortification')) {
        bonus += 1;
      }
    }
    
    // Combined arms bonus (if all unit types are present)
    if (hasInfantry && hasCavalry && hasArtillery && player.technologies.includes('combined-arms')) {
      bonus += 1;
    }
    
    // Technology bonuses
    if (player.technologies.includes('technological-supremacy')) {
      bonus = Math.floor(bonus * 1.25);
    }
    
    // Add event-based combat modifiers if events manager exists
    if (this.gameState.eventsManager) {
      const eventModifier = this.gameState.eventsManager.getCombatModifiers(
        player.id,
        territory.id,
        type
      );
      bonus += eventModifier;
    }
    
    return bonus;
  }

  /**
   * Compare dice rolls and determine casualties
   * @param {Object[]} attackRolls - Attack dice results
   * @param {Object[]} defenseRolls - Defense dice results
   * @param {Territory} attackingTerritory - Attacking territory
   * @param {Territory} defendingTerritory - Defending territory
   * @returns {Object} Attacker and defender losses
   */
  compareDice(attackRolls, defenseRolls, attackingTerritory, defendingTerritory) {
    let attackerLosses = 0;
    let defenderLosses = 0;
    
    const maxComparisons = Math.min(attackRolls.length, defenseRolls.length);
    
    for (let i = 0; i < maxComparisons; i++) {
      const attackRoll = attackRolls[i];
      const defenseRoll = defenseRolls[i];
      
      // Defender wins ties
      if (attackRoll.value > defenseRoll.value) {
        defenderLosses++;
      } else {
        attackerLosses++;
      }
    }
    
    return { attackerLosses, defenderLosses };
  }

  /**
   * Apply casualties to territories
   * @param {Territory} attackingTerritory - Attacking territory
   * @param {Territory} defendingTerritory - Defending territory
   * @param {number} attackerLosses - Number of attacking units lost
   * @param {number} defenderLosses - Number of defending units lost
   * @returns {Object} Actual losses applied (may differ due to unit types)
   */
  applyCasualties(attackingTerritory, defendingTerritory, attackerLosses, defenderLosses) {
    // Apply attacker losses (starting with infantry, then cavalry, then artillery)
    let remainingAttackerLosses = attackerLosses;
    
    // Remove infantry first
    const infantryLosses = Math.min(attackingTerritory.armies.infantry, remainingAttackerLosses);
    attackingTerritory.armies.infantry -= infantryLosses;
    remainingAttackerLosses -= infantryLosses;
    
    // Remove cavalry if needed
    if (remainingAttackerLosses > 0) {
      const cavalryLosses = Math.min(attackingTerritory.armies.cavalry, remainingAttackerLosses);
      attackingTerritory.armies.cavalry -= cavalryLosses;
      remainingAttackerLosses -= cavalryLosses;
    }
    
    // Remove artillery if needed
    if (remainingAttackerLosses > 0) {
      const artilleryLosses = Math.min(attackingTerritory.armies.artillery, remainingAttackerLosses);
      attackingTerritory.armies.artillery -= artilleryLosses;
      remainingAttackerLosses -= artilleryLosses;
    }
    
    // Apply defender losses (same order)
    let remainingDefenderLosses = defenderLosses;
    
    // Remove infantry first
    const defInfantryLosses = Math.min(defendingTerritory.armies.infantry, remainingDefenderLosses);
    defendingTerritory.armies.infantry -= defInfantryLosses;
    remainingDefenderLosses -= defInfantryLosses;
    
    // Remove cavalry if needed
    if (remainingDefenderLosses > 0) {
      const defCavalryLosses = Math.min(defendingTerritory.armies.cavalry, remainingDefenderLosses);
      defendingTerritory.armies.cavalry -= defCavalryLosses;
      remainingDefenderLosses -= defCavalryLosses;
    }
    
    // Remove artillery if needed
    if (remainingDefenderLosses > 0) {
      const defArtilleryLosses = Math.min(defendingTerritory.armies.artillery, remainingDefenderLosses);
      defendingTerritory.armies.artillery -= defArtilleryLosses;
      remainingDefenderLosses -= defArtilleryLosses;
    }
    
    return {
      attackerLosses: attackerLosses - remainingAttackerLosses,
      defenderLosses: defenderLosses - remainingDefenderLosses
    };
  }

  /**
   * Transfer territory ownership after conquest
   * @param {string} territoryId - ID of the territory
   * @param {string} newOwnerId - ID of the new owner
   * @param {string} previousOwnerId - ID of the previous owner
   * @param {number} armyCount - Number of armies to move into territory
   */
  transferTerritory(territoryId, newOwnerId, previousOwnerId, armyCount) {
    const territory = this.gameState.territories.find(t => t.id === territoryId);
    const newOwner = this.gameState.players.find(p => p.id === newOwnerId);
    const previousOwner = this.gameState.players.find(p => p.id === previousOwnerId);
    
    if (!territory || !newOwner || !previousOwner) return;
    
    // Update territory ownership
    territory.occupyingPlayer = newOwnerId;
    
    // Clear any remaining armies first
    territory.armies = {
      infantry: 0,
      cavalry: 0,
      artillery: 0
    };
    
    // Move attacking armies (using infantry for consistency with game-engine.js)
    territory.armies.infantry = armyCount;
    
    // Update player territory lists
    newOwner.territories.push(territoryId);
    previousOwner.territories = previousOwner.territories.filter(id => id !== territoryId);
    
    // Set card awarded flag - this is the standard approach across all modules
    // Only awarded once per turn for conquering at least one territory
    if (!this.gameState.cardAwarded) {
      this.gameState.cardAwarded = true;
    }
  }

  /**
   * Move armies from one territory to another
   * @param {string} fromTerritoryId - ID of the source territory
   * @param {string} toTerritoryId - ID of the destination territory
   * @param {number} count - Number of armies to move
   * @returns {boolean} True if armies were successfully moved
   */
  moveArmies(fromTerritoryId, toTerritoryId, count) {
    const fromTerritory = this.gameState.territories.find(t => t.id === fromTerritoryId);
    const toTerritory = this.gameState.territories.find(t => t.id === toTerritoryId);
    
    if (!fromTerritory || !toTerritory) return false;
    
    // Ensure territories are owned by the same player
    if (fromTerritory.occupyingPlayer !== toTerritory.occupyingPlayer) return false;
    
    // Ensure source territory has enough armies
    const totalArmies = fromTerritory.getTotalArmies();
    if (totalArmies <= count) return false;
    
    // Move units based on what's available, prioritizing infantry first for simplicity
    // In a more sophisticated implementation, we would allow the player to choose which unit types to move
    let remainingToMove = count;
    
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
    
    return true;
  }

  /**
   * Eliminate a player from the game
   * @param {string} eliminatedPlayerId - ID of the eliminated player
   * @param {string} eliminatorPlayerId - ID of the player who eliminated them
   */
  eliminatePlayer(eliminatedPlayerId, eliminatorPlayerId) {
    const eliminatedPlayer = this.gameState.players.find(p => p.id === eliminatedPlayerId);
    const eliminator = this.gameState.players.find(p => p.id === eliminatorPlayerId);
    
    if (!eliminatedPlayer || !eliminator) return;
    
    // Mark player as eliminated
    eliminatedPlayer.eliminated = true;
    
    // Transfer cards to eliminator
    eliminator.cards = eliminator.cards.concat(eliminatedPlayer.cards);
    eliminatedPlayer.cards = [];
    
    // Log elimination
    this.gameState.eventLog.push({
      type: 'player-eliminated',
      eliminatedPlayerId,
      eliminatorPlayerId,
      turn: this.gameState.turn
    });
    
    // Check if the eliminator needs to trade in cards
    this.checkForcedCardTrade(eliminatorPlayerId);
  }

  /**
   * Helper method to get a card from the deck
   * @returns {Object|null} A card from the deck or null if no cards are available
   * 
   * Note: This method doesn't award the card to a player or modify the game state.
   * It's a utility method for retrieving cards from the deck when needed.
   */
  getCardFromDeck() {
    if (this.gameState.cardDeck.length === 0) {
      // Reshuffle the discard pile if the deck is empty
      if (this.gameState.discardPile.length > 0) {
        this.gameState.cardDeck = this.shuffleArray([...this.gameState.discardPile]);
        this.gameState.discardPile = [];
      } else {
        return null; // No cards available
      }
    }
    
    return this.gameState.cardDeck.length > 0 ? this.gameState.cardDeck[this.gameState.cardDeck.length - 1] : null;
  }

  /**
   * Check if a player must trade in cards
   * @param {string} playerId - ID of the player
   */
  checkForcedCardTrade(playerId) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) return;
    
    // Force card trade-in if player has more than 5 cards
    if (player.cards.length > 5) {
      // This would be handled by the game UI prompting the player to choose cards
      // For now, we'll just log that a forced trade is required
      this.gameState.eventLog.push({
        type: 'forced-card-trade',
        playerId,
        cardCount: player.cards.length,
        turn: this.gameState.turn
      });
    }
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

export default CombatSystem;
