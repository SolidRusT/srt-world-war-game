/**
 * Technology research system for Risk-inspired strategy game
 */

import techTree from '../assets/tech-tree.js';

/**
 * Manages technology research, effects, and application
 */
class TechManager {
  /**
   * Create a new TechManager
   * @param {GameState} gameState - Reference to the game state
   */
  constructor(gameState) {
    this.gameState = gameState;
    this.techTree = techTree;
    
    // Parse all technologies into a flat map for easy lookup
    this.technologies = {};
    
    for (const category in this.techTree) {
      for (const tech of this.techTree[category]) {
        this.technologies[tech.id] = {
          ...tech,
          category
        };
      }
    }
    
    // Map to track research progress for each player
    this.researchProgress = {};
    
    // Initialize research progress for all players
    for (const player of this.gameState.players) {
      this.researchProgress[player.id] = {};
    }
  }

  /**
   * Start researching a technology for a player
   * @param {string} playerId - ID of the player
   * @param {string} techId - ID of the technology to research
   * @returns {boolean} True if research was successfully started
   */
  startResearch(playerId, techId) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || player.eliminated) return false;
    
    // Check if the technology exists
    const technology = this.technologies[techId];
    if (!technology) return false;
    
    // Check if player already has this technology
    if (player.technologies.includes(techId)) return false;
    
    // Check if player has the prerequisites
    for (const prereq of technology.prerequisites) {
      if (!player.technologies.includes(prereq)) {
        return false;
      }
    }
    
    // Check if player has already started researching this technology
    if (this.researchProgress[playerId][techId]) return false;
    
    // Check how many technologies the player is currently researching
    const currentResearchCount = Object.keys(this.researchProgress[playerId]).length;
    
    // Check if player can research multiple technologies
    const canResearchMultiple = player.technologies.includes('advanced-research');
    
    if (currentResearchCount > 0 && !canResearchMultiple) {
      return false;
    }
    
    // Check if player can afford the research cost
    const researchCost = this.getResearchCost(playerId, technology);
    
    // Check if player has enough research points
    if (player.resources.research < researchCost) {
      return false;
    }
    
    // Deduct research cost
    player.resources.research -= researchCost;
    
    // Initialize research progress
    this.researchProgress[playerId][techId] = {
      progress: 0,
      totalCost: technology.cost,
      turnsRemaining: this.calculateResearchTime(playerId, technology)
    };
    
    // Log research start
    this.gameState.eventLog.push({
      type: 'research-start',
      playerId,
      technologyId: techId,
      cost: researchCost,
      turn: this.gameState.turn
    });
    
    return true;
  }

  /**
   * Update research progress for a player at the start of their turn
   * @param {string} playerId - ID of the player
   */
  updateResearch(playerId) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || player.eliminated) return;
    
    // Skip if player isn't researching anything
    if (Object.keys(this.researchProgress[playerId]).length === 0) return;
    
    // Update progress for each technology
    for (const [techId, research] of Object.entries(this.researchProgress[playerId])) {
      // Decrement turns remaining
      research.turnsRemaining--;
      
      // Update progress percentage
      research.progress = Math.min(100, Math.floor(
        (1 - research.turnsRemaining / this.calculateResearchTime(playerId, this.technologies[techId])) * 100
      ));
      
      // Check if research is complete
      if (research.turnsRemaining <= 0) {
        // Add technology to player
        player.technologies.push(techId);
        
        // Remove from research progress
        delete this.researchProgress[playerId][techId];
        
        // Apply immediate technology effects
        this.applyTechnologyEffects(playerId, techId);
        
        // Log research completion
        this.gameState.eventLog.push({
          type: 'research-complete',
          playerId,
          technologyId: techId,
          turn: this.gameState.turn
        });
      }
    }
  }

  /**
   * Calculate research cost for a technology
   * @param {string} playerId - ID of the player
   * @param {Object} technology - Technology to research
   * @returns {number} Research cost
   */
  getResearchCost(playerId, technology) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || player.eliminated) return technology.cost;
    
    let cost = technology.cost;
    
    // Apply discounts from technologies
    const hasKnowledgeSharing = player.technologies.includes('knowledge-sharing');
    if (hasKnowledgeSharing) {
      cost = Math.floor(cost * 0.75); // 25% discount
    }
    
    return Math.max(1, cost);
  }

  /**
   * Calculate research time for a technology
   * @param {string} playerId - ID of the player
   * @param {Object} technology - Technology to research
   * @returns {number} Number of turns required
   */
  calculateResearchTime(playerId, technology) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || player.eliminated) return Math.ceil(technology.cost / 5);
    
    // Base research time: cost divided by 5, minimum 1 turn
    let researchTime = Math.ceil(technology.cost / 5);
    
    // Base research speed based on research production
    const researchProduction = this.gameState.resourceManager.calculateResourceProduction(playerId).research;
    if (researchProduction > 0) {
      researchTime = Math.ceil(technology.cost / (researchProduction + 2));
    }
    
    // Apply modifiers from technologies
    const hasScientificMethod = player.technologies.includes('scientific-method');
    if (hasScientificMethod) {
      researchTime = Math.ceil(researchTime * 0.8); // 20% faster
    }
    
    return Math.max(1, researchTime);
  }

  /**
   * Apply immediate effects of a technology
   * @param {string} playerId - ID of the player
   * @param {string} techId - ID of the technology
   */
  applyTechnologyEffects(playerId, techId) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || player.eliminated) return;
    
    const technology = this.technologies[techId];
    if (!technology) return;
    
    // Check for victory progress
    if (technology.effects && technology.effects.victoryProgress) {
      const victoryType = technology.effects.victoryProgress;
      
      // Update player's progress toward this victory type
      if (!player.victoryProgress) {
        player.victoryProgress = {};
      }
      
      player.victoryProgress[victoryType] = true;
      
      // Check if this completes a victory condition
      this.gameState.checkVictoryConditions();
    }
    
    // Other immediate effects would be applied here
    // For example, unlocking special abilities, adjusting game rules, etc.
  }

  /**
   * Check if a player can use an effect from a technology
   * @param {string} playerId - ID of the player
   * @param {string} effectType - Type of effect to check
   * @returns {boolean} True if player can use the effect
   */
  canUseEffect(playerId, effectType) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || player.eliminated) return false;
    
    // Check if player has any technology with this effect
    return player.technologies.some(techId => {
      const tech = this.technologies[techId];
      return tech && tech.effects && tech.effects.specialAbility === effectType;
    });
  }

  /**
   * Get available technologies for a player to research
   * @param {string} playerId - ID of the player
   * @returns {Object[]} List of available technologies
   */
  getAvailableTechnologies(playerId) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || player.eliminated) return [];
    
    const availableTechs = [];
    
    for (const [techId, tech] of Object.entries(this.technologies)) {
      // Skip if player already has this technology
      if (player.technologies.includes(techId)) continue;
      
      // Skip if player is already researching this technology
      if (this.researchProgress[playerId][techId]) continue;
      
      // Check prerequisites
      const hasPrerequisites = tech.prerequisites.every(prereq => 
        player.technologies.includes(prereq)
      );
      
      if (hasPrerequisites) {
        availableTechs.push({
          id: techId,
          name: tech.name,
          description: tech.description,
          category: tech.category,
          cost: this.getResearchCost(playerId, tech),
          turnsRequired: this.calculateResearchTime(playerId, tech)
        });
      }
    }
    
    return availableTechs;
  }

  /**
   * Get research progress for a player
   * @param {string} playerId - ID of the player
   * @returns {Object} Current research progress
   */
  getResearchProgress(playerId) {
    const progress = this.researchProgress[playerId] || {};
    
    // Add technology details to progress info
    const progressWithDetails = {};
    
    for (const [techId, research] of Object.entries(progress)) {
      const tech = this.technologies[techId];
      
      progressWithDetails[techId] = {
        ...research,
        name: tech.name,
        description: tech.description,
        category: tech.category
      };
    }
    
    return progressWithDetails;
  }

  /**
   * Get complete tech tree with progress information for a player
   * @param {string} playerId - ID of the player
   * @returns {Object} Tech tree with research status
   */
  getPlayerTechTree(playerId) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) return null;
    
    const result = {};
    
    for (const category in this.techTree) {
      result[category] = this.techTree[category].map(tech => {
        return {
          id: tech.id,
          name: tech.name,
          description: tech.description,
          prerequisites: tech.prerequisites,
          cost: this.getResearchCost(playerId, tech),
          status: this.getTechStatus(playerId, tech.id),
          progress: this.researchProgress[playerId][tech.id] 
                    ? this.researchProgress[playerId][tech.id].progress 
                    : 0
        };
      });
    }
    
    return result;
  }

  /**
   * Get the status of a technology for a player
   * @param {string} playerId - ID of the player
   * @param {string} techId - ID of the technology
   * @returns {string} Status (unlocked, researching, available, locked)
   */
  getTechStatus(playerId, techId) {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) return 'locked';
    
    // Check if player already has this technology
    if (player.technologies.includes(techId)) {
      return 'unlocked';
    }
    
    // Check if player is researching this technology
    if (this.researchProgress[playerId][techId]) {
      return 'researching';
    }
    
    // Check if prerequisites are met
    const tech = this.technologies[techId];
    const hasPrerequisites = tech.prerequisites.every(prereq => 
      player.technologies.includes(prereq)
    );
    
    return hasPrerequisites ? 'available' : 'locked';
  }
}

export default TechManager;
