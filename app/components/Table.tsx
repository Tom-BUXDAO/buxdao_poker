'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Player } from './Player';
import { CommunityCards, PokerChip } from './TableElements';
import { Card, Player as PlayerType, GameState } from '../types';
import { useSocket } from '../context/SocketContext';

// Table Component
interface TableProps {
  onGameStateChange?: (gameState: GameState) => void;
  addSystemMessage?: (message: string) => void;
  playerPosition?: number;
  onFold?: (handler: () => void) => void;
  onCall?: (handler: (amount: number) => void) => void;
  onRaise?: (handler: (amount: number) => void) => void;
  startGame?: () => void;
  forceTableState?: any;
}

const Table: React.FC<TableProps> = ({ 
  onGameStateChange, 
  addSystemMessage, 
  playerPosition = 7,
  onFold,
  onCall,
  onRaise,
  startGame,
  forceTableState
}) => {
  // Internal state
  const [players, setPlayers] = useState<PlayerType[]>([
    // Player 1 (top left)
    { id: 1, position: 0, name: "Player 1", chips: 1000, bet: 0, isActive: false, folded: false, hand: [], avatar: "https://arweave.net/Q3Ljpx6BNV98Wv6mHO41_vgXMbGXeZgi9YSwLvHDV9M?ext=png" },
    // Player 2 (top center)
    { id: 2, position: 1, name: "Player 2", chips: 1000, bet: 0, isActive: false, folded: false, hand: [], avatar: "https://nftstorage.link/ipfs/bafybeigo2argdud77koqsik6bucisxhsqix3emkkmxw6x54q6y5zjhhwva/10.png" },
    // Player 3 (top right)
    { id: 3, position: 2, name: "Player 3", chips: 1000, bet: 0, isActive: false, folded: false, hand: [], avatar: "https://arweave.net/dDbt5xjUijtWa9cgQI8pNgQxQWGtWzSjCai6_Q8IYNw" },
    // Player 4 (middle right)
    { id: 4, position: 3, name: "Player 4", chips: 1000, bet: 0, isActive: false, folded: false, hand: [], avatar: "https://nftstorage.link/ipfs/bafybeieecnb4ngc6rnsagyvmfciy5sjgqbhpxrehgfv6qcbntq3hdrm6wq/126.png" },
    // Player 5 (bottom right)
    { id: 5, position: 4, name: "Player 5", chips: 1000, bet: 0, isActive: false, folded: false, hand: [], avatar: "https://nftstorage.link/ipfs/bafybeieecnb4ngc6rnsagyvmfciy5sjgqbhpxrehgfv6qcbntq3hdrm6wq/437.png" },
    // Player 6 (bottom center)
    { id: 6, position: 5, name: "Player 6", chips: 1000, bet: 0, isActive: false, folded: false, hand: [], avatar: "https://arweave.net/yheuGMtf3wV622CC9vaXJNQ8MSRKblgYfYmzpvma2_Y" },
    // Player 7 (bottom left)
    { id: 7, position: 6, name: "Player 7", chips: 1000, bet: 0, isActive: false, folded: false, hand: [], avatar: "https://arweave.net/xptNzwgdR4ReqkZvhCBpdRAcBczygNr7p2Kw2I0XkJM" },
    // Player 8 (middle left)
    { id: 8, position: 7, name: "Player 8", chips: 1000, bet: 0, isActive: false, folded: false, hand: [], avatar: "https://gateway.pinata.cloud/ipfs/QmXrUnsKMogkfifzqSb2odBacrYxagsCZFdEHrFjiCY3Fd" },
  ]);
  
  // Get socket from context
  const { socket, isConnected } = useSocket();
  
  const [gameState, setGameState] = useState({
    status: 'waiting', // 'waiting', 'playing'
    phase: 'preflop' as string, // 'preflop', 'flop', 'turn', 'river', 'showdown'
    dealer: 0, // Dealer position (0-7)
    activePlayer: 2, // Active player (0-7)
    smallBlind: 10,
    bigBlind: 20,
    pot: 0, // Total pot
    communityCards: [] as Card[], // Community cards
    gameId: '' // Unique ID for the current game
  });
  
  // Track mounted state to prevent updates after unmount
  const isMountedRef = useRef(true);
  // Use a ref for player position to prevent circular dependencies
  const playerPositionRef = useRef(playerPosition); // Initialize with prop value
  // Refs to track state changes for preventing unnecessary updates
  const prevStateKeyRef = useRef('');
  const prevCardsStringRef = useRef('');
  const lastActivePlayerRef = useRef(-1);
  const lastStatusRef = useRef('waiting');
  const lastPotRef = useRef(0);
  // Refs to track if we've already loaded state - prevents infinite update loop
  const loadedGameRef = useRef(true); // Start with true when onGameStateChange exists
  const loadedPlayersRef = useRef(true); // Start with true when onGameStateChange exists
  
  // Sample player data
  const [communityCards, setCommunityCards] = useState<Card[]>([]);

  // Helper to find the next active player
  const findNextActivePlayer = (currentPos: number): number => {
    let nextPos = (currentPos + 1) % 8;
    // Loop until we find a player who hasn't folded
    while (players[nextPos].folded && nextPos !== currentPos) {
      nextPos = (nextPos + 1) % 8;
    }
    return nextPos;
  };
  
  // Helper to save game state to localStorage - with improved throttling
  interface SaveGameStateFunction {
    (gameState: any, players: PlayerType[]): void;
    lastSaveTime: number;
  }

  const saveGameState: SaveGameStateFunction = (gameState: any, players: PlayerType[]) => {
    try {
      // Add throttling to prevent excessive localStorage updates
      // Only allow saves every 50ms
      const now = Date.now();
      if (!saveGameState.lastSaveTime) {
        saveGameState.lastSaveTime = 0;
      }

      // Skip if we've saved too recently
      if (now - saveGameState.lastSaveTime < 50) {
        return;
      }
      
      // Update the last save time
      saveGameState.lastSaveTime = now;
      
      // Don't prevent localStorage propagation
      window._socketUpdateInProgress = false;
      
      // Make sure we have the userCards property required by the GameState interface
      const completeGameState = {
        ...gameState,
        userCards: [] // Add empty userCards to satisfy the interface
      };
      
      // Clear existing data first to ensure events trigger on every update
      localStorage.removeItem('pokerGameState');
      localStorage.removeItem('pokerPlayers');
      
      // Save with a version to force a new event
      const saveVersion = Date.now();
      localStorage.setItem('pokerGameStateVersion', saveVersion.toString());
      localStorage.setItem('pokerGameState', JSON.stringify(completeGameState));
      localStorage.setItem('pokerPlayers', JSON.stringify(players));
    } catch (e) {
      console.error("Error saving game state to localStorage:", e);
      window._socketUpdateInProgress = false;
    }
  };
  
  // Add the property to the function for throttling
  saveGameState.lastSaveTime = 0;
  
  // Helper to save system messages to localStorage
  const saveSystemMessage = (message: string) => {
    try {
      const now = new Date();
      const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Get existing messages or create new array
      const existingMessages = localStorage.getItem('pokerChatMessages');
      let messages = [];
      
      if (existingMessages) {
        messages = JSON.parse(existingMessages);
      }
      
      // Add new message
      messages.push({
        type: 'system',
        message,
        time: timeString
      });
      
      // Clear existing messages first to ensure the event triggers
      localStorage.removeItem('pokerChatMessages');
      
      // Save with a version to force a new event
      localStorage.setItem('pokerChatVersion', Date.now().toString());
      localStorage.setItem('pokerChatMessages', JSON.stringify(messages));
    } catch (e) {
      console.error("Error saving system message to localStorage:", e);
    }
  };

  // Action handling functions
  const handleFold = useCallback(() => {
    if (playerPosition === undefined || gameState.status !== 'playing') return;
    
    console.log(`Player ${playerPosition + 1} is folding`);
    
    // Update player state to mark as folded
    const updatedPlayers = [...players];
    const currentPlayer = updatedPlayers[playerPosition];
    
    // Get player's current bet before folding
    const currentBet = currentPlayer.bet;
    
    // Mark as folded
    currentPlayer.folded = true;
    
    // Move action to next player
    const nextPlayerPos = findNextActivePlayer(playerPosition);
    updatedPlayers.forEach((p, i) => {
      p.isActive = i === nextPlayerPos;
    });
    
    // Update game state with increased pot
    const newGameState = {
      ...gameState,
      activePlayer: nextPlayerPos,
      pot: gameState.pot + currentBet // Add the player's bet to the pot
    };
    
    // Clear the player's bet since it's now in the pot
    currentPlayer.bet = 0;
    
    // Update state
    setPlayers(updatedPlayers);
    setGameState(newGameState);
    
    // Save to localStorage
    saveGameState(newGameState, updatedPlayers);
    
    // Add system message
    if (addSystemMessage) {
      const message = `Player ${playerPosition + 1} folds`;
      addSystemMessage(message);
      saveSystemMessage(message);
    }
  }, [playerPosition, gameState, players, addSystemMessage]);
  
  const handleCall = useCallback((amount: number) => {
    if (playerPosition === undefined || gameState.status !== 'playing') return;
    
    console.log(`Player ${playerPosition + 1} is calling/checking ${amount}`);
    
    // Get current highest bet
    const highestBet = Math.max(...players.map(p => p.bet));
    const callAmount = highestBet - players[playerPosition].bet;
    
    // Update player state
    const updatedPlayers = [...players];
    const currentPlayer = updatedPlayers[playerPosition];
    
    // If no bet to call, this is a check
    const isCheck = callAmount === 0;
    
    if (!isCheck) {
      // Adjust chips and bet for call
      currentPlayer.chips -= callAmount;
      currentPlayer.bet = highestBet;
    }
    
    // Move action to next player
    const nextPlayerPos = findNextActivePlayer(playerPosition);
    updatedPlayers.forEach((p, i) => {
      p.isActive = i === nextPlayerPos;
    });
    
    // Update pot
    const newPot = gameState.pot + (isCheck ? 0 : callAmount);
    
    // Update game state
    const newGameState = {
      ...gameState,
      activePlayer: nextPlayerPos,
      pot: newPot
    };
    
    // Update state
    setPlayers(updatedPlayers);
    setGameState(newGameState);
    
    // Save to localStorage
    saveGameState(newGameState, updatedPlayers);
    
    // Add system message
    if (addSystemMessage) {
      const message = isCheck 
        ? `Player ${playerPosition + 1} checks` 
        : `Player ${playerPosition + 1} calls $${callAmount}`;
      addSystemMessage(message);
      saveSystemMessage(message);
    }
  }, [playerPosition, gameState, players, addSystemMessage]);
  
  const handleRaise = useCallback((amount: number) => {
    if (playerPosition === undefined || gameState.status !== 'playing') return;
    
    console.log(`Player ${playerPosition + 1} is raising to ${amount}`);
    
    // Get current highest bet
    const highestBet = Math.max(...players.map(p => p.bet));
    const raiseAmount = amount - players[playerPosition].bet;
    
    // Update player state
    const updatedPlayers = [...players];
    const currentPlayer = updatedPlayers[playerPosition];
    
    // Adjust chips and bet for raise
    currentPlayer.chips -= raiseAmount;
    currentPlayer.bet = amount;
    
    // Move action to next player
    const nextPlayerPos = findNextActivePlayer(playerPosition);
    updatedPlayers.forEach((p, i) => {
      p.isActive = i === nextPlayerPos;
    });
    
    // Update pot
    const newPot = gameState.pot + raiseAmount;
    
    // Update game state
    const newGameState = {
      ...gameState,
      activePlayer: nextPlayerPos,
      pot: newPot
    };
    
    // Update state
    setPlayers(updatedPlayers);
    setGameState(newGameState);
    
    // Save to localStorage
    saveGameState(newGameState, updatedPlayers);
    
    // Add system message
    if (addSystemMessage) {
      const message = `Player ${playerPosition + 1} raises to $${amount}`;
      addSystemMessage(message);
      saveSystemMessage(message);
    }
  }, [playerPosition, gameState, players, addSystemMessage]);

  // Register handlers with parent component
  useEffect(() => {
    // Only register handlers if the game is active and it's the player's turn
    if (gameState.status === 'playing' && playerPosition !== undefined) {
      if (onFold) onFold(() => {
        console.log("Fold handler called");
        handleFold();
      });
      if (onCall) onCall((amount: number) => {
        console.log("Call handler called with amount:", amount);
        handleCall(amount);
      });
      if (onRaise) onRaise((amount: number) => {
        console.log("Raise handler called with amount:", amount);
        handleRaise(amount);
      });
    }
  }, [gameState.status, playerPosition, handleFold, handleCall, handleRaise, onFold, onCall, onRaise]);

  // NEW: Sync internal state with forceTableState when it changes
  useEffect(() => {
    if (forceTableState && forceTableState.gameState) {
      console.log("Syncing Table component with forceTableState:", {
        status: forceTableState.gameState.status,
        phase: forceTableState.gameState.phase,
        dealer: forceTableState.gameState.dealer,
        players: forceTableState.players?.length || 0
      });
      
      // Update local game state
      setGameState(prevState => ({
        ...prevState,
        status: forceTableState.gameState.status,
        phase: forceTableState.gameState.phase || 'preflop',
        dealer: forceTableState.gameState.dealer !== undefined ? forceTableState.gameState.dealer : prevState.dealer,
        activePlayer: forceTableState.gameState.currentPlayer !== undefined ? 
          forceTableState.gameState.currentPlayer : prevState.activePlayer,
        pot: forceTableState.gameState.pot || 0,
        smallBlind: forceTableState.gameState.smallBlind || 10,
        bigBlind: forceTableState.gameState.bigBlind || 20
      }));
      
      // Update community cards if they exist
      if (forceTableState.gameState.communityCards && forceTableState.gameState.communityCards.length > 0) {
        // Ensure all community cards have fileName property
        const formattedCommunityCards = forceTableState.gameState.communityCards.map((card: any) => {
          if (!card.fileName) {
            card.fileName = `${card.value}${card.suit.toLowerCase()}`;
          }
          return card;
        });
        setCommunityCards(formattedCommunityCards);
      }
      
      // Update players if they exist
      if (forceTableState.players && forceTableState.players.length > 0) {
        // Ensure all player cards have fileName property
        const processedPlayers = forceTableState.players.map((player: PlayerType) => {
          if (player.hand && player.hand.length > 0) {
            const processedHand = player.hand.map((card: Card) => {
              // If card is missing fileName property, generate it from value and suit
              if (!card.fileName && card.value && card.suit) {
                return {
                  ...card,
                  fileName: `${card.value}${card.suit.toLowerCase()}`
                };
              }
              return card;
            });
            
            return {
              ...player,
              hand: processedHand
            };
          }
          return player;
        });
        
        // Debug log to see player card data
        console.log("Table updating player data from forceTableState:", 
          processedPlayers.map((p: PlayerType) => ({ 
            name: p.name, 
            position: p.position,
            hasHand: p.hand && p.hand.length > 0,
            handCards: p.hand 
          }))
        );
        
        setPlayers(processedPlayers);
        
        // When we receive player data with cards, save it to localStorage
        // This ensures the UserHand component can access it
        localStorage.setItem('pokerPlayers', JSON.stringify(processedPlayers));
      }
    }
  }, [forceTableState]);

  // NEW: Helper function to log player card status
  const logPlayerCardStatus = useCallback(() => {
    const cardStats = players.map((player: PlayerType) => ({
      playerName: player.name,
      position: player.position,
      hasCards: player.hand && player.hand.length > 0,
      cardsWithFileName: player.hand ? player.hand.filter((card: Card) => card.fileName).length : 0,
      totalCards: player.hand ? player.hand.length : 0,
      folded: player.folded
    }));
    
    console.log("PLAYER CARD STATUS:", {
      gameStatus: gameState.status,
      phase: gameState.phase,
      dealer: gameState.dealer,
      activePlayer: gameState.activePlayer,
      players: cardStats,
      playersWithCards: cardStats.filter(p => p.hasCards).length
    });
  }, [players, gameState]);
  
  // Monitor for game state changes and log card status
  useEffect(() => {
    if (gameState.status === 'playing') {
      logPlayerCardStatus();
    }
  }, [gameState.status, gameState.phase, logPlayerCardStatus]);

  // Start game function
  const handleStartGame = () => {
    console.log(`Player ${playerPosition} starting game`);
    if (startGame) {
      startGame();
    } else {
      console.error('startGame function not provided in props');
    }
  };

  // Debug function to show cards for all players
  const [showAllCards, setShowAllCards] = useState(false);
  
  // Add dealer debug state and function back
  const [debugDealerPos, setDebugDealerPos] = useState<number | null>(null);
  
  // Add debug function to show random bets
  const [showDebugBets, setShowDebugBets] = useState(false);
  
  const cycleDealerPosition = () => {
    if (debugDealerPos === null) {
      setDebugDealerPos(0);
    } else {
      setDebugDealerPos((debugDealerPos + 1) % 8);
    }
    
    // Log the current dealer position for debugging
    console.log(`Debug Dealer Position set to Player ${(debugDealerPos === null ? 1 : (debugDealerPos + 1) % 8 + 1)}`);
  };
  
  // Debug function to toggle random bets for testing
  const toggleDebugBets = () => {
    if (showDebugBets) {
      // Reset player bets
      const updatedPlayers = [...players];
      updatedPlayers.forEach(player => {
        player.bet = 0;
      });
      setPlayers(updatedPlayers);
      setShowDebugBets(false);
    } else {
      // Set random bets for each player
      const betAmounts = [0, 10, 20, 50, 100, 200, 500];
      const updatedPlayers = [...players];
      updatedPlayers.forEach(player => {
        // Random index from betAmounts array for variety
        const randomIndex = Math.floor(Math.random() * betAmounts.length);
        player.bet = betAmounts[randomIndex];
      });
      setPlayers(updatedPlayers);
      setShowDebugBets(true);
    }
  };
  
  const handleShowAllCards = () => {
    if (showAllCards) {
      // Reset to original state
      setShowAllCards(false);
      
      // Clear cards from all players
      const updatedPlayers = [...players];
      updatedPlayers.forEach(player => {
        player.hand = [];
        player.folded = false;
        player.isActive = false;
        player.bet = 0;
      });
      
      setPlayers(updatedPlayers);
      
      // Clear community cards
      setCommunityCards([]);
      
      // Update game state to waiting
      setGameState(prev => ({
        ...prev,
        status: 'waiting',
        pot: 0,
        dealer: 0,
        activePlayer: -1
      }));
    } else {
      // Enable show all cards mode
      setShowAllCards(true);
      
      // Generate sample cards for all players
      const sampleCards = [
        [{ value: "A", suit: "s", fileName: "As" }, { value: "K", suit: "s", fileName: "Ks" }], // Player 1
        [{ value: "Q", suit: "h", fileName: "Qh" }, { value: "J", suit: "h", fileName: "Jh" }], // Player 2
        [{ value: "10", suit: "c", fileName: "10c" }, { value: "9", suit: "c", fileName: "9c" }], // Player 3
        [{ value: "8", suit: "d", fileName: "8d" }, { value: "7", suit: "d", fileName: "7d" }], // Player 4
        [{ value: "6", suit: "s", fileName: "6s" }, { value: "5", suit: "s", fileName: "5s" }], // Player 5
        [{ value: "4", suit: "h", fileName: "4h" }, { value: "3", suit: "h", fileName: "3h" }], // Player 6
        [{ value: "2", suit: "c", fileName: "2c" }, { value: "A", suit: "c", fileName: "Ac" }], // Player 7
        [{ value: "K", suit: "d", fileName: "Kd" }, { value: "Q", suit: "d", fileName: "Qd" }]  // Player 8
      ];
      
      // Update each player with sample cards and simulate game state
      const updatedPlayers = [...players];
      
      // Randomly choose dealer position, active player, and some folded players
      const randomDealerPos = Math.floor(Math.random() * 8);
      const randomActivePlayer = (randomDealerPos + 3) % 8; // Set active player 3 positions after dealer
      
      // Randomly fold some players
      const foldedPlayers = new Set();
      while (foldedPlayers.size < 3) { // Fold 3 random players
        const randomIndex = Math.floor(Math.random() * 8);
        if (randomIndex !== randomActivePlayer && randomIndex !== playerPosition) {
          foldedPlayers.add(randomIndex);
        }
      }
      
      // Set random bets for players
      const betAmounts = [20, 50, 100, 200, 500];
      
      updatedPlayers.forEach((player, index) => {
        player.hand = sampleCards[index] as Card[];
        player.folded = foldedPlayers.has(index);
        player.isActive = index === randomActivePlayer;
        
        // Set chips and bets
        if (!player.folded && index !== randomActivePlayer) {
          // Set a random bet amount for players in the hand
          player.bet = betAmounts[Math.floor(Math.random() * betAmounts.length)];
          player.chips = 1000 - player.bet;
        } else if (player.folded) {
          player.bet = 0;
          player.chips = 1000;
        } else {
          // Active player
          player.bet = 0;
          player.chips = 1000;
        }
      });
      
      setPlayers(updatedPlayers);
      
      // Set sample community cards (flop, turn, river)
      const sampleCommunityCards = [
        { value: "J", suit: "s", fileName: "Js" },
        { value: "10", suit: "d", fileName: "10d" },
        { value: "9", suit: "h", fileName: "9h" },
        { value: "8", suit: "c", fileName: "8c" },
        { value: "7", suit: "s", fileName: "7s" }
      ];
      
      setCommunityCards(sampleCommunityCards);
      
      // Calculate total pot
      const totalBets = updatedPlayers.reduce((sum, player) => sum + player.bet, 0);
      
      // Update game state to playing
      setGameState(prev => ({
        ...prev,
        status: 'playing',
        phase: 'river',
        pot: totalBets,
        dealer: randomDealerPos,
        activePlayer: randomActivePlayer
      }));
    }
  };

  // Dealer position checker
  const isDealer = (position: number) => {
    // If in debug mode, use debug position
    if (debugDealerPos !== null) {
      return position === debugDealerPos;
    }
    
    // Normal dealer position logic
    // Only show dealer when game is in playing status
    if (forceTableState?.gameState?.status === 'waiting' || (!forceTableState && gameState.status === 'waiting')) {
      return false;
    }
    return forceTableState?.gameState?.dealer === position || 
      (!forceTableState && gameState.dealer === position);
  };
  
  // Active player checker
  const isActivePlayer = (position: number) => {
    return forceTableState?.gameState?.currentPlayer === position || 
      (!forceTableState && gameState.activePlayer === position);
  };

  return (
    <div className="table-container relative w-full max-w-7xl mx-auto">
      {/* Debug buttons */}
      <div className="absolute top-0 right-0 z-50 flex space-x-2">
        <button 
          className="bg-purple-600 text-white px-3 py-1 text-sm rounded"
          onClick={handleShowAllCards}
        >
          {showAllCards ? "Hide Cards" : "Show All Cards"}
        </button>
        
        <button 
          className="bg-yellow-600 text-white px-3 py-1 text-sm rounded"
          onClick={cycleDealerPosition}
        >
          {debugDealerPos !== null ? `Dealer: Player ${debugDealerPos + 1}` : "Debug Dealer"}
        </button>
        
        <button 
          className="bg-green-600 text-white px-3 py-1 text-sm rounded"
          onClick={toggleDebugBets}
        >
          {showDebugBets ? "Reset Bets" : "Show Random Bets"}
        </button>
      </div>

      <div 
        className="table p-10 border-[3px] border-[#f0aa22] rounded-[8rem] shadow-xl mx-auto h-[420px] w-[90%] relative overflow-hidden"
        style={{
          background: 'radial-gradient(circle, #1fb3a7 0%, #18938a 40%, #0e635d 100%)'
        }}
      >
        {/* Orange border glow effect */}
        <div className="absolute -inset-1 bg-[#f0aa22]/10 rounded-[8rem] blur-sm"></div>
        
        {/* Start Game button in the center of the table - only show if game is waiting */}
        {(forceTableState?.gameState?.status === 'waiting' || (!forceTableState && gameState.status === 'waiting')) && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
            <button 
              onClick={handleStartGame}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md font-bold text-xl transition-colors shadow-lg"
            >
              Start Game
            </button>
          </div>
        )}
        
        {/* Combined Community Cards and Total Pot container - centered on the table */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-12">
          {/* Total Pot display - only show when game is in progress and pot is greater than 0 */}
          {((forceTableState?.gameState?.status === 'playing' && forceTableState?.gameState?.pot > 0) || 
            (!forceTableState && gameState.status === 'playing' && gameState.pot > 0)) && (
            <div className="bg-black/40 px-4 py-2 rounded-md text-base font-bold text-white text-center flex flex-col items-center">
              <span className="text-yellow-400 mb-1">Total Pot</span>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2 flex items-center justify-center relative overflow-hidden">
                  <Image 
                    src="/poker-chip-thin.svg" 
                    alt="Chip" 
                    width={16} 
                    height={16} 
                    className="absolute" 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <span className="text-xl">${forceTableState?.gameState?.pot || gameState.pot || 0}</span>
              </div>
            </div>
          )}
          
          {/* Community Cards - 10% smaller with transparent background */}
          <div className="cards flex gap-2 justify-center">
            {communityCards.length > 0 ? (
              communityCards.map((card, index) => (
                <Image 
                  key={index}
                  src={`/cards/${card.fileName}.png`} 
                  alt="Card" 
                  width={65}
                  height={97}
                  className="object-contain shadow-md" 
                />
              ))
            ) : (
              <div className="h-[97px] min-w-[342px] flex items-center justify-center text-white/50 text-sm">
                Community cards will appear here
              </div>
            )}
          </div>
        </div>
        
        {/* Players positioned around the table */}
        <div className="players-layout absolute inset-0">
          {/* Player 1 (left) */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/3 flex justify-center items-center">
            <div className="absolute -top-8 left-0 right-0 mx-auto text-center">
              <span className="bg-black/50 rounded px-1 text-xs text-white">Pos 1</span>
            </div>
            <Player 
              name="Player 1" 
              position={1}
              chips={players[0].chips}
              isActive={isActivePlayer(0)}
              cards={players[0].hand}
              dealer={isDealer(0)}
              isCurrentPlayer={playerPosition === 0}
              folded={players[0].folded}
              showDebugCards={showAllCards}
            />
            {/* Show player bet directly */}
            {players[0].bet > 0 && <PokerChip amount={players[0].bet} playerNumber={1} />}
          </div>
          
          {/* Player 2 (top left) */}
          <div className="absolute top-0 left-1/4 transform -translate-y-1/2 -translate-x-1/4 flex justify-center items-center">
            <div className="absolute -top-8 left-0 right-0 mx-auto text-center">
              <span className="bg-black/50 rounded px-1 text-xs text-white">Pos 2</span>
            </div>
            <Player 
              name="Player 2" 
              position={2}
              chips={players[1].chips}
              isActive={isActivePlayer(1)}
              cards={players[1].hand}
              dealer={isDealer(1)}
              isCurrentPlayer={playerPosition === 1}
              folded={players[1].folded}
              showDebugCards={showAllCards}
            />
            {/* Show player bet directly */}
            {players[1].bet > 0 && <PokerChip amount={players[1].bet} playerNumber={2} />}
          </div>
          
          {/* Player 3 (top center) */}
          <div className="absolute top-0 left-1/2 transform -translate-y-1/2 -translate-x-1/2 flex justify-center items-center">
            <div className="absolute -top-8 left-0 right-0 mx-auto text-center">
              <span className="bg-black/50 rounded px-1 text-xs text-white">Pos 3</span>
            </div>
            <Player 
              name="Player 3" 
              position={3}
              chips={players[2].chips}
              isActive={isActivePlayer(2)}
              cards={players[2].hand}
              dealer={isDealer(2)}
              isCurrentPlayer={playerPosition === 2}
              folded={players[2].folded}
              showDebugCards={showAllCards}
            />
            {/* Show player bet directly */}
            {players[2].bet > 0 && <PokerChip amount={players[2].bet} playerNumber={3} />}
          </div>
          
          {/* Player 4 (top right) */}
          <div className="absolute top-0 right-1/4 transform -translate-y-1/2 translate-x-1/4 flex justify-center items-center">
            <div className="absolute -top-8 left-0 right-0 mx-auto text-center">
              <span className="bg-black/50 rounded px-1 text-xs text-white">Pos 4</span>
            </div>
            <Player 
              name="Player 4" 
              position={4}
              chips={players[3].chips}
              isActive={isActivePlayer(3)}
              cards={players[3].hand}
              dealer={isDealer(3)}
              isCurrentPlayer={playerPosition === 3}
              folded={players[3].folded}
              showDebugCards={showAllCards}
            />
            {/* Show player bet directly */}
            {players[3].bet > 0 && <PokerChip amount={players[3].bet} playerNumber={4} />}
          </div>
          
          {/* Player 5 (right) */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/3 flex justify-center items-center">
            <div className="absolute -top-8 left-0 right-0 mx-auto text-center">
              <span className="bg-black/50 rounded px-1 text-xs text-white">Pos 5</span>
            </div>
            <Player 
              name="Player 5" 
              position={5}
              chips={players[4].chips}
              isActive={isActivePlayer(4)}
              cards={players[4].hand}
              dealer={isDealer(4)}
              isCurrentPlayer={playerPosition === 4}
              folded={players[4].folded}
              showDebugCards={showAllCards}
            />
            {/* Show player bet directly */}
            {players[4].bet > 0 && <PokerChip amount={players[4].bet} playerNumber={5} />}
          </div>
          
          {/* Player 6 (bottom right) */}
          <div className="absolute bottom-0 right-1/4 transform translate-y-1/2 translate-x-1/4 flex justify-center items-center">
            <div className="absolute -bottom-8 left-0 right-0 mx-auto text-center">
              <span className="bg-black/50 rounded px-1 text-xs text-white">Pos 6</span>
            </div>
            <Player 
              name="Player 6" 
              position={6}
              chips={players[5].chips}
              isActive={isActivePlayer(5)}
              cards={players[5].hand}
              dealer={isDealer(5)}
              isCurrentPlayer={playerPosition === 5}
              folded={players[5].folded}
              showDebugCards={showAllCards}
            />
            {/* Show player bet directly */}
            {players[5].bet > 0 && <PokerChip amount={players[5].bet} playerNumber={6} />}
          </div>
          
          {/* Player 7 (bottom center) */}
          <div className="absolute bottom-0 left-1/2 transform translate-y-1/2 -translate-x-1/2 flex justify-center items-center">
            <div className="absolute -bottom-8 left-0 right-0 mx-auto text-center">
              <span className="bg-black/50 rounded px-1 text-xs text-white">Pos 7</span>
            </div>
            <Player 
              name="Player 7" 
              position={7}
              chips={players[6].chips}
              isActive={isActivePlayer(6)}
              cards={players[6].hand}
              dealer={isDealer(6)}
              isCurrentPlayer={playerPosition === 6}
              folded={players[6].folded}
              showDebugCards={showAllCards}
            />
            {/* Show player bet directly */}
            {players[6].bet > 0 && <PokerChip amount={players[6].bet} playerNumber={7} />}
          </div>
          
          {/* Player 8 (bottom left) - Current user */}
          <div className="absolute bottom-0 left-1/4 transform translate-y-1/2 -translate-x-1/4 flex justify-center items-center">
            <div className="absolute -bottom-8 left-0 right-0 mx-auto text-center">
              <span className="bg-black/50 rounded px-1 text-xs text-white">Pos 8</span>
            </div>
            <Player 
              name="Player 8" 
              position={8}
              chips={players[7].chips}
              isActive={isActivePlayer(7)}
              cards={players[7].hand}
              dealer={isDealer(7)}
              isCurrentPlayer={playerPosition === 7}
              folded={players[7].folded}
              showDebugCards={showAllCards}
            />
            {/* Show player bet directly */}
            {players[7].bet > 0 && <PokerChip amount={players[7].bet} playerNumber={8} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Table; 