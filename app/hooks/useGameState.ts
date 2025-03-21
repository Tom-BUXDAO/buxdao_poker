'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { Card, Player as PlayerState, GameState, TableState, ChatMessage } from '../types';

// Default empty state
const emptyState: TableState = {
  tableId: '',
  players: [],
  gameState: {
    status: 'waiting',
    phase: 'waiting',
    dealer: 0,
    smallBlind: 10,
    bigBlind: 20,
    currentPlayer: null,
    pot: 0,
    communityCards: [],
    currentBet: 0,
    winners: []
  },
  isYourTurn: false
};

// Define a type for our messages that includes both regular and system messages
interface GameMessage {
  playerName?: string;
  type?: 'chat' | 'system';
  message: string;
  timestamp: string;
  playerId?: string;
}

export function useGameState() {
  const { socket } = useSocket();
  
  // Use a single state object instead of multiple state variables
  const [state, setState] = useState({
    tableState: emptyState,
    tables: [] as { id: string; name: string; playerCount: number; maxPlayers: number; status: string }[],
    messages: [] as GameMessage[],
    actionResult: null as { action: string; amount?: number } | null,
    error: null as string | null
  });
  
  // Destructure for easier access
  const { tableState, tables, messages, actionResult, error } = state;

  // Use refs to track previous values to prevent unnecessary re-renders
  const stateRef = useRef(state);
  const socketRef = useRef(socket);
  
  // Prevent circular updates with a lock
  const isUpdatingRef = useRef(false);
  const pendingUpdatesRef = useRef<Partial<typeof state>>({});
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track the last update time to implement throttling
  const lastUpdateTimeRef = useRef<number>(0);
  
  // Batched update function
  const batchUpdate = useCallback((updates: Partial<typeof state>) => {
    // Store updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates
    };
    
    // Only schedule an update if one isn't already scheduled
    if (!updateTimeoutRef.current && !isUpdatingRef.current) {
      // Schedule update with slight delay for batching
      updateTimeoutRef.current = setTimeout(() => {
        // Set updating flag
        isUpdatingRef.current = true;
        
        // Apply updates
        setState(currentState => {
          const newState = {
            ...currentState,
            ...pendingUpdatesRef.current
          };
          
          // Update ref to new state
          stateRef.current = newState;
          
          return newState;
        });
        
        // Clear pending updates and timeout ref
        pendingUpdatesRef.current = {};
        updateTimeoutRef.current = null;
        
        // Reset updating flag after a small delay
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 50);
      }, 50);
    }
  }, []);

  // Memoized clear error function
  const clearError = useCallback(() => {
    batchUpdate({ error: null });
  }, [batchUpdate]);

  // Function to update socket ref when socket changes
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Listen for socket events - only depends on socket and batchUpdate
  useEffect(() => {
    if (!socket) return;

    // Setup socket event listeners for game state
    console.log('useGameState: Setting up socket event listeners');

    // Listen for table state updates
    socket.on('tableState', (data) => {
      console.log('Received table state update:', data);
      
      // Update table state
      batchUpdate({ tableState: data });
      
      // If we have message history in the table state, update our messages
      if (data.messageHistory && Array.isArray(data.messageHistory)) {
        console.log('Received message history with tableState:', {
          count: data.messageHistory.length,
          messages: data.messageHistory
        });
        
        // Clean timestamps to ensure proper handling
        const sanitizedMessages = data.messageHistory.map((msg: GameMessage) => ({
          ...msg,
          timestamp: msg.timestamp || new Date().toISOString()
        }));
        
        // Import the message history
        batchUpdate({ messages: sanitizedMessages });
      } else {
        console.log('No message history in tableState');
      }
      
      batchUpdate({ error: null });
    });
    
    // Listen for refresh requests (server asking clients to request fresh state)
    socket.on('refreshTableState', () => {
      console.log('Received refresh table state request from server');
      
      // Clear any pending updates
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      
      // Clear our local message cache first to prevent duplication
      batchUpdate({ messages: [] });
      
      // Request a fresh table state with a small delay to ensure server is ready
      setTimeout(() => {
        if (socket && socket.connected) {
          console.log('Requesting fresh table state');
          socket.emit('getTableState');
        }
      }, 200);
    });

    // Listen for new hand events
    socket.on('newHand', (data) => {
      console.log('New hand started:', data);
    });

    // Listen for system messages
    socket.on('systemMessage', (data) => {
      console.log('Received system message:', data);
      
      const timestamp = new Date(data.timestamp).toISOString();
      batchUpdate({
        messages: [...messages, {
          type: 'system',
          message: data.message,
          timestamp
        }]
      });
    });

    // Listen for game starting events
    socket.on('gameStarting', () => {
      console.log('Game is starting!');
      
      const timestamp = new Date().toISOString();
      batchUpdate({
        messages: [...messages, {
          type: 'system',
          message: 'Game is starting...',
          timestamp
        }]
      });
      
      // Request a fresh table state
      if (socket && socket.connected) {
        socket.emit('getTableState');
      }
    });
    
    // Listen for chat messages
    socket.on('newMessage', (data) => {
      console.log('Received chat message:', data);
      batchUpdate({ messages: [...messages, data] });
    });

    // Clean up event listeners
    return () => {
      console.log('useGameState: Cleaning up socket event listeners');
      socket.off('tableState');
      socket.off('refreshTableState');
      socket.off('newHand');
      socket.off('systemMessage');
      socket.off('gameStarting');
      socket.off('newMessage');
      
      // Clear any pending updates
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };
  }, [socket, batchUpdate]); // Only depend on socket and batchUpdate

  // Clear error after 5 seconds
  useEffect(() => {
    if (!error) return;
    
    const timer = setTimeout(() => {
      batchUpdate({ error: null });
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [error, batchUpdate]); // Only depend on error and batchUpdate

  // Handler for table state updates
  const handleTableState = useCallback((data: any) => {
    console.log('Received table state update:', data);
    
    // Update table state
    batchUpdate({ tableState: data });
    
    // If we have message history in the table state, update our messages
    if (data.messageHistory && Array.isArray(data.messageHistory)) {
      batchUpdate({ messages: data.messageHistory });
    }
    
    // Update game ID and phase
    if (data.gameState) {
      batchUpdate({
        tableState: {
          ...data.gameState,
          status: data.gameState.status,
          phase: data.gameState.phase
        }
      });
    }
    
    batchUpdate({ error: null });
  }, [batchUpdate]);

  // Add system message to the messages state
  const onSystemMessage = useCallback((message: any) => {
    console.log('Adding system message:', message);
    
    // Add new message to state
    batchUpdate({
      messages: [...messages, {
        ...message,
        type: 'system'
      }]
    });
  }, [batchUpdate, messages]);
  
  // Add chat message to the messages state
  const onChatMessage = useCallback((message: any) => {
    console.log('Adding chat message:', message);
    
    // Add new message to state
    batchUpdate({
      messages: [...messages, {
        ...message,
        type: 'chat'
      }]
    });
  }, [batchUpdate, messages]);

  return {
    tableState,
    tables,
    messages,
    actionResult,
    error,
    clearError,
    handleTableState,
    onSystemMessage,
    onChatMessage
  };
} 