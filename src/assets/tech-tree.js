/**
 * Technology tree definition for Risk-inspired strategy game
 */

const techTree = {
  // Military Technologies
  military: [
    {
      id: 'advanced-infantry',
      name: 'Advanced Infantry',
      description: 'Infantry units gain +1 to attack rolls.',
      prerequisites: [],
      cost: 10,
      effects: {
        combatBonus: { unitType: 'infantry', attackBonus: 1 }
      }
    },
    {
      id: 'defensive-tactics',
      name: 'Defensive Tactics',
      description: 'All units gain +1 to defense rolls.',
      prerequisites: [],
      cost: 10,
      effects: {
        combatBonus: { defenseBonus: 1 }
      }
    },
    {
      id: 'cavalry-charge',
      name: 'Cavalry Charge',
      description: 'Cavalry units gain +1 to attack rolls and can move an extra territory during fortification.',
      prerequisites: ['advanced-infantry'],
      cost: 15,
      effects: {
        combatBonus: { unitType: 'cavalry', attackBonus: 1 },
        movementBonus: { unitType: 'cavalry', bonus: 1 }
      }
    },
    {
      id: 'artillery-barrage',
      name: 'Artillery Barrage',
      description: 'Artillery units can attack with +2 to dice rolls.',
      prerequisites: ['defensive-tactics'],
      cost: 15,
      effects: {
        combatBonus: { unitType: 'artillery', attackBonus: 2 }
      }
    },
    {
      id: 'blitzkrieg',
      name: 'Blitzkrieg',
      description: 'After conquering a territory, you may immediately attack from that territory once.',
      prerequisites: ['cavalry-charge'],
      cost: 20,
      effects: {
        specialAbility: 'extraAttack'
      }
    },
    {
      id: 'fortification',
      name: 'Fortification',
      description: 'Territories with at least 5 armies gain +1 to all defense rolls.',
      prerequisites: ['artillery-barrage'],
      cost: 20,
      effects: {
        territoryBonus: { minArmies: 5, defenseBonus: 1 }
      }
    },
    {
      id: 'combined-arms',
      name: 'Combined Arms',
      description: 'Territories with all three unit types gain +1 to all attack and defense rolls.',
      prerequisites: ['blitzkrieg', 'fortification'],
      cost: 30,
      effects: {
        specialBonus: 'combinedArms'
      }
    }
  ],
  
  // Economic Technologies
  economic: [
    {
      id: 'improved-farming',
      name: 'Improved Farming',
      description: 'Food production increased by 50% in all territories.',
      prerequisites: [],
      cost: 10,
      effects: {
        resourceBonus: { type: 'food', multiplier: 1.5 }
      }
    },
    {
      id: 'mining',
      name: 'Mining',
      description: 'Production increased by 50% in all territories.',
      prerequisites: [],
      cost: 10,
      effects: {
        resourceBonus: { type: 'production', multiplier: 1.5 }
      }
    },
    {
      id: 'trade-routes',
      name: 'Trade Routes',
      description: 'Territories with ports produce +1 wealth.',
      prerequisites: ['improved-farming'],
      cost: 15,
      effects: {
        territoryBonus: { feature: 'hasPort', resourceType: 'wealth', bonus: 1 }
      }
    },
    {
      id: 'industrialization',
      name: 'Industrialization',
      description: 'Territories with production resources provide +1 army during reinforcement.',
      prerequisites: ['mining'],
      cost: 15,
      effects: {
        reinforcementBonus: { resourceType: 'production', bonus: 1 }
      }
    },
    {
      id: 'banking',
      name: 'Banking',
      description: 'Wealth resources can be converted to other resource types at a 1:1 ratio.',
      prerequisites: ['trade-routes'],
      cost: 20,
      effects: {
        specialAbility: 'resourceConversion'
      }
    },
    {
      id: 'logistics',
      name: 'Logistics',
      description: 'Reinforcements can be placed on any controlled territory, not just adjacent ones.',
      prerequisites: ['industrialization'],
      cost: 20,
      effects: {
        specialAbility: 'globalReinforcement'
      }
    },
    {
      id: 'economic-dominance',
      name: 'Economic Dominance',
      description: 'All resources increased by 25%. Unlocks Economic Victory condition.',
      prerequisites: ['banking', 'logistics'],
      cost: 30,
      effects: {
        resourceBonus: { all: true, multiplier: 1.25 },
        victoryProgress: 'economic'
      }
    }
  ],
  
  // Diplomatic Technologies
  diplomatic: [
    {
      id: 'diplomacy',
      name: 'Diplomacy',
      description: 'Allows formation of non-aggression pacts with other players.',
      prerequisites: [],
      cost: 10,
      effects: {
        allianceOption: 'nonAggression'
      }
    },
    {
      id: 'espionage',
      name: 'Espionage',
      description: 'Reveals the number of armies in adjacent enemy territories.',
      prerequisites: [],
      cost: 10,
      effects: {
        informationBonus: 'enemyArmyCount'
      }
    },
    {
      id: 'trade-agreement',
      name: 'Trade Agreement',
      description: 'Allows resource sharing with allied players.',
      prerequisites: ['diplomacy'],
      cost: 15,
      effects: {
        allianceOption: 'resourceSharing'
      }
    },
    {
      id: 'covert-operations',
      name: 'Covert Operations',
      description: 'Can see cards held by other players.',
      prerequisites: ['espionage'],
      cost: 15,
      effects: {
        informationBonus: 'enemyCards'
      }
    },
    {
      id: 'military-alliance',
      name: 'Military Alliance',
      description: 'Allied players can support each other in attacks and defense.',
      prerequisites: ['trade-agreement'],
      cost: 20,
      effects: {
        allianceOption: 'militarySupport'
      }
    },
    {
      id: 'propaganda',
      name: 'Propaganda',
      description: 'Once per turn, can incite rebellion in an enemy territory, reducing its armies by 1.',
      prerequisites: ['covert-operations'],
      cost: 20,
      effects: {
        specialAbility: 'inciteRebellion'
      }
    },
    {
      id: 'diplomatic-victory',
      name: 'United Nations',
      description: 'Alliance bonuses increased by 50%. Unlocks Diplomatic Victory condition.',
      prerequisites: ['military-alliance', 'propaganda'],
      cost: 30,
      effects: {
        allianceBonus: { multiplier: 1.5 },
        victoryProgress: 'diplomatic'
      }
    }
  ],
  
  // Research Technologies
  research: [
    {
      id: 'scientific-method',
      name: 'Scientific Method',
      description: 'Research production increased by 50% in all territories.',
      prerequisites: [],
      cost: 10,
      effects: {
        resourceBonus: { type: 'research', multiplier: 1.5 }
      }
    },
    {
      id: 'education',
      name: 'Education',
      description: 'Territories with research centers produce +1 research.',
      prerequisites: [],
      cost: 10,
      effects: {
        territoryBonus: { feature: 'hasResearchCenter', resourceType: 'research', bonus: 1 }
      }
    },
    {
      id: 'universities',
      name: 'Universities',
      description: 'Can establish a research center on one territory per turn.',
      prerequisites: ['scientific-method'],
      cost: 15,
      effects: {
        specialAbility: 'buildResearchCenter'
      }
    },
    {
      id: 'knowledge-sharing',
      name: 'Knowledge Sharing',
      description: 'Research costs reduced by 25%.',
      prerequisites: ['education'],
      cost: 15,
      effects: {
        researchDiscount: 0.25
      }
    },
    {
      id: 'advanced-research',
      name: 'Advanced Research',
      description: 'Can research two technologies simultaneously.',
      prerequisites: ['universities'],
      cost: 20,
      effects: {
        specialAbility: 'parallelResearch'
      }
    },
    {
      id: 'breakthrough',
      name: 'Breakthrough',
      description: 'Once per game, instantly complete a technology research.',
      prerequisites: ['knowledge-sharing'],
      cost: 20,
      effects: {
        specialAbility: 'instantResearch'
      }
    },
    {
      id: 'technological-supremacy',
      name: 'Technological Supremacy',
      description: 'All technology effects improved by 25%. Unlocks Technological Victory condition.',
      prerequisites: ['advanced-research', 'breakthrough'],
      cost: 30,
      effects: {
        techBonus: { multiplier: 1.25 },
        victoryProgress: 'technological'
      }
    }
  ]
};

export default techTree;
