/**
 * Texas Hold'em Poker Game Logic
 */

const { findBestHand, compareHands } = require('./cardUtils');

// For system messages - will be injected
let emitSystemMessage;

// Function to set the emitSystemMessage function from server
function setSystemMessageFunction(fn) {
  emitSystemMessage = fn;
}

// Card suits and values
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/**
 * Create a new deck of cards
 * @returns {Array} Shuffled deck of cards
 */
function createDeck() {
  const deck = [];
  
  // Create a full deck of 52 cards
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({
        suit,
        value,
        code: `${value}${suit[0].toUpperCase()}`  // e.g., "AH" for Ace of Hearts
      });
    }
  }
  
  // Shuffle the deck
  return shuffleDeck(deck);
}

/**
 * Shuffle a deck of cards using the Fisher-Yates algorithm
 * @param {Array} deck - Deck of cards to shuffle
 * @returns {Array} Shuffled deck
 */
function shuffleDeck(deck) {
  const shuffled = [...deck];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Deal cards to players
 * @param {Array} deck - Deck of cards
 * @param {Array} players - Array of player objects
 * @returns {Object} Updated deck and players with hands
 */
function dealCards(deck, players) {
  const updatedDeck = [...deck];
  const activePlayers = players.filter(player => player.isActive && !player.folded);
  
  // Clear existing hands
  for (const player of activePlayers) {
    player.hand = [];
  }
  
  // Deal 2 cards to each player (one at a time)
  for (let i = 0; i < 2; i++) {
    for (const player of activePlayers) {
      const card = updatedDeck.pop();
      player.hand.push(card);
    }
  }
  
  return {
    deck: updatedDeck,
    players
  };
}

/**
 * Deal community cards
 * @param {Array} deck - Current deck
 * @param {Number} count - Number of cards to deal (3 for flop, 1 for turn, 1 for river)
 * @param {Array} existingCommunityCards - Existing community cards
 * @returns {Object} Updated deck and community cards
 */
function dealCommunityCards(deck, count, existingCommunityCards = []) {
  const updatedDeck = [...deck];
  const communityCards = [...existingCommunityCards];
  
  for (let i = 0; i < count; i++) {
    const card = updatedDeck.pop();
    communityCards.push(card);
  }
  
  return {
    deck: updatedDeck,
    communityCards
  };
}

/**
 * Get the next player in the betting round
 * @param {Array} players - Array of player objects
 * @param {Number} currentPosition - Current player position
 * @returns {Number} Next player position
 */
function getNextPlayerPosition(players, currentPosition) {
  const playersCount = players.length;
  let nextPosition = (currentPosition + 1) % playersCount;
  
  // Loop until we find an active player who hasn't folded
  while (
    !players[nextPosition].isActive || 
    players[nextPosition].folded ||
    players[nextPosition].allIn
  ) {
    nextPosition = (nextPosition + 1) % playersCount;
    
    // If we've looped through all players, there's no next player
    if (nextPosition === currentPosition) {
      return -1;
    }
  }
  
  return nextPosition;
}

/**
 * Check if betting round is complete
 * @param {Array} players - Array of player objects
 * @param {Number} currentBet - Current highest bet
 * @returns {Boolean} True if betting round is complete
 */
function isBettingRoundComplete(players, currentBet) {
  const activePlayers = players.filter(
    player => player.isActive && !player.folded
  );
  
  // If only one player is active/not folded, betting is complete
  if (activePlayers.length <= 1) {
    return true;
  }
  
  // Check if all active players have matched the current bet or are all-in
  return activePlayers.every(
    player => player.bet === currentBet || player.allIn
  );
}

/**
 * Determine winners of the hand
 * @param {Array} players - Array of player objects
 * @param {Array} communityCards - Community cards
 * @returns {Array} Array of winner objects
 */
function determineWinners(players, communityCards) {
  // Only consider active players who haven't folded
  const activePlayers = players.filter(
    player => player.isActive && !player.folded
  );
  
  if (activePlayers.length === 0) {
    return [];
  }
  
  // If only one active player remains, they win by default (everyone else folded)
  if (activePlayers.length === 1) {
    return [{ 
      id: activePlayers[0].id, 
      name: activePlayers[0].name,
      handRank: 'Winner by default (all others folded)',
      winningHand: activePlayers[0].hand || [], // Include the player's hand even when winning by default
      position: activePlayers[0].position,
      chips: activePlayers[0].chips
    }];
  }
  
  // Evaluate each player's best hand
  const playerHands = activePlayers.map(player => {
    // Combine player's hole cards with community cards
    const allCards = [...player.hand, ...communityCards];
    
    // Find best 5-card hand
    const bestHand = findBestHand(allCards);
    
    return {
      id: player.id,
      name: player.name,
      handEvaluation: bestHand,
      handRank: bestHand.rankName,
      handCards: bestHand.cards,
      player: player
    };
  });
  
  // Sort hands from best to worst
  playerHands.sort((a, b) => compareHands(a.handEvaluation, b.handEvaluation));
  
  // The best hand is the last one after sorting (compareHands returns 1 if first hand is better)
  const bestHandRank = playerHands[playerHands.length - 1].handEvaluation.rank;
  
  // Find all players with the best hand (could be multiple in case of a tie)
  const winners = playerHands.filter(hand => 
    hand.handEvaluation.rank === bestHandRank && 
    compareHands(hand.handEvaluation, playerHands[playerHands.length - 1].handEvaluation) === 0
  );
  
  // Format the winners with necessary information
  return winners.map(winner => ({
    id: winner.id,
    name: winner.name,
    handRank: winner.handRank,
    winningHand: winner.handCards,
    position: winner.player.position,
    chips: winner.player.chips
  }));
}

/**
 * Process a player action (fold, check, call, raise)
 * @param {Object} table - Table object
 * @param {String} playerId - Player ID
 * @param {String} action - Action type (fold, check, call, raise)
 * @param {Number} amount - Bet amount (for raise)
 * @returns {Object} Updated table object
 */
function processPlayerAction(table, playerId, action, amount = 0) {
  const { players, gameState } = table;
  const playerIndex = players.findIndex(p => p.id === playerId);
  
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }
  
  const player = players[playerIndex];
  
  switch (action) {
    case 'fold':
      player.folded = true;
      break;
      
    case 'check':
      // Checking is only valid if the current bet is 0 or the player has already matched the bet
      if (gameState.currentBet > 0 && player.bet < gameState.currentBet) {
        throw new Error('Cannot check when there is an active bet');
      }
      break;
      
    case 'call':
      const callAmount = gameState.currentBet - player.bet;
      
      if (callAmount > player.chips) {
        // Player doesn't have enough chips, so they go all-in
        gameState.pot += player.chips;
        player.bet += player.chips;
        player.chips = 0;
        player.allIn = true;
      } else {
        // Regular call
        gameState.pot += callAmount;
        player.bet = gameState.currentBet;
        player.chips -= callAmount;
      }
      break;
      
    case 'raise':
      const minRaise = gameState.currentBet * 2;
      
      if (amount < minRaise) {
        throw new Error(`Raise must be at least ${minRaise}`);
      }
      
      if (amount > player.chips) {
        throw new Error('Not enough chips');
      }
      
      // Process the raise
      const raiseAmount = amount - player.bet;
      gameState.pot += raiseAmount;
      player.chips -= raiseAmount;
      player.bet = amount;
      gameState.currentBet = amount;
      break;
      
    default:
      throw new Error('Invalid action');
  }
  
  // Move to the next player
  gameState.currentPlayer = getNextPlayerPosition(players, playerIndex);
  
  // Check if betting round is complete
  if (isBettingRoundComplete(players, gameState.currentBet)) {
    // Move to the next phase (e.g., flop, turn, river, showdown)
    advanceGamePhase(table);
  }
  
  return table;
}

