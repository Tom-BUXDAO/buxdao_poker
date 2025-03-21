'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Player } from './Player';
import { CommunityCards, PokerChip, TotalPot } from './TableElements';
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

  // Start game function
  const handleStartGame = () => {
    console.log(`Player ${playerPosition} starting game`);
    if (startGame) {
      startGame();
    } else {
      console.error('startGame function not provided in props');
    }
  };

  // Dealer position checker
  const isDealer = (position: number) => {
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
        
        {/* Log the status for debugging */}
        {(forceTableState?.gameState?.status === 'playing' || gameState.status === 'playing') && (
          <div className="absolute top-2 right-2 text-xs text-white opacity-50">
            Status: {forceTableState?.gameState?.status || gameState.status}
          </div>
        )}
        
        {/* Total Pot display - only show when game is playing */}
        {(forceTableState?.gameState?.status === 'playing' || (!forceTableState && gameState.status === 'playing')) && (
          <div className="absolute top-1/2 left-[25%] transform -translate-y-1/2 -translate-x-1/2 z-10">
            <div className="flex flex-col items-center">
              <div className="text-lg font-bold text-white">TOTAL POT</div>
              <TotalPot amount={forceTableState?.gameState?.pot || gameState.pot || 0} />
            </div>
          </div>
        )}
        
        {/* Center Community Cards */}
        <div className="community-cards absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="cards flex gap-2 justify-center">
            {communityCards.map((card, index) => (
              <Image 
                key={index}
                src={`/cards/${card.fileName}.png`} 
                alt="Card" 
                width={72} 
                height={108} 
                className="object-contain" 
              />
            ))}
          </div>
        </div>
        
        {/* Players positioned around the table */}
        <div className="players-layout absolute inset-0">
          {/* Player 1 (left) */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/3">
            <Player 
              name="Player 1" 
              position={1}
              chips={players[0].chips}
              isActive={isActivePlayer(0)}
              cards={gameState.status === 'playing' ? players[0].hand : []}
              dealer={isDealer(0)}
              isCurrentPlayer={playerPosition === 0}
              folded={players[0].folded}
            />
            {players[0].bet > 0 && !players[0].folded && (
              <div className="absolute -right-12 top-1/2 transform -translate-y-1/2">
                <PokerChip amount={players[0].bet} playerNumber={1} />
              </div>
            )}
          </div>
          
          {/* Player 2 (top left) */}
          <div className="absolute top-0 left-1/4 transform -translate-y-1/2 -translate-x-1/4">
            <Player 
              name="Player 2" 
              position={2}
              chips={players[1].chips}
              isActive={isActivePlayer(1)}
              cards={gameState.status === 'playing' ? players[1].hand : []}
              dealer={isDealer(1)}
              isCurrentPlayer={playerPosition === 1}
              folded={players[1].folded}
            />
            {players[1].bet > 0 && !players[1].folded && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8">
                <PokerChip amount={players[1].bet} playerNumber={2} />
              </div>
            )}
          </div>
          
          {/* Player 3 (top center) */}
          <div className="absolute top-0 left-1/2 transform -translate-y-1/2 -translate-x-1/2">
            <Player 
              name="Player 3" 
              position={3}
              chips={players[2].chips}
              isActive={isActivePlayer(2)}
              cards={gameState.status === 'playing' ? players[2].hand : []}
              dealer={isDealer(2)}
              isCurrentPlayer={playerPosition === 2}
              folded={players[2].folded}
            />
            {players[2].bet > 0 && !players[2].folded && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8">
                <PokerChip amount={players[2].bet} playerNumber={3} />
              </div>
            )}
          </div>
          
          {/* Player 4 (top right) */}
          <div className="absolute top-0 right-1/4 transform -translate-y-1/2 translate-x-1/4">
            <Player 
              name="Player 4" 
              position={4}
              chips={players[3].chips}
              isActive={isActivePlayer(3)}
              cards={gameState.status === 'playing' ? players[3].hand : []}
              dealer={isDealer(3)}
              isCurrentPlayer={playerPosition === 3}
              folded={players[3].folded}
            />
            {players[3].bet > 0 && !players[3].folded && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8">
                <PokerChip amount={players[3].bet} playerNumber={4} />
              </div>
            )}
          </div>
          
          {/* Player 5 (right) */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/3">
            <Player 
              name="Player 5" 
              position={5}
              chips={players[4].chips}
              isActive={isActivePlayer(4)}
              cards={gameState.status === 'playing' ? players[4].hand : []}
              dealer={isDealer(4)}
              isCurrentPlayer={playerPosition === 4}
              folded={players[4].folded}
            />
            {players[4].bet > 0 && !players[4].folded && (
              <div className="absolute -left-12 top-1/2 transform -translate-y-1/2">
                <PokerChip amount={players[4].bet} playerNumber={5} />
              </div>
            )}
          </div>
          
          {/* Player 6 (bottom right) */}
          <div className="absolute bottom-0 right-1/4 transform translate-y-1/2 translate-x-1/4">
            <Player 
              name="Player 6" 
              position={6}
              chips={players[5].chips}
              isActive={isActivePlayer(5)}
              cards={gameState.status === 'playing' ? players[5].hand : []}
              dealer={isDealer(5)}
              isCurrentPlayer={playerPosition === 5}
              folded={players[5].folded}
            />
            {players[5].bet > 0 && !players[5].folded && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8">
                <PokerChip amount={players[5].bet} playerNumber={6} />
              </div>
            )}
          </div>
          
          {/* Player 7 (bottom center) */}
          <div className="absolute bottom-0 left-1/2 transform translate-y-1/2 -translate-x-1/2">
            <Player 
              name="Player 7" 
              position={7}
              chips={players[6].chips}
              isActive={isActivePlayer(6)}
              cards={gameState.status === 'playing' ? players[6].hand : []}
              dealer={isDealer(6)}
              isCurrentPlayer={playerPosition === 6}
              folded={players[6].folded}
            />
            {players[6].bet > 0 && !players[6].folded && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8">
                <PokerChip amount={players[6].bet} playerNumber={7} />
              </div>
            )}
          </div>
          
          {/* Player 8 (bottom left) - Current user */}
          <div className="absolute bottom-0 left-1/4 transform translate-y-1/2 -translate-x-1/4">
            <Player 
              name="Player 8" 
              position={8}
              chips={players[7].chips}
              isActive={isActivePlayer(7)}
              cards={gameState.status === 'playing' ? players[7].hand : []}
              dealer={isDealer(7)}
              isCurrentPlayer={playerPosition === 7}
              folded={players[7].folded}
            />
            {players[7].bet > 0 && !players[7].folded && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8">
                <PokerChip amount={players[7].bet} playerNumber={8} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Table; 