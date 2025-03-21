'use client';

import Image from "next/image";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from './context/SocketContext';
import { useGameState } from './hooks/useGameState';
import { 
  ActionButtons, 
  UserHand, 
  Player,
  GameStatusHeader,
  Table,
  GlobalChat
} from './components';
import { Card, GameState } from './types';

// Declare global properties for the window object
declare global {
  interface Window {
    _pokerHandlerAttached?: boolean;
    _homeComponentSetupComplete?: boolean;
    _socketUpdateInProgress?: boolean;
  }
}

// The Player component has been moved to app/components/Player.tsx
// The GameStatusHeader component has been moved to app/components/GameStatusHeader.tsx
// The Table component has been moved to app/components/Table.tsx

export default function Home() {
  // Add missing ref for game state tracking
  const prevGameStateRef = useRef<string>('');
  
  // Get player position from URL path - extract the player number from the URL
  const [playerPosition, setPlayerPosition] = useState(() => {
    // Default to Player 8 (position 7)
    let position = 7;
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Extract player number from the URL
      const path = window.location.pathname;
      // Look for patterns like /player1, /test-table/player2, etc.
      const playerMatch = path.match(/player(\d+)/i);
      
      if (playerMatch && playerMatch[1]) {
        // Convert to zero-based index (player1 = position 0)
        const playerNum = parseInt(playerMatch[1], 10);
        if (!isNaN(playerNum) && playerNum >= 1 && playerNum <= 8) {
          position = playerNum - 1;
          console.log(`Detected player position ${playerNum} (index: ${position}) from URL: ${path}`);
        }
      }
    }
    
    return position;
  });
  
  // Get the table state from useGameState
  const { tableState, messages } = useGameState();
  
  // State to hold the game status from the Table component
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    phase: 'preflop',
    dealer: 0,
    activePlayer: -1,
    pot: 0,
    smallBlind: 10,
    bigBlind: 20,
    userCards: [] as Card[],
    gameId: ''
  });
  
  // Helper function to check if a position is the dealer position
  const isDealer = (position: number): boolean => {
    // First check forceTableState, then fallback to gameState
    if (tableState && tableState.gameState && 'dealer' in tableState.gameState) {
      return tableState.gameState.dealer === position;
    }
    return gameState.dealer === position;
  };
  
  // Helper function to check if a position is the active player
  const isActivePlayer = (position: number): boolean => {
    // First check forceTableState, then fallback to gameState
    if (tableState && tableState.gameState && 'currentPlayer' in tableState.gameState) {
      return tableState.gameState.currentPlayer === position;
    }
    // If tableState has activePlayer, use that
    if (tableState && tableState.gameState && 'activePlayer' in tableState.gameState) {
      return tableState.gameState.activePlayer === position;
    }
    return gameState.activePlayer === position;
  };
  
  // Debug game state changes
  useEffect(() => {
    console.log('Home: Game state updated:', gameState);
  }, [gameState]);
  
  // Listen for tableState updates from useGameState
  useEffect(() => {
    if (tableState && tableState.gameState) {
      // Debug table state to understand the problem
      console.log('Home component received tableState update:', {
        status: tableState.gameState?.status,
        phase: tableState.gameState?.phase,
        dealer: tableState.gameState?.dealer,
        playersWithCards: tableState.players?.filter(p => p.hand?.length > 0).length || 0
      });
      
      // Create a properly typed updated state
      const updatedState = tableState.gameState;
      const typedUpdatedState: GameState = {
        status: updatedState.status,
        phase: updatedState.phase || 'preflop',
        dealer: updatedState.dealer,
        activePlayer: updatedState.activePlayer,
        pot: updatedState.pot,
        smallBlind: updatedState.smallBlind, 
        bigBlind: updatedState.bigBlind,
        userCards: updatedState.userCards,
        gameId: updatedState.gameId
      };
      
      // Set the state with the properly typed object
      setGameState(typedUpdatedState);

      // Make sure to update localStorage with the players data for proper rendering
      if (tableState.players && tableState.players.length > 0) {
        // Save player data to localStorage to ensure cards are visible
        try {
          localStorage.setItem('pokerPlayers', JSON.stringify(tableState.players));
          console.log('Updated localStorage with player data from tableState');
        } catch (e) {
          console.error('Failed to save player data to localStorage:', e);
        }
      }
    }
  }, [tableState, playerPosition]);
  
  // Add a ref to track component mount state
  const isMountedRef = useRef(true);
  
  // Add a ref to track if we're currently processing an update
  const isProcessingUpdateRef = useRef(false);
  
  // Add a ref to store player position to avoid circular dependencies
  const playerPositionRef = useRef(playerPosition); // Default to Player 8

  // Action handlers - Use refs instead of state to prevent re-renders
  const foldHandlerRef = useRef<(() => void) | undefined>(undefined);
  const callHandlerRef = useRef<((amount: number) => void) | undefined>(undefined);
  const raiseHandlerRef = useRef<((amount: number) => void) | undefined>(undefined);

  // Get socket context for connection
  const { socket, isConnected, joinTable, startGame } = useSocket();

  // Automatically join the table when socket is connected
  useEffect(() => {
    if (isConnected && socket && playerPosition !== undefined) {
      // Get player name based on position
      const playerName = `Player ${playerPosition + 1}`;
      
      // Join the test table with player position
      joinTable('test-table', playerName, 'https://arweave.net/Q3Ljpx6BNV98Wv6mHO41_vgXMbGXeZgi9YSwLvHDV9M?ext=png', 1000, `player${playerPosition + 1}`);
      
      console.log(`Auto-joined test table as Player ${playerPosition + 1}`);
    }
  }, [isConnected, socket, playerPosition, joinTable]);

  // Handler setters that don't cause re-renders
  const setFoldHandler = useCallback((handler: () => void) => {
    foldHandlerRef.current = handler;
  }, []);
  
  const setCallHandler = useCallback((handler: (amount: number) => void) => {
    callHandlerRef.current = handler;
  }, []);
  
  const setRaiseHandler = useCallback((handler: (amount: number) => void) => {
    raiseHandlerRef.current = handler;
  }, []);

  // Update the player position ref when the state changes - this is OK to keep
  useEffect(() => {
    playerPositionRef.current = playerPosition;
  }, [playerPosition]);

  // State for chat messages
  const [chatMessages, setChatMessages] = useState<Array<{
    type: 'chat' | 'system';
    sender?: string;
    message: string;
    time: string;
  }>>([]);
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Effect to update user cards from localStorage when game state changes to 'playing'
  useEffect(() => {
    if (gameState.status === 'playing' && playerPosition !== undefined) {
      try {
        const savedPlayers = localStorage.getItem('pokerPlayers');
        if (savedPlayers) {
          const parsedPlayers = JSON.parse(savedPlayers);
          if (parsedPlayers[playerPosition]?.hand?.length > 0) {
            // Get the user's cards and ensure they have fileName property
            const userCards = parsedPlayers[playerPosition].hand.map((card: any) => {
              // If card is missing fileName property, generate it from value and suit
              if (!card.fileName && card.value && card.suit) {
                return {
                  ...card,
                  fileName: `${card.value}${card.suit.toLowerCase()}`
                };
              }
              return card;
            });
            
            console.log("Setting user cards from localStorage:", userCards);
            
            // Update the game state with the user's cards
            setGameState(prev => ({
              ...prev,
              userCards: userCards
            }));
          }
        }
      } catch (e) {
        console.error("Error loading user cards from localStorage:", e);
      }
    }
  }, [gameState.status, playerPosition]);
  
  // Function to add a system message
  const addSystemMessage = useCallback((message: string) => {
    // Skip if we've unmounted
    if (!isMountedRef.current) return;
    
    const now = new Date();
    const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Use setTimeout to break render cycles
    setTimeout(() => {
      if (isMountedRef.current) {
        setChatMessages(prev => {
          // Check if this exact message already exists to prevent duplicates
          const messageExists = prev.some(msg => 
            msg.type === 'system' && msg.message === message
          );
          
          if (messageExists) {
            return prev; // Return existing state without changes
          }
          
          return [
            ...prev, 
            {
              type: 'system',
              message,
              time: timeString
            }
          ];
        });
      }
    }, 50);
  }, []);
  
  // Determine if it's the user's turn
  const isUserTurn = gameState.status === 'playing' && gameState.activePlayer === playerPosition;
  
  // Memoize the callback to prevent it from changing on every render
  const handleGameStateChange = useCallback((newState: GameState) => {
    // Skip updates if component unmounted or already processing an update
    if (!isMountedRef.current || isProcessingUpdateRef.current) return;
    
    // Check if the new state is actually different using same comparableNewState approach
    const comparableNewState = {
      status: newState.status,
      phase: newState.phase,
      dealer: newState.dealer,
      activePlayer: newState.activePlayer,
      pot: newState.pot,
      gameId: newState.gameId,
      userCards: newState.userCards ? newState.userCards.map(card => card.fileName).join(',') : ''
    };
    
    // Stringify for deep comparison
    const newStateString = JSON.stringify(comparableNewState);
    
    // Skip update if state hasn't changed
    if (newStateString === prevGameStateRef.current) {
      console.log("Skipping game state update - no changes");
      return;
    }
    
    // Mark that we're processing an update
    isProcessingUpdateRef.current = true;
    
    // Use requestAnimationFrame to break the update cycle
    requestAnimationFrame(() => {
      if (isMountedRef.current) {
        console.log("Game state updated:", comparableNewState);
        prevGameStateRef.current = newStateString;
        
        setGameState(newState);
      }
      
      // Clear processing flag after a short delay
      setTimeout(() => {
        isProcessingUpdateRef.current = false;
      }, 50);
    });
  }, []); // Empty dependency array is correct since we're using refs for changes

  // Get the current highest bet from game state
  const getCurrentBet = useCallback((): number => {
    // If the game hasn't started, use the big blind
    if (gameState.status !== 'playing') {
      return gameState.bigBlind;
    }
    
    // Otherwise, try to get the highest bet from localStorage
    try {
      const savedPlayers = localStorage.getItem('pokerPlayers');
      if (savedPlayers) {
        const parsedPlayers = JSON.parse(savedPlayers);
        const highestBet = Math.max(...parsedPlayers.map((p: any) => p.bet));
        return highestBet || gameState.bigBlind; // Return bigBlind if highestBet is 0
      }
    } catch (e) {
      console.error("Error getting current bet:", e);
    }
    
    // Default to big blind if we can't determine the highest bet
    return gameState.bigBlind;
  }, [gameState.status, gameState.bigBlind]);

  // Handler wrapper functions for the ActionButtons component
  const handleFold = useCallback(() => {
    if (foldHandlerRef.current) {
      foldHandlerRef.current();
    }
  }, []);
  
  const handleCall = useCallback((amount: number) => {
    if (callHandlerRef.current) {
      callHandlerRef.current(amount);
    }
  }, []);
  
  const handleRaise = useCallback((amount: number) => {
    if (raiseHandlerRef.current) {
      raiseHandlerRef.current(amount);
    }
  }, []);

  return (
    <main className="min-h-screen p-4 bg-gray-900 flex flex-col h-screen">
      <GameStatusHeader />
      
      <div className="flex flex-col lg:flex-row gap-4 flex-1">
        <div className="poker-table-container lg:w-3/4 flex flex-col justify-between relative">
          <div className="flex-shrink-0 h-10"></div>
          <div className="flex-grow flex items-center justify-center mt-4 mb-12">
            {/* Pass tableState directly to the Table component */}
            <Table 
              onGameStateChange={handleGameStateChange} 
              addSystemMessage={addSystemMessage}
              playerPosition={playerPosition}
              onFold={setFoldHandler}
              onCall={setCallHandler}
              onRaise={setRaiseHandler}
              startGame={startGame}
              forceTableState={tableState} // Pass the tableState directly so the Table can use it
            />
          </div>
          <div className="flex-shrink-0 mt-8">
            <ActionButtons 
              isGameActive={gameState.status === 'playing'} 
              isPlayerTurn={isUserTurn}
              currentBet={getCurrentBet()}
              bigBlind={gameState.bigBlind}
              onFold={handleFold}
              onCall={handleCall}
              onRaise={handleRaise}
            />
          </div>
          <UserHand 
            cards={gameState.userCards || []} 
            folded={playerPosition !== undefined && gameState.status === 'playing' ? 
              localStorage.getItem('pokerPlayers') ? 
                JSON.parse(localStorage.getItem('pokerPlayers')!)[playerPosition]?.folded : false 
              : false} 
          />
        </div>
        <div className="chat-section lg:w-1/4" style={{ height: 'calc(100vh - 125px)' }}>
          <GlobalChat playerName={`Player ${playerPosition + 1}`} />
        </div>
      </div>
    </main>
  );
}

