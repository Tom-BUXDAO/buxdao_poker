'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use useRef for values that shouldn't trigger re-renders
  const reconnectAttemptsRef = useRef<number>(0);
  const socketRef = useRef<Socket | null>(null);

  // Clear error message
  const clearError = useCallback(() => setError(null), []);

  // Initialize socket connection - only run once on mount
  useEffect(() => {
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
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError(`Connection error: ${err.message}`);
      setIsConnected(false);
      
      // Increment reconnect attempts using the ref
      reconnectAttemptsRef.current += 1;
      
      // After several attempts, stop trying
      if (reconnectAttemptsRef.current >= 5) {
        socketInstance.disconnect();
        setError('Failed to connect to game server after multiple attempts. Please refresh the page.');
      }
    });

    socketInstance.on('error', (err) => {
      console.error('Socket error:', err);
      
      // Handle specific errors
      if (err.message === "Table is full") {
        setError('This table is currently full. Please try another table or come back later.');
      } else {
        setError(err.message || 'An error occurred');
      }
    });

    // Listen for game state updates
    socketInstance.on('gameStarting', () => {
      console.log('Game is starting!');
    });

    socketInstance.on('tableState', (data) => {
      console.log('Received table state:', data);
      // Only update state here if needed, avoid setting state that triggers renders unnecessarily
    });

    socketInstance.on('playerAction', (data) => {
      console.log('Player action:', data);
      // Only update state here if needed
    });

    // Set socket instance
    setSocket(socketInstance);

    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
      socketInstance.removeAllListeners();
      socketRef.current = null;
    };
  }, []); // Empty dependency array - only run once on mount

  // Join a table - memoize to avoid recreating on every render
  const joinTable = useCallback((tableId: string, playerName: string, avatar: string, chips: number = 1000, playerNumber?: string) => {
    if (socketRef.current && isConnected) {
      clearError(); // Clear any previous errors
      
      socketRef.current.emit('joinTable', { tableId, playerName, avatar, chips, playerNumber }, (response: { success: boolean; error?: string }) => {
        // Handle acknowledgement from server
        if (response && !response.success) {
          setError(response.error || 'Failed to join table');
        }
      });
    } else {
      setError('Cannot join table: Socket not connected');
    }
  }, [isConnected, clearError]);

  // Leave the current table
  const leaveTable = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leaveTable');
    }
  }, [isConnected]);

  // Send a player action (fold, check, call, raise)
  const sendAction = useCallback((action: string, amount?: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('playerAction', { action, amount });
    } else {
      setError('Cannot send action: Socket not connected');
    }
  }, [isConnected]);

  // Send a chat message
  const sendMessage = useCallback((message: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('sendMessage', { message });
    } else {
      setError('Cannot send message: Socket not connected');
    }
  }, [isConnected]);

  // Start the game
  const startGame = useCallback(() => {
    if (socketRef.current && isConnected) {
      console.log('Emitting startGame event');
      socketRef.current.emit('startGame', {}, (response: any) => {
        // Optional: handle acknowledgment if the server supports it
        console.log('Start game acknowledgment:', response);
      });
    } else {
      console.error('Cannot start game: Socket not connected');
      setError('Cannot start game: Socket not connected');
    }
  }, [isConnected]);

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