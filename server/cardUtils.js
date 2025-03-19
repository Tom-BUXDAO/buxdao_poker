/**
 * Utility functions for handling card mappings and hand evaluation
 */

/**
 * Maps card codes from the backend to frontend image filenames 
 * @param {Object} card - Card object with suit and value
 * @returns {String} Filename for the card image
 */
function mapCardToFilename(card) {
  if (!card) return null;
  
  const { suit, value } = card;
  
  // Map suits to their abbreviations
  const suitMap = {
    'hearts': 'H',
    'diamonds': 'D',
    'clubs': 'C',
    'spades': 'S'
  };
  
  // Map values (keep face cards as is, but handle number cards)
  let cardValue = value;
  if (['J', 'Q', 'K', 'A'].includes(value)) {
    // Face cards are already represented correctly
  } else {
    // Number cards
    cardValue = value;
  }
  
  // Combine to create the filename (e.g., "AH" for Ace of Hearts)
  return `${cardValue}${suitMap[suit]}`;
}

// Card value mapping for hand strength calculation
const CARD_VALUES = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14
};

// Hand rankings
const HAND_RANKINGS = {
  HIGH_CARD: 1,
  PAIR: 2,
  TWO_PAIR: 3,
  THREE_OF_A_KIND: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  FOUR_OF_A_KIND: 8,
  STRAIGHT_FLUSH: 9,
  ROYAL_FLUSH: 10
};

/**
 * Evaluate a poker hand (5 or more cards)
 * @param {Array} cards - Array of card objects
 * @returns {Object} Hand ranking and detailed info
 */
function evaluateHand(cards) {
  // Need at least 5 cards
  if (cards.length < 5) {
    throw new Error('Need at least 5 cards to evaluate hand');
  }
  
  // Sort cards by value (high to low)
  const sortedCards = [...cards].sort((a, b) => CARD_VALUES[b.value] - CARD_VALUES[a.value]);
  
  // Check for royal flush, straight flush, flush, straight
  const flushResult = checkForFlush(sortedCards);
  const straightResult = checkForStraight(sortedCards);
  
  // Royal flush
  if (flushResult.isFlush && straightResult.isStraight && CARD_VALUES[sortedCards[0].value] === 14) {
    return {
      rank: HAND_RANKINGS.ROYAL_FLUSH,
      rankName: 'Royal Flush',
      cards: flushResult.cards.slice(0, 5)
    };
  }
  
  // Straight flush
  if (flushResult.isFlush && straightResult.isStraight) {
    return {
      rank: HAND_RANKINGS.STRAIGHT_FLUSH,
      rankName: 'Straight Flush',
      highCard: straightResult.highCard,
      cards: straightResult.cards.filter(card => card.suit === flushResult.suit).slice(0, 5)
    };
  }
  
  // Check for four of a kind, full house, three of a kind, two pair, pair
  const valueGroups = groupCardsByValue(sortedCards);
  
  // Four of a kind
  const fourOfAKind = valueGroups.find(group => group.length === 4);
  if (fourOfAKind) {
    const kickers = sortedCards.filter(card => CARD_VALUES[card.value] !== CARD_VALUES[fourOfAKind[0].value]).slice(0, 1);
    return {
      rank: HAND_RANKINGS.FOUR_OF_A_KIND,
      rankName: 'Four of a Kind',
      value: fourOfAKind[0].value,
      kickers,
      cards: [...fourOfAKind, ...kickers]
    };
  }
  
  // Full house
  const threeOfAKind = valueGroups.find(group => group.length === 3);
  const pairs = valueGroups.filter(group => group.length === 2);
  
  if (threeOfAKind && pairs.length > 0) {
    return {
      rank: HAND_RANKINGS.FULL_HOUSE,
      rankName: 'Full House',
      threeValue: threeOfAKind[0].value,
      pairValue: pairs[0][0].value,
      cards: [...threeOfAKind, ...pairs[0].slice(0, 2)]
    };
  }
  
  // Flush
  if (flushResult.isFlush) {
    return {
      rank: HAND_RANKINGS.FLUSH,
      rankName: 'Flush',
      suit: flushResult.suit,
      cards: flushResult.cards.slice(0, 5)
    };
  }
  
  // Straight
  if (straightResult.isStraight) {
    return {
      rank: HAND_RANKINGS.STRAIGHT,
      rankName: 'Straight',
      highCard: straightResult.highCard,
      cards: straightResult.cards.slice(0, 5)
    };
  }
  
  // Three of a kind
  if (threeOfAKind) {
    const kickers = sortedCards.filter(card => CARD_VALUES[card.value] !== CARD_VALUES[threeOfAKind[0].value]).slice(0, 2);
    return {
      rank: HAND_RANKINGS.THREE_OF_A_KIND,
      rankName: 'Three of a Kind',
      value: threeOfAKind[0].value,
      kickers,
      cards: [...threeOfAKind, ...kickers]
    };
  }
  
  // Two pair
  if (pairs.length >= 2) {
    const kickers = sortedCards.filter(card => 
      CARD_VALUES[card.value] !== CARD_VALUES[pairs[0][0].value] && 
      CARD_VALUES[card.value] !== CARD_VALUES[pairs[1][0].value]
    ).slice(0, 1);
    
    return {
      rank: HAND_RANKINGS.TWO_PAIR,
      rankName: 'Two Pair',
      highPairValue: pairs[0][0].value,
      lowPairValue: pairs[1][0].value,
      kickers,
      cards: [...pairs[0], ...pairs[1], ...kickers]
    };
  }
  
  // Pair
  if (pairs.length === 1) {
    const kickers = sortedCards.filter(card => 
      CARD_VALUES[card.value] !== CARD_VALUES[pairs[0][0].value]
    ).slice(0, 3);
    
    return {
      rank: HAND_RANKINGS.PAIR,
      rankName: 'Pair',
      value: pairs[0][0].value,
      kickers,
      cards: [...pairs[0], ...kickers]
    };
  }
  
  // High card
  const highCardHand = sortedCards.slice(0, 5);
  return {
    rank: HAND_RANKINGS.HIGH_CARD,
    rankName: 'High Card',
    value: highCardHand[0].value,
    kickers: highCardHand.slice(1),
    cards: highCardHand
  };
}

