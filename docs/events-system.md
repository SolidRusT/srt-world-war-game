# Events System Documentation

The events system adds unpredictability and dynamic gameplay elements to our RISK-inspired strategy game. This document provides a detailed overview of how events work, their implementation, and how to create new events.

## System Overview

Events are random occurrences that can affect various aspects of gameplay, including resources, armies, combat abilities, and territory features. The events system is designed to:

- Create unpredictable gameplay situations that players must adapt to
- Provide both advantages and challenges to players
- Add narrative elements to enhance player engagement
- Create memorable gameplay moments

## Event Categories

Events fall into three main categories:

1. **Good Events**: Provide benefits to players like resource boosts, army reinforcements, or combat bonuses.
2. **Bad Events**: Present challenges through resource losses, army reductions, or combat penalties.
3. **Neutral Events**: Create mixed effects that have both positive and negative consequences.

## Event Effect Types

Events can affect various game systems:

- **Resource**: Modify player resources (food, production, research, wealth)
- **Armies**: Add or remove armies from territories
- **Combat**: Apply combat bonuses or penalties to attack or defense rolls
- **Movement**: Modify movement capabilities during fortification
- **Territory**: Change territory features or resource production
- **Rebellion**: Cause rebellions in territories (potentially changing ownership)
- **Card**: Give or take cards from players
- **Technology**: Grant or remove technologies

## Event Duration

Events can have different durations:

- **Immediate**: Apply effects once and end
- **Multi-turn**: Effects persist for a specified number of turns
- **Reversible**: Effects can be reversed when the event expires

## Event Triggering

Events can trigger based on various conditions:

- **Turn-based**: Chance to trigger at the start of a player's turn
- **Resource-based**: Trigger when resource levels meet certain thresholds
- **Territory-based**: Trigger based on territory ownership or features
- **Technology-based**: Trigger when specific technologies are researched
- **Continent-based**: Trigger when a player controls a continent

## Technical Implementation

### Core Components

1. **EventsManager**: Main class that handles event triggering, tracking, and application
2. **event-types.js**: Defines all possible events and their parameters
3. **EventsDisplay**: UI component for showing active events and history
4. **EventNotification**: UI component for displaying event notifications

### Event Structure

Each event has the following properties:

```javascript
{
  id: 'event-id',              // Unique identifier
  type: 'event-type',          // Event type for categorization
  name: 'Event Name',          // Display name
  message: 'Event message',    // Description shown to player
  category: 'good',            // Category: 'good', 'bad', or 'neutral'
  effectType: 'resource',      // Effect type (resource, armies, combat, etc.)
  effectScope: 'player',       // Scope: 'player', 'territory', or 'territories'
  targetScope: 'player',       // Target: 'player', 'continent', or 'random'
  territoryCount: 1,           // Number of territories affected (if applicable)
  duration: 0,                 // Number of turns the effect persists (0 = immediate)
  probability: 0.05,           // Base probability of event triggering (0-1)
  maxOccurrences: 3,           // Maximum number of times this event can occur
  conditions: {                // Trigger conditions
    minTerritories: 5,         // Minimum territories player must own
    minTurn: 3,                // Minimum game turn
    hasTechnology: 'tech-id',  // Required technology
    controlsContinent: 'id',   // Continent player must control
    minResource: {             // Minimum resource level
      type: 'wealth',
      value: 5
    }
  },
  // Effect parameters based on effectType
  resourceEffect: { food: 3 }, // Resource effect
  armyEffect: 2,               // Army effect
  combatEffect: {              // Combat effect
    attackModifier: 1,
    defenseModifier: -1
  },
  // Other parameters specific to the effect type
  reverseOnExpire: true        // Whether to reverse effects when expired
}
```

### Event Flow

1. At the start of a player's turn, `EventsManager.updateActiveEvents()` checks for expired events and removes them.
2. Then, `EventsManager.checkForEvent()` is called to see if a new event should trigger.
3. If an event triggers, `EventsManager.prepareEvent()` customizes the event for the current game state.
4. `EventsManager.applyEventEffects()` applies the event's effects to the game state.
5. The event is added to `activeEvents` if it has a duration, or just to `eventHistory` if it's immediate.
6. The UI displays a notification to the player about the event.

### Event Application

Different effect types are handled in the `applyEventEffects` method:

- **Resource effects**: Update player resource values
- **Army effects**: Add or remove armies from territories
- **Combat effects**: Apply modifiers when calculating combat bonuses
- **Movement effects**: Modify movement range in fortification phase
- **Territory effects**: Change territory features or resource production
- **Rebellion effects**: Remove armies and potentially change territory ownership
- **Card effects**: Add or remove cards from player's hand
- **Technology effects**: Grant or remove technologies from player

## Creating New Events

To add a new event to the game:

1. Define the event in `event-types.js` following the event structure above
2. Consider the balance implications (probability, effect strength, conditions)
3. Ensure the event message is clear and descriptive
4. Test the event with different game states to verify proper functioning

### Example: Creating a New Resource Event

```javascript
{
  id: 'gold-discovery',
  type: 'gold-discovery',
  name: 'Gold Discovery',
  message: '{player} discovers gold deposits in {territory}!',
  category: 'good',
  effectType: 'territory',
  effectScope: 'territory',
  targetScope: 'random',
  territoryCount: 1,
  territoryEffect: {
    resources: { wealth: 2 }
  },
  duration: 0,
  probability: 0.06,
  maxOccurrences: 3,
  conditions: {
    minTurn: 5
  }
}
```

## Integration with Game Systems

The events system integrates with various game systems:

- **Combat System**: Events can modify combat rolls through the `getCombatModifiers` method
- **Movement System**: Events can extend movement range via the `getMovementModifiers` method
- **Resource System**: Events directly modify resource values
- **Territory Control**: Rebellions can change territory ownership
- **Save/Load System**: Event states are serialized and deserialized with the game state

## Future Enhancements

Potential improvements to the events system:

1. **Player Choices**: Events that present players with multiple options
2. **Cascading Events**: Events that can trigger follow-up events
3. **Global Events**: Events that affect all players simultaneously
4. **Event Chains**: Series of connected events that tell a story
5. **Player-Triggered Events**: Events that players can deliberately trigger
6. **Customizable Event Pools**: Allow players to select which event types to include

## Conclusion

The events system adds depth and unpredictability to gameplay, creating unique situations that players must adapt to. It enhances replayability by ensuring that no two games play exactly the same way.