/**
 * Advance the game to the next phase
 * @param {Object} table - Table object
 * @returns {Object} Updated table object
 */
function advanceGamePhase(table) {
  const { gameState } = table;
  const tableId = table.id;
  
  // Reset bets for the next round
  for (const player of table.players) {
    player.bet = 0;
  }
  
  gameState.currentBet = 0;
  
  switch (gameState.phase) {
    case 'preflop':
      gameState.phase = 'flop';
      const flopResult = dealCommunityCards(gameState.deck, 3);
      gameState.deck = flopResult.deck;
      gameState.communityCards = flopResult.communityCards;
      
      // Emit system message for the flop
      if (emitSystemMessage) {
        emitSystemMessage(tableId, 'Dealer: Dealing the flop');
      }
      break;
      
    case 'flop':
      gameState.phase = 'turn';
      const turnResult = dealCommunityCards(gameState.deck, 1, gameState.communityCards);
      gameState.deck = turnResult.deck;
      gameState.communityCards = turnResult.communityCards;
      
      // Emit system message for the turn
      if (emitSystemMessage) {
        emitSystemMessage(tableId, 'Dealer: Dealing the turn');
      }
      break;
      
    case 'turn':
      gameState.phase = 'river';
      const riverResult = dealCommunityCards(gameState.deck, 1, gameState.communityCards);
      gameState.deck = riverResult.deck;
      gameState.communityCards = riverResult.communityCards;
      
      // Emit system message for the river
      if (emitSystemMessage) {
        emitSystemMessage(tableId, 'Dealer: Dealing the river');
      }
      break;
      
    case 'river':
      gameState.phase = 'showdown';
      const winners = determineWinners(table.players, gameState.communityCards);
      gameState.winners = winners;
      
      // Emit system message for showdown
      if (emitSystemMessage) {
        if (winners.length === 1) {
          emitSystemMessage(tableId, `Showdown: ${winners[0].name} wins with ${winners[0].handRank}`);
        } else if (winners.length > 1) {
          const winnerNames = winners.map(w => w.name).join(', ');
          emitSystemMessage(tableId, `Showdown: Split pot! Winners: ${winnerNames} with ${winners[0].handRank}`);
        }
      }
      
      // Distribute pot to winners
      const winAmount = Math.floor(gameState.pot / winners.length);
      for (const winner of winners) {
        const winnerPlayer = table.players.find(p => p.id === winner.id);
        if (winnerPlayer) {
          winnerPlayer.chips += winAmount;
          
          // Emit system message for each winner's payout
          if (emitSystemMessage) {
            emitSystemMessage(tableId, `${winner.name} wins $${winAmount}`);
          }
        }
      }
      
      // Reset the game for the next hand
      resetGameState(table);
      break;
      
    default:
      // Start a new hand
      resetGameState(table);
      startNewHand(table);
  }
  
  return table;
}