/**
 * Group cards by value
 * @param {Array} cards - Array of card objects
 * @returns {Array} Array of card groups by value, sorted by group size and value
 */
function groupCardsByValue(cards) {
  // Group cards by value
  const groups = {};
  
  for (const card of cards) {
    if (!groups[card.value]) {
      groups[card.value] = [];
    }
    groups[card.value].push(card);
  }
  
  // Convert to array and sort by group size and value (descending)
  return Object.values(groups).sort((a, b) => {
    if (a.length !== b.length) {
      return b.length - a.length;
    }
    return CARD_VALUES[b[0].value] - CARD_VALUES[a[0].value];
  });
}

/**
 * Check for a flush
 * @param {Array} cards - Array of card objects
 * @returns {Object} Flush result
 */
function checkForFlush(cards) {
  // Count cards by suit
  const suitCounts = {};
  
  for (const card of cards) {
    if (!suitCounts[card.suit]) {
      suitCounts[card.suit] = [];
    }
    suitCounts[card.suit].push(card);
  }
  
  // Find a suit with at least 5 cards
  for (const suit in suitCounts) {
    if (suitCounts[suit].length >= 5) {
      return {
        isFlush: true,
        suit,
        cards: suitCounts[suit]
      };
    }
  }
  
  return { isFlush: false };
}

/**
 * Check for a straight
 * @param {Array} cards - Array of card objects, already sorted by value
 * @returns {Object} Straight result
 */
