/**
 * Integration tests for the events system
 */

import { GameState, Player } from '../src/core/models.js';
import EventsManager from '../src/core/events/events-manager.js';
import { generateEventPool } from '../src/core/events/event-types.js';

describe('Events System Tests', () => {
  // Test setup
  let gameState;
  let eventsManager;
  let players;
  let territories;
  
  beforeEach(() => {
    // Create mock players
    players = [
      new Player('p1', 'Player 1', 'red'),
      new Player('p2', 'Player 2', 'blue')
    ];
    
    // Create mock territories
    territories = [
      {
        id: 'territory1',
        name: 'Test Territory 1',
        adjacentTerritories: ['territory2'],
        continent: 'testContinent',
        occupyingPlayer: 'p1',
        armies: { infantry: 5, cavalry: 0, artillery: 0 },
        resources: { food: 2, production: 1, research: 0, wealth: 0 },
        features: { hasResearchCenter: false, hasCapital: false, hasPort: false },
        getTotalArmies: () => 5
      },
      {
        id: 'territory2',
        name: 'Test Territory 2',
        adjacentTerritories: ['territory1'],
        continent: 'testContinent',
        occupyingPlayer: 'p1',
        armies: { infantry: 3, cavalry: 1, artillery: 0 },
        resources: { food: 1, production: 2, research: 1, wealth: 0 },
        features: { hasResearchCenter: false, hasCapital: false, hasPort: false },
        getTotalArmies: () => 6
      }
    ];
    
    // Assign territories to player
    players[0].territories = ['territory1', 'territory2'];
    
    // Create mock game state
    gameState = {
      players,
      territories,
      continents: [{
        id: 'testContinent',
        name: 'Test Continent',
        territories: ['territory1', 'territory2'],
        bonusArmies: 2
      }],
      config: {
        enableEvents: true
      },
      turn: 1,
      phase: 'reinforcement',
      cardDeck: [],
      discardPile: []
    };
    
    // Create events manager
    eventsManager = new EventsManager(gameState);
    gameState.eventsManager = eventsManager;
  });
  
  test('Event pool is generated correctly', () => {
    const eventPool = generateEventPool();
    expect(eventPool.length).toBeGreaterThan(0);
    
    // Check event structure
    const firstEvent = eventPool[0];
    expect(firstEvent).toHaveProperty('id');
    expect(firstEvent).toHaveProperty('name');
    expect(firstEvent).toHaveProperty('message');
    expect(firstEvent).toHaveProperty('category');
    expect(firstEvent).toHaveProperty('effectType');
  });
  
  test('Events manager initializes correctly', () => {
    expect(eventsManager.gameState).toBe(gameState);
    expect(eventsManager.activeEvents).toEqual([]);
    expect(eventsManager.eventHistory).toEqual([]);
    expect(eventsManager.eventPool.length).toBeGreaterThan(0);
  });
  
  test('Event condition checking works correctly', () => {
    // Create test event with conditions
    const event = {
      id: 'test-event',
      type: 'test-event',
      name: 'Test Event',
      message: 'Test event message',
      category: 'good',
      effectType: 'resource',
      conditions: {
        minTerritories: 2,
        minTurn: 1
      }
    };
    
    // Test with valid conditions
    expect(eventsManager.checkEventConditions(event, 'p1')).toBe(true);
    
    // Test with invalid conditions
    event.conditions.minTerritories = 5;
    expect(eventsManager.checkEventConditions(event, 'p1')).toBe(false);
    
    event.conditions.minTerritories = 2;
    event.conditions.minTurn = 10;
    expect(eventsManager.checkEventConditions(event, 'p1')).toBe(false);
  });
  
  test('Event preparation includes territory context', () => {
    // Create test event with territory scope
    const event = {
      id: 'test-territory-event',
      type: 'test-territory-event',
      name: 'Test Territory Event',
      message: 'Event affects {territory}',
      category: 'good',
      effectType: 'armies',
      effectScope: 'territory',
      targetScope: 'random',
      territoryCount: 1,
      armyEffect: 2
    };
    
    // Prepare event
    const preparedEvent = eventsManager.prepareEvent(event, 'p1');
    
    // Check that a territory was selected
    expect(preparedEvent.affectedTerritories).toBeDefined();
    expect(preparedEvent.affectedTerritories.length).toBe(1);
    
    // Check that the message was updated
    const territoryId = preparedEvent.affectedTerritories[0];
    const territory = gameState.territories.find(t => t.id === territoryId);
    expect(preparedEvent.message).toContain(territory.name);
  });
  
  test('Event effects are applied correctly', () => {
    // Test resource effect
    const resourceEvent = {
      id: 'test-resource-event',
      type: 'test-resource-event',
      name: 'Test Resource Event',
      message: 'Resource event',
      category: 'good',
      effectType: 'resource',
      effectScope: 'player',
      targetPlayerId: 'p1',
      resourceEffect: { food: 2, production: 1 }
    };
    
    // Store initial values
    const initialFood = players[0].resources.food;
    const initialProduction = players[0].resources.production;
    
    // Apply event
    eventsManager.applyEventEffects(resourceEvent);
    
    // Check that resources were updated
    expect(players[0].resources.food).toBe(initialFood + 2);
    expect(players[0].resources.production).toBe(initialProduction + 1);
    
    // Test army effect
    const armyEvent = {
      id: 'test-army-event',
      type: 'test-army-event',
      name: 'Test Army Event',
      message: 'Army event',
      category: 'good',
      effectType: 'armies',
      effectScope: 'territory',
      targetPlayerId: 'p1',
      affectedTerritories: ['territory1'],
      armyEffect: 3
    };
    
    // Store initial armies
    const initialArmies = territories[0].armies.infantry;
    
    // Apply event
    eventsManager.applyEventEffects(armyEvent);
    
    // Check that armies were updated
    expect(territories[0].armies.infantry).toBe(initialArmies + 3);
  });
  
  test('Active events are tracked correctly', () => {
    // Create test event with duration
    const event = {
      id: 'test-duration-event',
      type: 'test-duration-event',
      name: 'Test Duration Event',
      message: 'Event with duration',
      category: 'good',
      effectType: 'combat',
      effectScope: 'player',
      targetPlayerId: 'p1',
      combatEffect: { attackModifier: 1 },
      duration: 2,
      startTurn: 1
    };
    
    // Add event to active events
    eventsManager.activeEvents.push({
      ...event,
      startTurn: gameState.turn,
      endTurn: gameState.turn + event.duration
    });
    
    // Check that the event is active
    const activeEvents = eventsManager.getPlayerActiveEvents('p1');
    expect(activeEvents.length).toBe(1);
    expect(activeEvents[0].id).toBe(event.id);
    
    // Update game turn and expire events
    gameState.turn += 2;
    const expiredEvents = eventsManager.updateActiveEvents('p1');
    
    // Check that the event was expired
    expect(expiredEvents.length).toBe(1);
    expect(expiredEvents[0].id).toBe(event.id);
    expect(eventsManager.activeEvents.length).toBe(0);
  });
  
  test('Combat modifiers from events are calculated correctly', () => {
    // Create test combat event
    const combatEvent = {
      id: 'test-combat-event',
      type: 'test-combat-event',
      name: 'Test Combat Event',
      message: 'Combat event',
      category: 'good',
      effectType: 'combat',
      effectScope: 'player',
      targetPlayerId: 'p1',
      combatEffect: { attackModifier: 2, defenseModifier: 1 },
      duration: 3,
      startTurn: 1,
      endTurn: 4
    };
    
    // Add event to active events
    eventsManager.activeEvents.push(combatEvent);
    
    // Check attack modifier
    const attackModifier = eventsManager.getCombatModifiers('p1', 'territory1', 'attack');
    expect(attackModifier).toBe(2);
    
    // Check defense modifier
    const defenseModifier = eventsManager.getCombatModifiers('p1', 'territory1', 'defense');
    expect(defenseModifier).toBe(1);
    
    // Check modifier for different player (should be 0)
    const otherPlayerModifier = eventsManager.getCombatModifiers('p2', 'territory1', 'attack');
    expect(otherPlayerModifier).toBe(0);
  });
  
  test('Movement modifiers from events are calculated correctly', () => {
    // Create test movement event
    const movementEvent = {
      id: 'test-movement-event',
      type: 'test-movement-event',
      name: 'Test Movement Event',
      message: 'Movement event',
      category: 'good',
      effectType: 'movement',
      effectScope: 'player',
      targetPlayerId: 'p1',
      movementEffect: { rangeModifier: 1 },
      duration: 2,
      startTurn: 1,
      endTurn: 3
    };
    
    // Add event to active events
    eventsManager.activeEvents.push(movementEvent);
    
    // Check movement modifier
    const movementModifier = eventsManager.getMovementModifiers('p1');
    expect(movementModifier).toBe(1);
    
    // Check modifier for different player (should be 0)
    const otherPlayerModifier = eventsManager.getMovementModifiers('p2');
    expect(otherPlayerModifier).toBe(0);
  });
  
  test('Rebellion events can reduce armies and potentially change territory ownership', () => {
    // Create test rebellion event
    const rebellionEvent = {
      id: 'test-rebellion-event',
      type: 'test-rebellion-event',
      name: 'Test Rebellion Event',
      message: 'Rebellion event',
      category: 'bad',
      effectType: 'rebellion',
      effectScope: 'territory',
      targetPlayerId: 'p1',
      affectedTerritories: ['territory1'],
      rebellionStrength: 3,
      territoryLostOnRebellion: true
    };
    
    // Store initial armies
    const initialArmies = territories[0].armies.infantry;
    
    // Apply event
    eventsManager.applyEventEffects(rebellionEvent);
    
    // Check that armies were reduced
    expect(territories[0].armies.infantry).toBe(Math.max(0, initialArmies - 3));
    
    // Apply a stronger rebellion that will conquer the territory
    territories[0].armies.infantry = 2;
    
    // Apply rebellion event again
    eventsManager.applyEventEffects(rebellionEvent);
    
    // Check that territory ownership changed
    expect(territories[0].armies.infantry).toBeGreaterThan(0); // Rebels occupy with some armies
    expect(territories[0].occupyingPlayer).toBeNull(); // No owner (neutral)
    expect(players[0].territories).not.toContain('territory1'); // Removed from player's territories
  });
  
  test('Events can add or remove feature from territories', () => {
    // Create test feature event
    const featureEvent = {
      id: 'test-feature-event',
      type: 'test-feature-event',
      name: 'Test Feature Event',
      message: 'Feature event',
      category: 'good',
      effectType: 'territory',
      effectScope: 'territory',
      targetPlayerId: 'p1',
      affectedTerritories: ['territory1'],
      territoryEffect: {
        feature: 'hasResearchCenter',
        value: true,
        resources: {
          research: 1
        }
      }
    };
    
    // Apply event
    eventsManager.applyEventEffects(featureEvent);
    
    // Check that feature was added
    expect(territories[0].features.hasResearchCenter).toBe(true);
    
    // Create event to remove feature
    const removeFeatureEvent = {
      id: 'test-remove-feature-event',
      type: 'test-remove-feature-event',
      name: 'Test Remove Feature Event',
      message: 'Remove feature event',
      category: 'bad',
      effectType: 'territory',
      effectScope: 'territory',
      targetPlayerId: 'p1',
      affectedTerritories: ['territory1'],
      territoryEffect: {
        feature: 'hasResearchCenter',
        value: false
      }
    };
    
    // Apply event
    eventsManager.applyEventEffects(removeFeatureEvent);
    
    // Check that feature was removed
    expect(territories[0].features.hasResearchCenter).toBe(false);
  });
  
  test('Events with duration can be reversed when they expire', () => {
    // Create test event with reversal
    const reversibleEvent = {
      id: 'test-reversible-event',
      type: 'test-reversible-event',
      name: 'Test Reversible Event',
      message: 'Reversible event',
      category: 'neutral',
      effectType: 'territory',
      effectScope: 'territory',
      targetPlayerId: 'p1',
      affectedTerritories: ['territory1'],
      territoryEffect: {
        feature: 'hasPort',
        value: true,
        resources: {
          wealth: 1
        }
      },
      duration: 2,
      startTurn: 1,
      endTurn: 3,
      reverseOnExpire: true
    };
    
    // Add event to active events
    eventsManager.activeEvents.push(reversibleEvent);
    
    // Apply event effects
    eventsManager.applyEventEffects(reversibleEvent);
    
    // Check that feature was added
    expect(territories[0].features.hasPort).toBe(true);
    
    // Update game turn to expire the event
    gameState.turn = 3;
    
    // Update active events and reverse effects
    const expiredEvents = eventsManager.updateActiveEvents('p1');
    
    // Check that the event was expired and effects reversed
    expect(expiredEvents.length).toBe(1);
    expect(territories[0].features.hasPort).toBe(false);
  });
  
  test('checkForEvent returns an appropriate event based on conditions', () => {
    // Mock the event pool with a test event
    eventsManager.eventPool = [{
      id: 'test-event',
      type: 'test-event',
      name: 'Test Event',
      message: '{player} gets a test event',
      category: 'good',
      effectType: 'resource',
      effectScope: 'player',
      resourceEffect: { food: 1 },
      duration: 0,
      probability: 1, // 100% probability for testing
      maxOccurrences: 1,
      conditions: {
        minTerritories: 1
      }
    }];
    
    // Override random check to always trigger events
    const originalRandom = Math.random;
    Math.random = jest.fn().mockReturnValue(0.1); // Below eventProbability
    
    // Check for event
    const event = eventsManager.checkForEvent('p1');
    
    // Restore original Math.random
    Math.random = originalRandom;
    
    // Check that an event was returned
    expect(event).toBeDefined();
    expect(event.type).toBe('test-event');
    expect(event.targetPlayerId).toBe('p1');
    expect(event.message).toContain('Player 1'); // Player name inserted
    
    // Check that the event was added to history
    expect(eventsManager.eventHistory.length).toBe(1);
    expect(eventsManager.eventHistory[0].type).toBe('test-event');
  });
});