/**
 * Reset a game state to initial values
 * @param {Object} table - Table object
 * @returns {Object} Table with reset game state
 */
function resetGameState(table) {
  // Reset game state
  table.gameState = {
    status: 'waiting',
    phase: 'waiting',
    dealer: table.gameState.dealer || 0, // Keep dealer position if it exists
    smallBlind: table.gameState.smallBlind || 10,
    bigBlind: table.gameState.bigBlind || 20,
    currentPlayer: null,
    pot: 0,
    communityCards: [],
    deck: [],
    currentBet: 0,
    winners: []
  };
  
  // Reset player states but keep their chips
  table.players.forEach(player => {
    const chips = player.chips || 1000; // Keep chips or reset to 1000
    player.hand = [];
    player.bet = 0;
    player.folded = false;
    player.allIn = false;
    player.chips = chips;
  });
  
  return table;
}

/**
 * Start a new hand
 * @param {Object} table - Table object
 * @returns {Object} Updated table object
 */
function startNewHand(table) {
  const { gameState } = table;
  const tableId = table.id;
  
  // Only start if we have at least 2 active players
  const activePlayers = table.players.filter(p => p.isActive);
  if (activePlayers.length < 2) {
    throw new Error('Need at least 2 active players to start a game');
  }
  
  // Emit system message for new hand
  if (emitSystemMessage) {
    emitSystemMessage(tableId, 'Starting a new hand');
  }
  
  // Reset game state
  gameState.communityCards = [];
  gameState.pot = 0;
  gameState.currentBet = 0;
  gameState.winners = [];
  
  // Reset player states
  table.players.forEach(player => {
    player.hand = [];
    player.bet = 0;
    player.folded = false;
    player.allIn = false;
  });
  
  // Create a new deck
  gameState.deck = createDeck();
  
  // Deal cards to players
  const dealResult = dealCards(gameState.deck, table.players);
  gameState.deck = dealResult.deck;
  
  // Emit system message for dealing cards
  if (emitSystemMessage) {
    emitSystemMessage(tableId, 'Dealer: Cards dealt to all players');
  }
  
  // Set small and big blind positions
  const smallBlindPos = (gameState.dealer + 1) % table.players.length;
  const bigBlindPos = (gameState.dealer + 2) % table.players.length;
  
  // Get player names for messages
  const dealerName = table.players[gameState.dealer].name;
  const smallBlindPlayerName = table.players[smallBlindPos].name;
  const bigBlindPlayerName = table.players[bigBlindPos].name;
  
  // Emit system message for dealer button
  if (emitSystemMessage) {
    emitSystemMessage(tableId, `Dealer button at ${dealerName}`);
  }
  
  // Post blinds
  const smallBlindPlayer = table.players[smallBlindPos];
  const bigBlindPlayer = table.players[bigBlindPos];
  
  if (smallBlindPlayer.chips <= gameState.smallBlind) {
    // Player doesn't have enough for small blind, they go all-in
    gameState.pot += smallBlindPlayer.chips;
    smallBlindPlayer.bet = smallBlindPlayer.chips;
    smallBlindPlayer.chips = 0;
    smallBlindPlayer.allIn = true;
    
    // Emit system message for small blind all-in
    if (emitSystemMessage) {
      emitSystemMessage(tableId, `${smallBlindPlayerName} posts small blind and is ALL IN with $${smallBlindPlayer.bet}`);
    }
  } else {
    gameState.pot += gameState.smallBlind;
    smallBlindPlayer.bet = gameState.smallBlind;
    smallBlindPlayer.chips -= gameState.smallBlind;
    
    // Emit system message for small blind
    if (emitSystemMessage) {
      emitSystemMessage(tableId, `${smallBlindPlayerName} posts small blind: $${gameState.smallBlind}`);
    }
  }
  
  if (bigBlindPlayer.chips <= gameState.bigBlind) {
    // Player doesn't have enough for big blind, they go all-in
    gameState.pot += bigBlindPlayer.chips;
    bigBlindPlayer.bet = bigBlindPlayer.chips;
    bigBlindPlayer.chips = 0;
    bigBlindPlayer.allIn = true;
    
    // Emit system message for big blind all-in
    if (emitSystemMessage) {
      emitSystemMessage(tableId, `${bigBlindPlayerName} posts big blind and is ALL IN with $${bigBlindPlayer.bet}`);
    }
  } else {
    gameState.pot += gameState.bigBlind;
    bigBlindPlayer.bet = gameState.bigBlind;
    bigBlindPlayer.chips -= gameState.bigBlind;
    
    // Emit system message for big blind
    if (emitSystemMessage) {
      emitSystemMessage(tableId, `${bigBlindPlayerName} posts big blind: $${gameState.bigBlind}`);
    }
  }
  
  // Set current bet to big blind
  gameState.currentBet = gameState.bigBlind;
  
  // First player to act is after the big blind
  gameState.currentPlayer = (bigBlindPos + 1) % table.players.length;
  
  // Emit system message for first player to act
  if (emitSystemMessage && gameState.currentPlayer !== null) {
    const firstToActName = table.players[gameState.currentPlayer].name;
    emitSystemMessage(tableId, `Action to ${firstToActName}`);
  }
  
  // Set phase to preflop
  gameState.phase = 'preflop';
  gameState.status = 'playing';
  
  console.log(`New hand started. Dealer: ${gameState.dealer}, SB: ${smallBlindPos}, BB: ${bigBlindPos}`);
  
  return table;
}

module.exports = {
  createDeck,
  shuffleDeck,
  dealCards,
  dealCommunityCards,
  getNextPlayerPosition,
  isBettingRoundComplete,
  determineWinners,
  processPlayerAction,
  advanceGamePhase,
  resetGameState,
  startNewHand,
  setSystemMessageFunction
}; 