function checkForStraight(cards) {
  // Handle duplicate values - take only the highest card of each value
  const uniqueValues = [];
  const seen = new Set();
  
  for (const card of cards) {
    if (!seen.has(card.value)) {
      uniqueValues.push(card);
      seen.add(card.value);
    }
  }
  
  // Special case for Ace-low straight (A-2-3-4-5)
  if (uniqueValues.length >= 5 && 
      uniqueValues[0].value === 'A' && 
      uniqueValues[uniqueValues.length - 1].value === '2') {
    
    // Find 5,4,3,2
    const has5 = uniqueValues.some(card => card.value === '5');
    const has4 = uniqueValues.some(card => card.value === '4');
    const has3 = uniqueValues.some(card => card.value === '3');
    const has2 = uniqueValues.some(card => card.value === '2');
    
    if (has5 && has4 && has3 && has2) {
      // Get the actual cards for 5,4,3,2,A
      const straight = [
        ...uniqueValues.filter(card => card.value === '5'),
        ...uniqueValues.filter(card => card.value === '4'),
        ...uniqueValues.filter(card => card.value === '3'),
        ...uniqueValues.filter(card => card.value === '2'),
        ...uniqueValues.filter(card => card.value === 'A')
      ];
      
      return {
        isStraight: true,
        highCard: '5',
        cards: straight
      };
    }
  }
  
  // Check for regular straight
  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    const startValue = CARD_VALUES[uniqueValues[i].value];
    const isStraight = uniqueValues.slice(i, i + 5).every((card, index) => {
      return CARD_VALUES[card.value] === startValue - index;
    });
    
    if (isStraight) {
      return {
        isStraight: true,
        highCard: uniqueValues[i].value,
        cards: uniqueValues.slice(i, i + 5)
      };
    }
  }
  
  return { isStraight: false };
}

/**
 * Compare two hands to determine the winner
 * @param {Object} hand1 - First hand result from evaluateHand()
 * @param {Object} hand2 - Second hand result from evaluateHand()
 * @returns {Number} 1 if hand1 wins, -1 if hand2 wins, 0 if tie
 */
function compareHands(hand1, hand2) {
  // Compare hand ranks first
  if (hand1.rank !== hand2.rank) {
    return hand1.rank > hand2.rank ? 1 : -1;
  }
  
  // Same hand rank, need to break ties
  switch (hand1.rank) {
    case HAND_RANKINGS.ROYAL_FLUSH:
      // Royal flush always ties (same 5 cards)
      return 0;
      
    case HAND_RANKINGS.STRAIGHT_FLUSH:
      // Compare high card of straight
      return CARD_VALUES[hand1.highCard] > CARD_VALUES[hand2.highCard] ? 1 :
             CARD_VALUES[hand1.highCard] < CARD_VALUES[hand2.highCard] ? -1 : 0;
      
    case HAND_RANKINGS.FOUR_OF_A_KIND:
      // Compare value of four of a kind, then kicker
      if (CARD_VALUES[hand1.value] !== CARD_VALUES[hand2.value]) {
        return CARD_VALUES[hand1.value] > CARD_VALUES[hand2.value] ? 1 : -1;
      }
      return compareKickers(hand1.kickers, hand2.kickers);
      
    case HAND_RANKINGS.FULL_HOUSE:
      // Compare value of three of a kind, then pair
      if (CARD_VALUES[hand1.threeValue] !== CARD_VALUES[hand2.threeValue]) {
        return CARD_VALUES[hand1.threeValue] > CARD_VALUES[hand2.threeValue] ? 1 : -1;
      }
      return CARD_VALUES[hand1.pairValue] > CARD_VALUES[hand2.pairValue] ? 1 :
             CARD_VALUES[hand1.pairValue] < CARD_VALUES[hand2.pairValue] ? -1 : 0;
      
    case HAND_RANKINGS.FLUSH:
      // Compare cards in flush from highest to lowest
      return compareCardsHighToLow(hand1.cards, hand2.cards);
      
    case HAND_RANKINGS.STRAIGHT:
      // Compare high card of straight
      return CARD_VALUES[hand1.highCard] > CARD_VALUES[hand2.highCard] ? 1 :
             CARD_VALUES[hand1.highCard] < CARD_VALUES[hand2.highCard] ? -1 : 0;
      
    case HAND_RANKINGS.THREE_OF_A_KIND:
      // Compare value of three of a kind, then kickers
      if (CARD_VALUES[hand1.value] !== CARD_VALUES[hand2.value]) {
        return CARD_VALUES[hand1.value] > CARD_VALUES[hand2.value] ? 1 : -1;
      }
      return compareKickers(hand1.kickers, hand2.kickers);
      
    case HAND_RANKINGS.TWO_PAIR:
      // Compare high pair, then low pair, then kicker
      if (CARD_VALUES[hand1.highPairValue] !== CARD_VALUES[hand2.highPairValue]) {
        return CARD_VALUES[hand1.highPairValue] > CARD_VALUES[hand2.highPairValue] ? 1 : -1;
      }
      if (CARD_VALUES[hand1.lowPairValue] !== CARD_VALUES[hand2.lowPairValue]) {
        return CARD_VALUES[hand1.lowPairValue] > CARD_VALUES[hand2.lowPairValue] ? 1 : -1;
      }
      return compareKickers(hand1.kickers, hand2.kickers);
      
    case HAND_RANKINGS.PAIR:
      // Compare value of pair, then kickers
      if (CARD_VALUES[hand1.value] !== CARD_VALUES[hand2.value]) {
        return CARD_VALUES[hand1.value] > CARD_VALUES[hand2.value] ? 1 : -1;
      }
      return compareKickers(hand1.kickers, hand2.kickers);
      
    case HAND_RANKINGS.HIGH_CARD:
      // Compare kickers from highest to lowest
      return compareCardsHighToLow(hand1.cards, hand2.cards);
      
    default:
      return 0;
  }
}

