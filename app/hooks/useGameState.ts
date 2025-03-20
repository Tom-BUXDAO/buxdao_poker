'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

// Types
interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  position: number;
  bet: number;
  folded: boolean;
  allIn: boolean;
  isActive: boolean;
  hand: Card[];
}

interface Card {
  suit: string;
  value: string;
  code: string;
  fileName: string;
}

interface GameState {
  status: 'waiting' | 'starting' | 'playing' | 'ended';
  phase: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  dealer: number;
  smallBlind: number;
  bigBlind: number;
  currentPlayer: number | null;
  pot: number;
  communityCards: Card[];
  currentBet: number;
  winners: any[];
}

interface TableState {
  tableId: string;
  players: PlayerState[];
  gameState: GameState;
  isYourTurn: boolean;
}

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

export function useGameState() {
  const { socket } = useSocket();
  
  // Use a single state object instead of multiple state variables
  const [state, setState] = useState({
    tableState: emptyState,
    tables: [] as { id: string; name: string; playerCount: number; maxPlayers: number; status: string }[],
    messages: [] as { playerName: string; message: string; timestamp: string }[],
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
    
    // If we're already in an update cycle or there's a pending update, don't schedule another
    if (isUpdatingRef.current || updateTimeoutRef.current) {
      return;
    }
    
    // Implement throttling - don't update more than once every 50ms
    const now = Date.now();
    const timeUntilNextUpdate = Math.max(0, 50 - (now - lastUpdateTimeRef.current));
    
    // Schedule the update with appropriate timing
    updateTimeoutRef.current = setTimeout(() => {
      // Set the lock to prevent nested updates
      isUpdatingRef.current = true;
      
      // Update the state with all pending updates
      setState(current => {
        const newState = {
          ...current,
          ...pendingUpdatesRef.current
        };
        
        // Update the ref immediately to avoid stale closures
        stateRef.current = newState;
        
        // Clear pending updates
        pendingUpdatesRef.current = {};
        
        return newState;
      });
      
      // Clear the timeout ref
      updateTimeoutRef.current = null;
      
      // Track when the last update occurred
      lastUpdateTimeRef.current = Date.now();
      
      // Release the update lock after a short delay to ensure React has processed the state update
      setTimeout(() => {
        isUpdatingRef.current = false;
        
        // If more updates accumulated during this update, process them
        if (Object.keys(pendingUpdatesRef.current).length > 0 && !updateTimeoutRef.current) {
          batchUpdate({});  // Trigger processing of pending updates
        }
      }, 50);
    }, timeUntilNextUpdate);
  }, []);

  // Memoized clear error function
  const clearError = useCallback(() => {
    batchUpdate({ error: null });
  }, [batchUpdate]);

  // Update socket ref when it changes
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Listen for socket events - only depends on socket and batchUpdate
  useEffect(() => {
    if (!socket) return;

    console.log("useGameState: Setting up socket event listeners");
    
    // Track incoming events for debugging
    let eventCount = 0;
    const lastEventTime = {
      tableState: 0,
      tableList: 0,
      newMessage: 0,
      actionAcknowledged: 0,
      error: 0
    };
    
    // Define all event handlers inside to avoid dependency issues
    const onTableState = (data: TableState) => {
      eventCount++;
      
      // Throttle tableState events - only process one every 100ms 
      const now = Date.now();
      if (now - lastEventTime.tableState < 100) {
        console.log(`[${eventCount}] Throttling tableState event`);
        return;
      }
      lastEventTime.tableState = now;
      
      // Quick shallow comparison of important fields
      const currentState = stateRef.current.tableState;
      
      // Simple flag-based comparison for major differences
      const hasMajorChanges = 
        !currentState || 
        data.tableId !== currentState.tableId ||
        data.isYourTurn !== currentState.isYourTurn ||
        data.gameState.status !== currentState.gameState.status ||
        data.gameState.phase !== currentState.gameState.phase ||
        data.gameState.pot !== currentState.gameState.pot ||
        data.gameState.currentBet !== currentState.gameState.currentBet ||
        data.gameState.currentPlayer !== currentState.gameState.currentPlayer ||
        data.players.length !== currentState.players.length;
      
      // Only do complex comparisons if no major changes detected
      let shouldUpdate = hasMajorChanges;
      
      // Check community cards (only if no major changes detected yet)
      if (!shouldUpdate) {
        const currCardsJSON = JSON.stringify(currentState.gameState.communityCards);
        const newCardsJSON = JSON.stringify(data.gameState.communityCards);
        shouldUpdate = currCardsJSON !== newCardsJSON;
      }
      
      // Check players state (only if no major changes detected yet)
      if (!shouldUpdate) {
        // Only compare important player properties
        const getPlayerEssentials = (p: PlayerState) => ({ 
          id: p.id, 
          chips: p.chips, 
          bet: p.bet, 
          folded: p.folded,
          allIn: p.allIn,
          isActive: p.isActive
        });
        
        const currentPlayersJSON = JSON.stringify(currentState.players.map(getPlayerEssentials));
        const newPlayersJSON = JSON.stringify(data.players.map(getPlayerEssentials));
        shouldUpdate = currentPlayersJSON !== newPlayersJSON;
      }
      
      if (shouldUpdate) {
        console.log(`[${eventCount}] Processing tableState event:`, data.gameState.status);
        
        // Batch the update
        batchUpdate({ tableState: data });
      } else {
        console.log(`[${eventCount}] Skipping tableState event - no significant changes`);
      }
    };

    const onTableList = (data: any[]) => {
      // Throttle tableList events
      const now = Date.now();
      if (now - lastEventTime.tableList < 100) return;
      lastEventTime.tableList = now;
      
      // Only update if the data is different
      if (JSON.stringify(data) !== JSON.stringify(stateRef.current.tables)) {
        batchUpdate({ tables: data });
      }
    };

    const onNewMessage = (data: { playerName: string; message: string; timestamp: string }) => {
      // Messages always need to be added
      const newMessages = [...stateRef.current.messages, data];
      batchUpdate({ messages: newMessages });
    };

    const onActionAcknowledged = (data: { action: string; amount?: number }) => {
      // Throttle action acknowledgments
      const now = Date.now();
      if (now - lastEventTime.actionAcknowledged < 100) return;
      lastEventTime.actionAcknowledged = now;
      
      // Only update if action result changed
      if (JSON.stringify(data) !== JSON.stringify(stateRef.current.actionResult)) {
        batchUpdate({ actionResult: data });
      }
    };

    const onPlayerLeft = ({ playerId }: { playerId: string }) => {
      console.log(`Player ${playerId} left the table`);
      // No need to update state here, will be covered by table state update
    };

    const onPlayerDisconnected = ({ playerId }: { playerId: string }) => {
      console.log(`Player ${playerId} disconnected`);
      // No need to update state here, will be covered by table state update
    };

    const onError = (err: { message: string }) => {
      // Throttle error events
      const now = Date.now();
      if (now - lastEventTime.error < 100) return;
      lastEventTime.error = now;
      
      if (err.message !== stateRef.current.error) {
        batchUpdate({ error: err.message });
      }
    };

    // Subscribe to events
    socket.on('tableState', onTableState);
    socket.on('tableList', onTableList);
    socket.on('newMessage', onNewMessage);
    socket.on('actionAcknowledged', onActionAcknowledged);
    socket.on('playerLeft', onPlayerLeft);
    socket.on('playerDisconnected', onPlayerDisconnected);
    socket.on('error', onError);
    socket.on('gameStarting', () => {
      console.log('Game is starting!');
    });

    // Unsubscribe on cleanup
    return () => {
      console.log("useGameState: Cleaning up socket event listeners");
      socket.off('tableState', onTableState);
      socket.off('tableList', onTableList);
      socket.off('newMessage', onNewMessage);
      socket.off('actionAcknowledged', onActionAcknowledged);
      socket.off('playerLeft', onPlayerLeft);
      socket.off('playerDisconnected', onPlayerDisconnected);
      socket.off('error', onError);
      socket.off('gameStarting');
      
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

  return {
    tableState,
    tables,
    messages,
    actionResult,
    error,
    clearError
  };
} 