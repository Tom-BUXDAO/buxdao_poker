'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Add flag to window to allow tracking of socket updates
declare global {
  interface Window {
    _socketUpdateInProgress?: boolean;
  }
}

// Define types for the context
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  clearError: () => void;
  joinTable: (tableId: string, playerName: string, avatar: string, chips?: number, playerNumber?: string) => void;
  leaveTable: () => void;
  sendAction: (action: string, amount?: number) => void;
  sendMessage: (message: string) => void;
  startGame: () => void;
}

// Create context with default values
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  error: null,
  clearError: () => {},
  joinTable: () => {},
  leaveTable: () => {},
  sendAction: () => {},
  sendMessage: () => {},
  startGame: () => {},
});

// Socket.io server URL
const SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use a single state update mechanism to prevent multiple re-renders
  const [state, setState] = useState({
    socket: null as Socket | null,
    isConnected: false,
    error: null as string | null,
  });
  
  // Destructure state for easier access
  const { socket, isConnected, error } = state;
  
  // Use refs for values that shouldn't trigger re-renders and to track update cycles
  const reconnectAttemptsRef = useRef<number>(0);
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef<boolean>(false);
  const errorRef = useRef<string | null>(null);
  const pendingUpdatesRef = useRef<Partial<typeof state>>({});
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateLockRef = useRef<boolean>(false);
  
  // Function to batch state updates
  const batchUpdate = useCallback((updates: Partial<typeof state>) => {
    // Store updates in ref
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates
    };
    
    // Only schedule an update if one isn't already scheduled
    if (!updateTimeoutRef.current && !updateLockRef.current) {
      updateTimeoutRef.current = setTimeout(() => {
        // Set flag to indicate socket update is happening
        window._socketUpdateInProgress = true;
        
        // Set lock to prevent nested updates
        updateLockRef.current = true;
        
        // Apply all pending updates at once
        setState(current => ({
          ...current,
          ...pendingUpdatesRef.current
        }));
        
        // Clear pending updates and timeout ref
        pendingUpdatesRef.current = {};
        updateTimeoutRef.current = null;
        
        // Release lock and flag after a short delay
        setTimeout(() => {
          updateLockRef.current = false;
          window._socketUpdateInProgress = false;
        }, 50);
      }, 50);
    }
  }, []);

  // Clear error message
  const clearError = useCallback(() => {
    errorRef.current = null;
    batchUpdate({ error: null });
  }, [batchUpdate]);

  // Initialize socket connection - only run once on mount
  useEffect(() => {
    // If we already have a socket instance, don't create a new one
    if (socketRef.current) return;

    console.log("Socket context initializing...");
    const socketInstance = io(SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    // Keep a ref to the socket to use in event handlers without dependencies
    socketRef.current = socketInstance;

    // Set up event listeners
    socketInstance.on('connect', () => {
      console.log('Connected to Socket.io server');
      isConnectedRef.current = true;
      errorRef.current = null;
      reconnectAttemptsRef.current = 0;
      
      // Batch update to prevent cascading renders
      batchUpdate({
        isConnected: true,
        error: null
      });
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
      isConnectedRef.current = false;
      
      // Batch update
      batchUpdate({
        isConnected: false
      });
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Connection error:', err);
      const errorMsg = `Connection error: ${err.message}`;
      errorRef.current = errorMsg;
      isConnectedRef.current = false;
      
      // Increment reconnect attempts using the ref
      reconnectAttemptsRef.current += 1;
      
      // After several attempts, stop trying
      if (reconnectAttemptsRef.current >= 5) {
        socketInstance.disconnect();
        errorRef.current = 'Failed to connect to game server after multiple attempts. Please refresh the page.';
      }
      
      // Batch state updates
      batchUpdate({
        isConnected: false,
        error: errorRef.current
      });
    });

    socketInstance.on('error', (err) => {
      console.error('Socket error:', err);
      
      // Handle specific errors
      let errorMsg;
      if (err.message === "Table is full") {
        errorMsg = 'This table is currently full. Please try another table or come back later.';
      } else {
        errorMsg = err.message || 'An error occurred';
      }
      
      errorRef.current = errorMsg;
      
      // Batch update
      batchUpdate({
        error: errorMsg
      });
    });

    // Listen for game state updates - but don't update state here
    // Just log them - the useGameState hook will handle this data
    socketInstance.on('gameStarting', () => {
      console.log('Game is starting!');
    });

    socketInstance.on('tableState', (data) => {
      // Set flag to indicate socket update is happening - this helps prevent
      // localStorage event and socket event conflicts
      window._socketUpdateInProgress = true;
      console.log('Socket received table state event:', data.gameState.status);
      
      // Clear the flag after a short delay to allow state to settle
      setTimeout(() => {
        window._socketUpdateInProgress = false;
      }, 100);
      
      // Don't update any state here - let useGameState handle this
    });

    socketInstance.on('playerAction', (data) => {
      console.log('Player action:', data);
      // Don't update any state here - let useGameState handle this
    });

    // Set socket instance - do this only once with batched update
    batchUpdate({
      socket: socketInstance
    });

    // Clean up on unmount
    return () => {
      console.log("Socket context cleanup...");
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      // Clear the update in progress flag
      window._socketUpdateInProgress = false;
      socketInstance.disconnect();
      socketInstance.removeAllListeners();
      socketRef.current = null;
    };
  }, []); // Empty dependency array - only run once on mount

  // Join a table - memoize to avoid recreating on every render
  const joinTable = useCallback((tableId: string, playerName: string, avatar: string, chips: number = 1000, playerNumber?: string) => {
    // Use ref values to avoid dependency on state
    if (socketRef.current && isConnectedRef.current) {
      // Clear any previous errors
      errorRef.current = null;
      batchUpdate({ error: null });
      
      console.log(`Emitting joinTable with playerNumber: ${playerNumber}`);
      socketRef.current.emit('joinTable', { tableId, playerName, avatar, chips, playerNumber }, (response: { success: boolean; error?: string }) => {
        // Handle acknowledgement from server
        if (response && !response.success && response.error) {
          errorRef.current = response.error || 'Failed to join table';
          batchUpdate({ error: errorRef.current });
        }
      });
    } else {
      const errMsg = 'Cannot join table: Socket not connected';
      errorRef.current = errMsg;
      batchUpdate({ error: errMsg });
    }
  }, [batchUpdate]); // Only depend on batchUpdate since we use refs

  // Leave the current table
  const leaveTable = useCallback(() => {
    if (socketRef.current && isConnectedRef.current) {
      socketRef.current.emit('leaveTable');
    }
  }, []);

  // Send a player action (fold, check, call, raise)
  const sendAction = useCallback((action: string, amount?: number) => {
    if (socketRef.current && isConnectedRef.current) {
      socketRef.current.emit('playerAction', { action, amount });
    } else {
      batchUpdate({ error: 'Cannot send action: Socket not connected' });
    }
  }, [batchUpdate]);

  // Send a chat message
  const sendMessage = useCallback((message: string) => {
    if (socketRef.current && isConnectedRef.current) {
      socketRef.current.emit('sendMessage', { message });
    } else {
      batchUpdate({ error: 'Cannot send message: Socket not connected' });
    }
  }, [batchUpdate]);

  // Start the game
  const startGame = useCallback(() => {
    if (socketRef.current && isConnectedRef.current) {
      console.log('Emitting startGame event');
      socketRef.current.emit('startGame', {}, (response: any) => {
        // Optional: handle acknowledgment if the server supports it
        console.log('Start game acknowledgment:', response);
      });
    } else {
      console.error('Cannot start game: Socket not connected');
      batchUpdate({ error: 'Cannot start game: Socket not connected' });
    }
  }, [batchUpdate]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    socket,
    isConnected,
    error,
    clearError,
    joinTable,
    leaveTable,
    sendAction,
    sendMessage,
    startGame,
  }), [
    socket, 
    isConnected, 
    error, 
    clearError,
    joinTable,
    leaveTable,
    sendAction,
    sendMessage,
    startGame
  ]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = () => useContext(SocketContext); 