/**
 * Compare kickers to break ties
 * @param {Array} kickers1 - First set of kickers
 * @param {Array} kickers2 - Second set of kickers
 * @returns {Number} 1 if kickers1 wins, -1 if kickers2 wins, 0 if tie
 */
function compareKickers(kickers1, kickers2) {
  return compareCardsHighToLow(kickers1, kickers2);
}

/**
 * Compare cards from highest to lowest to break ties
 * @param {Array} cards1 - First set of cards
 * @param {Array} cards2 - Second set of cards
 * @returns {Number} 1 if cards1 wins, -1 if cards2 wins, 0 if tie
 */
function compareCardsHighToLow(cards1, cards2) {
  const length = Math.min(cards1.length, cards2.length);
  
  for (let i = 0; i < length; i++) {
    const value1 = CARD_VALUES[cards1[i].value];
    const value2 = CARD_VALUES[cards2[i].value];
    
    if (value1 !== value2) {
      return value1 > value2 ? 1 : -1;
    }
  }
  
  return 0;
}

/**
 * Find the best 5-card hand from 7 cards
 * @param {Array} cards - Array of 7 card objects (2 hole cards + 5 community cards)
 * @returns {Object} Best hand evaluation
 */
function findBestHand(cards) {
  if (cards.length < 5) {
    throw new Error('Need at least 5 cards to find best hand');
  }
  
  // If we have exactly 5 cards, return evaluation of those cards
  if (cards.length === 5) {
    return evaluateHand(cards);
  }
  
  let bestHand = null;
  
  // Generate all possible 5-card combinations from the cards
  const combinations = getCombinations(cards, 5);
  
  // Evaluate each combination and keep the best hand
  for (const combo of combinations) {
    const handEval = evaluateHand(combo);
    
    if (!bestHand || compareHands(handEval, bestHand) > 0) {
      bestHand = handEval;
    }
  }
  
  return bestHand;
}

/**
 * Generate all possible combinations of k elements from array
 * @param {Array} array - Input array
 * @param {Number} k - Size of each combination
 * @returns {Array} Array of combinations
 */
function getCombinations(array, k) {
  const result = [];
  
  // Helper function to generate combinations recursively
  function backtrack(start, currentCombo) {
    if (currentCombo.length === k) {
      result.push([...currentCombo]);
      return;
    }
    
    for (let i = start; i < array.length; i++) {
      currentCombo.push(array[i]);
      backtrack(i + 1, currentCombo);
      currentCombo.pop();
    }
  }
  
  backtrack(0, []);
  return result;
}

module.exports = {
  mapCardToFilename,
  evaluateHand,
  compareHands,
  findBestHand,
  HAND_RANKINGS,
  CARD_VALUES
}; 