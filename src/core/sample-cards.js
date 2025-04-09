/**
 * Sample cards for testing the card system
 */

import { Card } from './models.js';

/**
 * Create sample cards for testing
 * @param {string[]} territoryIds - Array of territory IDs
 * @returns {Card[]} Array of sample cards
 */
export const createSampleCards = (territoryIds = []) => {
  const cards = [];
  const types = ['infantry', 'cavalry', 'artillery'];
  
  // Create some territory cards
  for (let i = 0; i < Math.min(9, territoryIds.length); i++) {
    const type = types[i % 3];
    const territoryId = territoryIds[i];
    cards.push(new Card(`sample-card-${i+1}`, type, territoryId));
  }
  
  // Create some additional cards of each type
  cards.push(new Card('infantry-1', 'infantry'));
  cards.push(new Card('infantry-2', 'infantry'));
  cards.push(new Card('cavalry-1', 'cavalry'));
  cards.push(new Card('cavalry-2', 'cavalry'));
  cards.push(new Card('artillery-1', 'artillery'));
  cards.push(new Card('artillery-2', 'artillery'));
  
  // Add wild cards
  cards.push(new Card('wild-sample-1', 'wild'));
  cards.push(new Card('wild-sample-2', 'wild'));
  
  return cards;
};

export default createSampleCards;
