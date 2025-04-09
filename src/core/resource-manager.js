/**
 * Resource management system for Risk-inspired strategy game
 */

/**
 * Manages resource production, collection, and usage
 */
class ResourceManager {
  /**
   * Create a new ResourceManager
   * @param {GameState} gameState - Reference to the game state
   */
  constructor(gameState) {
    this.gameState = gameState;
    
    // Define base resource types and their properties
    this.resourceTypes = {
      food: {
        name: 'Food',
        description: 'Supports larger armies',
        icon: '🌾',
        color: '#8B4513' // Brown
      },
      production: {
        name: 'Production',
        description: 'Accelerates unit creation',
        icon: '⚒️',
        color: '#696969' // Gray
      },
      research: {
        name: 'Research',
        description: 'Speeds up technology development',
        icon: '🔬',
        color: '#4169E1' // Royal Blue
      },
      wealth: {
        name: 'Wealth',
        description: 'Provides economic advantages',
        icon: '💰',
        color: '#FFD700' // Gold
      }
    };
  }

  /**
   * Calculate resource production for a player
   * @param {string} playerId - ID of the player
   * @returns {Object} Resources produced this turn
   */
  calculateResourceProduction(playerId) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || player.eliminated) return null;
    
    const production = {
      food: 0,
      production: 0,
      research: 0,
      wealth: 0
    };
    
    // Base production from territories
    for (const territoryId of player.territories) {
      const territory = this.gameState.territories.find(t => t.id === territoryId);
      if (!territory) continue;
      
      // Add resources from territory
      for (const [resourceType, amount] of Object.entries(territory.resources)) {
        if (resourceType in production) {
          production[resourceType] += amount;
        }
      }
    }
    
    // Apply technology bonuses
    for (const techId of player.technologies) {
      const technology = this.findTechnology(techId);
      if (!technology) continue;
      
      // Apply resource production multipliers
      if (technology.effects && technology.effects.resourceBonus) {
        const bonus = technology.effects.resourceBonus;
        
        // Apply bonus to a specific resource type
        if (bonus.type && bonus.type in production) {
          production[bonus.type] = Math.floor(production[bonus.type] * bonus.multiplier);
        }
        
        // Apply bonus to all resources
        if (bonus.all && bonus.multiplier) {
          for (const resourceType in production) {
            production[resourceType] = Math.floor(production[resourceType] * bonus.multiplier);
          }
        }
      }
      
      // Apply territory-specific bonuses
      if (technology.effects && technology.effects.territoryBonus) {
        const bonus = technology.effects.territoryBonus;
        
        // Apply bonus to territories with specific features
        if (bonus.feature && bonus.resourceType && bonus.bonus) {
          const featureCount = player.territories.filter(territoryId => {
            const territory = this.gameState.territories.find(t => t.id === territoryId);
            return territory && territory.features && territory.features[bonus.feature];
          }).length;
          
          production[bonus.resourceType] += featureCount * bonus.bonus;
        }
      }
    }
    
    // Apply alliance bonuses (if alliances are enabled)
    if (this.gameState.config && this.gameState.config.enableAlliances) {
      for (const allyId of player.allies) {
        const ally = this.gameState.players.find(p => p.id === allyId);
        if (!ally || ally.eliminated) continue;
        
        // Check if resource sharing is enabled through technologies
        const hasResourceSharing = player.technologies.some(techId => {
          const tech = this.findTechnology(techId);
          return tech && tech.effects && 
                 tech.effects.allianceOption === 'resourceSharing';
        });
        
        if (hasResourceSharing) {
          // Share a percentage of ally's production (e.g., 10%)
          const sharePercentage = 0.1;
          
          // Calculate ally's production
          const allyProduction = this.calculateResourceProduction(allyId);
          if (!allyProduction) continue;
          
          // Add share of ally's production
          for (const resourceType in production) {
            production[resourceType] += Math.floor(allyProduction[resourceType] * sharePercentage);
          }
        }
      }
    }
    
    return production;
  }

  /**
   * Apply resource production for a player at the start of their turn
   * @param {string} playerId - ID of the player
   */
  collectResources(playerId) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || player.eliminated) return;
    
    const production = this.calculateResourceProduction(playerId);
    if (!production) return;
    
    // Add produced resources to player's total
    for (const resourceType in production) {
      player.resources[resourceType] += production[resourceType];
    }
    
    // Log resource collection
    this.gameState.eventLog.push({
      type: 'resource-collection',
      playerId,
      resources: production,
      turn: this.gameState.turn
    });
  }

  /**
   * Consume resources for a specific action
   * @param {string} playerId - ID of the player
   * @param {Object} cost - Resources to consume
   * @returns {boolean} True if resources were successfully consumed
   */
  consumeResources(playerId, cost) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || player.eliminated) return false;
    
    // Check if player has enough resources
    for (const [resourceType, amount] of Object.entries(cost)) {
      if (!player.resources[resourceType] || player.resources[resourceType] < amount) {
        return false;
      }
    }
    
    // Consume resources
    for (const [resourceType, amount] of Object.entries(cost)) {
      player.resources[resourceType] -= amount;
    }
    
    // Log resource consumption
    this.gameState.eventLog.push({
      type: 'resource-consumption',
      playerId,
      resources: cost,
      turn: this.gameState.turn
    });
    
    return true;
  }

  /**
   * Convert wealth to other resources (requires Banking technology)
   * @param {string} playerId - ID of the player
   * @param {Object} conversion - Resources to convert to
   * @returns {boolean} True if conversion was successful
   */
  convertWealth(playerId, conversion) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || player.eliminated) return false;
    
    // Check if player has Banking technology
    const hasBanking = player.technologies.includes('banking');
    if (!hasBanking) return false;
    
    // Calculate total wealth needed
    const totalWealth = Object.values(conversion).reduce((sum, amount) => sum + amount, 0);
    
    // Check if player has enough wealth
    if (player.resources.wealth < totalWealth) return false;
    
    // Convert wealth to other resources
    player.resources.wealth -= totalWealth;
    
    for (const [resourceType, amount] of Object.entries(conversion)) {
      if (resourceType !== 'wealth') {
        player.resources[resourceType] += amount;
      }
    }
    
    // Log resource conversion
    this.gameState.eventLog.push({
      type: 'resource-conversion',
      playerId,
      conversion,
      wealthSpent: totalWealth,
      turn: this.gameState.turn
    });
    
    return true;
  }

  /**
   * Get resource production details for display
   * @param {string} playerId - ID of the player
   * @returns {Object} Detailed resource production breakdown
   */
  getResourceDetails(playerId) {
    const baseProduction = this.calculateBaseProduction(playerId);
    const bonuses = this.calculateProductionBonuses(playerId);
    const total = this.calculateResourceProduction(playerId);
    
    return {
      base: baseProduction,
      bonuses,
      total
    };
  }

  /**
   * Calculate base resource production (without bonuses)
   * @param {string} playerId - ID of the player
   * @returns {Object} Base resource production
   */
  calculateBaseProduction(playerId) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || player.eliminated) return null;
    
    const production = {
      food: 0,
      production: 0,
      research: 0,
      wealth: 0
    };
    
    // Base production from territories
    for (const territoryId of player.territories) {
      const territory = this.gameState.territories.find(t => t.id === territoryId);
      if (!territory) continue;
      
      // Add resources from territory
      for (const [resourceType, amount] of Object.entries(territory.resources)) {
        if (resourceType in production) {
          production[resourceType] += amount;
        }
      }
    }
    
    return production;
  }

  /**
   * Calculate resource production bonuses from technologies and alliances
   * @param {string} playerId - ID of the player
   * @returns {Object} Resource production bonuses
   */
  calculateProductionBonuses(playerId) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || player.eliminated) return null;
    
    // Start with base production
    const baseProduction = this.calculateBaseProduction(playerId);
    
    // Initialize bonuses with zeros
    const bonuses = {
      food: 0,
      production: 0,
      research: 0,
      wealth: 0
    };
    
    // Calculate final production with all bonuses
    const totalProduction = this.calculateResourceProduction(playerId);
    
    // Calculate bonuses by subtracting base from total
    for (const resourceType in bonuses) {
      bonuses[resourceType] = totalProduction[resourceType] - baseProduction[resourceType];
    }
    
    return bonuses;
  }

  /**
   * Find a technology by ID
   * @param {string} techId - ID of the technology
   * @returns {Object|null} Technology object or null if not found
   */
  findTechnology(techId) {
    // This would be implemented to search through the technology tree
    // For now, we'll return a placeholder
    return null;
  }
}

export default ResourceManager;
