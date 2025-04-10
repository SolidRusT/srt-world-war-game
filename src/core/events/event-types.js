/**
 * Event types for the Risk-inspired strategy game
 * This file defines all possible events that can occur during gameplay
 */

/**
 * Event categories:
 * - Good: Events that benefit the player
 * - Bad: Events that harm the player
 * - Neutral: Events that have mixed or balanced effects
 */

/**
 * Effect types:
 * - resource: Modify player resources
 * - armies: Add or remove armies from territories
 * - combat: Modify combat bonuses/penalties
 * - movement: Modify movement range or capabilities
 * - territory: Change territory features or resources
 * - rebellion: Cause rebellion in territories (reduce armies)
 * - card: Give or take cards
 * - technology: Give or take technologies
 */

/**
 * Effect scopes:
 * - player: Affects the player globally
 * - territory: Affects a single territory
 * - territories: Affects multiple territories
 */

/**
 * Target scopes:
 * - player: Target the player's territories
 * - continent: Target territories in a specific continent
 * - random: Target random territories regardless of continent
 */

/**
 * Base event types that serve as templates for generating the event pool
 */
export const eventTypes = [
  // === GOOD EVENTS ===
  
  // Resource Bonuses
  {
    id: 'resource-boom',
    type: 'resource-boom',
    name: 'Resource Boom',
    message: '{player} experiences an economic boom! Production and wealth increased.',
    category: 'good',
    effectType: 'resource',
    effectScope: 'player',
    resourceEffect: { production: 3, wealth: 3 },
    duration: 1,
    probability: 0.05,
    maxOccurrences: 3,
    conditions: {
      minTerritories: 5,
      minTurn: 3
    }
  },
  {
    id: 'research-breakthrough',
    type: 'research-breakthrough',
    name: 'Research Breakthrough',
    message: '{player} achieves a research breakthrough! Research points increased.',
    category: 'good',
    effectType: 'resource',
    effectScope: 'player',
    resourceEffect: { research: 5 },
    duration: 1,
    probability: 0.05,
    maxOccurrences: 2,
    conditions: {
      hasTechnology: 'scientific-method'
    }
  },
  {
    id: 'bountiful-harvest',
    type: 'bountiful-harvest',
    name: 'Bountiful Harvest',
    message: 'Bountiful harvests in {player}\'s territories increase food production.',
    category: 'good',
    effectType: 'resource',
    effectScope: 'player',
    resourceEffect: { food: 4 },
    duration: 1,
    probability: 0.08,
    maxOccurrences: 3
  },
  
  // Army Bonuses
  {
    id: 'reinforcements-arrive',
    type: 'reinforcements-arrive',
    name: 'Reinforcements Arrive',
    message: 'Reinforcements arrive in {territory}!',
    category: 'good',
    effectType: 'armies',
    effectScope: 'territory',
    targetScope: 'random',
    territoryCount: 1,
    armyEffect: 3,
    duration: 0,
    probability: 0.1,
    maxOccurrences: 5
  },
  {
    id: 'militia-formed',
    type: 'militia-formed',
    name: 'Militia Formed',
    message: 'Local militias form in {territories}!',
    category: 'good',
    effectType: 'armies',
    effectScope: 'territories',
    targetScope: 'player',
    territoryCount: 2,
    armyEffect: 1,
    duration: 0,
    probability: 0.1,
    maxOccurrences: 5
  },
  
  // Combat Bonuses
  {
    id: 'combat-morale',
    type: 'combat-morale',
    name: 'High Morale',
    message: '{player}\'s armies have high morale, granting a combat bonus!',
    category: 'good',
    effectType: 'combat',
    effectScope: 'player',
    combatEffect: {
      attackModifier: 1,
      defenseModifier: 1
    },
    duration: 2,
    probability: 0.07,
    maxOccurrences: 3
  },
  {
    id: 'strategic-advantage',
    type: 'strategic-advantage',
    name: 'Strategic Advantage',
    message: '{player} gains a strategic advantage when attacking!',
    category: 'good',
    effectType: 'combat',
    effectScope: 'player',
    combatEffect: {
      attackModifier: 2
    },
    duration: 1,
    probability: 0.07,
    maxOccurrences: 2
  },
  
  // Card Bonuses
  {
    id: 'intelligence-report',
    type: 'intelligence-report',
    name: 'Intelligence Report',
    message: '{player} receives intelligence reports containing valuable cards!',
    category: 'good',
    effectType: 'card',
    effectScope: 'player',
    cardEffect: 1,
    duration: 0,
    probability: 0.08,
    maxOccurrences: 2,
    conditions: {
      minTurn: 5
    }
  },
  
  // Movement Bonuses
  {
    id: 'improved-logistics',
    type: 'improved-logistics',
    name: 'Improved Logistics',
    message: '{player}\'s armies benefit from improved logistics and supply lines!',
    category: 'good',
    effectType: 'movement',
    effectScope: 'player',
    movementEffect: {
      rangeModifier: 1
    },
    duration: 2,
    probability: 0.06,
    maxOccurrences: 2,
    conditions: {
      minTerritories: 10
    }
  },
  
  // Territory Improvements
  {
    id: 'resource-discovery',
    type: 'resource-discovery',
    name: 'Resource Discovery',
    message: 'Valuable resources discovered in {territory}!',
    category: 'good',
    effectType: 'territory',
    effectScope: 'territory',
    targetScope: 'random',
    territoryCount: 1,
    territoryEffect: {
      resources: { 
        wealth: 1,
        production: 1
      }
    },
    duration: 0,
    probability: 0.08,
    maxOccurrences: 4
  },
  {
    id: 'research-center-built',
    type: 'research-center-built',
    name: 'Research Center Built',
    message: 'A new research center has been built in {territory}!',
    category: 'good',
    effectType: 'territory',
    effectScope: 'territory',
    targetScope: 'random',
    territoryCount: 1,
    territoryEffect: {
      feature: 'hasResearchCenter',
      value: true,
      resources: {
        research: 1
      }
    },
    duration: 0,
    probability: 0.05,
    maxOccurrences: 2,
    conditions: {
      hasTechnology: 'education'
    }
  },
  
  // === BAD EVENTS ===
  
  // Resource Penalties
  {
    id: 'economic-recession',
    type: 'economic-recession',
    name: 'Economic Recession',
    message: '{player} experiences an economic recession! Wealth decreased.',
    category: 'bad',
    effectType: 'resource',
    effectScope: 'player',
    resourceEffect: { wealth: -3 },
    duration: 1,
    probability: 0.05,
    maxOccurrences: 2,
    conditions: {
      minResource: { type: 'wealth', value: 5 }
    }
  },
  {
    id: 'supply-chain-disruption',
    type: 'supply-chain-disruption',
    name: 'Supply Chain Disruption',
    message: '{player}\'s supply chains are disrupted! Production decreased.',
    category: 'bad',
    effectType: 'resource',
    effectScope: 'player',
    resourceEffect: { production: -2 },
    duration: 1,
    probability: 0.05,
    maxOccurrences: 2
  },
  {
    id: 'famine',
    type: 'famine',
    name: 'Famine',
    message: 'Famine strikes {player}\'s territories! Food supplies are depleted.',
    category: 'bad',
    effectType: 'resource',
    effectScope: 'player',
    resourceEffect: { food: -3 },
    duration: 1,
    probability: 0.05,
    maxOccurrences: 1,
    conditions: {
      minResource: { type: 'food', value: 5 }
    }
  },
  
  // Army Penalties
  {
    id: 'disease-outbreak',
    type: 'disease-outbreak',
    name: 'Disease Outbreak',
    message: 'Disease breaks out in {territory}, reducing army strength!',
    category: 'bad',
    effectType: 'armies',
    effectScope: 'territory',
    targetScope: 'random',
    territoryCount: 1,
    armyEffect: -2,
    duration: 0,
    probability: 0.08,
    maxOccurrences: 3
  },
  {
    id: 'desertion',
    type: 'desertion',
    name: 'Desertion',
    message: 'Troops desert from {territories}!',
    category: 'bad',
    effectType: 'armies',
    effectScope: 'territories',
    targetScope: 'player',
    territoryCount: 2,
    armyEffect: -1,
    duration: 0,
    probability: 0.07,
    maxOccurrences: 3
  },
  
  // Combat Penalties
  {
    id: 'low-morale',
    type: 'low-morale',
    name: 'Low Morale',
    message: '{player}\'s armies suffer from low morale, reducing combat effectiveness!',
    category: 'bad',
    effectType: 'combat',
    effectScope: 'player',
    combatEffect: {
      attackModifier: -1,
      defenseModifier: -1
    },
    duration: 1,
    probability: 0.07,
    maxOccurrences: 2
  },
  {
    id: 'tactical-disadvantage',
    type: 'tactical-disadvantage',
    name: 'Tactical Disadvantage',
    message: '{player} faces tactical disadvantages in defense!',
    category: 'bad',
    effectType: 'combat',
    effectScope: 'player',
    combatEffect: {
      defenseModifier: -1
    },
    duration: 1,
    probability: 0.07,
    maxOccurrences: 2
  },
  
  // Card Penalties
  {
    id: 'intelligence-leak',
    type: 'intelligence-leak',
    name: 'Intelligence Leak',
    message: '{player}\'s intelligence is compromised, losing a strategic card!',
    category: 'bad',
    effectType: 'card',
    effectScope: 'player',
    cardEffect: -1,
    duration: 0,
    probability: 0.06,
    maxOccurrences: 1,
    conditions: {
      minTurn: 5
    }
  },
  
  // Rebellions
  {
    id: 'minor-rebellion',
    type: 'minor-rebellion',
    name: 'Minor Rebellion',
    message: 'A minor rebellion breaks out in {territory}!',
    category: 'bad',
    effectType: 'rebellion',
    effectScope: 'territory',
    targetScope: 'random',
    territoryCount: 1,
    rebellionStrength: 2,
    territoryLostOnRebellion: false,
    duration: 0,
    probability: 0.07,
    maxOccurrences: 3
  },
  {
    id: 'major-rebellion',
    type: 'major-rebellion',
    name: 'Major Rebellion',
    message: 'A major rebellion erupts in {territory}!',
    category: 'bad',
    effectType: 'rebellion',
    effectScope: 'territory',
    targetScope: 'random',
    territoryCount: 1,
    rebellionStrength: 5,
    territoryLostOnRebellion: true,
    duration: 0,
    probability: 0.04,
    maxOccurrences: 1,
    conditions: {
      minTerritories: 8,
      minTurn: 10
    }
  },
  
  // Territory Degradations
  {
    id: 'resource-depletion',
    type: 'resource-depletion',
    name: 'Resource Depletion',
    message: 'Resources in {territory} are becoming depleted!',
    category: 'bad',
    effectType: 'territory',
    effectScope: 'territory',
    targetScope: 'random',
    territoryCount: 1,
    territoryEffect: {
      resources: {
        production: -1
      }
    },
    duration: 0,
    probability: 0.06,
    maxOccurrences: 3
  },
  
  // === NEUTRAL EVENTS ===
  
  // Mixed Effects
  {
    id: 'market-fluctuation',
    type: 'market-fluctuation',
    name: 'Market Fluctuation',
    message: '{player} experiences market fluctuations: Production down, Wealth up!',
    category: 'neutral',
    effectType: 'resource',
    effectScope: 'player',
    resourceEffect: { production: -2, wealth: 3 },
    duration: 1,
    probability: 0.07,
    maxOccurrences: 3
  },
  {
    id: 'strategic-redeployment',
    type: 'strategic-redeployment',
    name: 'Strategic Redeployment',
    message: '{player} must strategically redeploy forces! Attack bonus, Defense penalty.',
    category: 'neutral',
    effectType: 'combat',
    effectScope: 'player',
    combatEffect: {
      attackModifier: 1,
      defenseModifier: -1
    },
    duration: 1,
    probability: 0.07,
    maxOccurrences: 2
  },
  {
    id: 'technological-shift',
    type: 'technological-shift',
    name: 'Technological Shift',
    message: '{player} experiences a technological paradigm shift! Research up, Production down.',
    category: 'neutral',
    effectType: 'resource',
    effectScope: 'player',
    resourceEffect: { research: 3, production: -2 },
    duration: 1,
    probability: 0.05,
    maxOccurrences: 2,
    conditions: {
      hasTechnology: 'scientific-method'
    }
  },
  {
    id: 'population-migration',
    type: 'population-migration',
    name: 'Population Migration',
    message: 'Population migrates from {territories} to neighboring regions!',
    category: 'neutral',
    effectType: 'territory',
    effectScope: 'territories',
    targetScope: 'player',
    territoryCount: 2,
    territoryEffect: {
      resources: {
        food: -1,
        wealth: 1
      }
    },
    duration: 0,
    probability: 0.06,
    maxOccurrences: 2
  },
  {
    id: 'climate-change',
    type: 'climate-change',
    name: 'Climate Change',
    message: 'Climate patterns shift in {player}\'s territories, affecting resources!',
    category: 'neutral',
    effectType: 'resource',
    effectScope: 'player',
    resourceEffect: { food: -2, production: 2 },
    duration: 2,
    probability: 0.04,
    maxOccurrences: 1
  }
];

/**
 * Generate the complete event pool by expanding event templates
 * @returns {Object[]} Complete event pool with unique IDs
 */
export function generateEventPool() {
  const pool = [];
  
  // Create copies of each event type with unique IDs
  eventTypes.forEach(eventType => {
    // Calculate how many instances to create based on probability
    const instanceCount = Math.max(1, Math.ceil(eventType.probability * 100));
    
    for (let i = 0; i < instanceCount; i++) {
      const event = { ...eventType };
      
      // Add a unique identifier
      event.id = `${eventType.type}-${i + 1}`;
      
      // Add to the pool
      pool.push(event);
    }
  });
  
  return pool;
}
