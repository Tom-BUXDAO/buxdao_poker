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
  const [tableState, setTableState] = useState<TableState>(emptyState);
  const [tables, setTables] = useState<{ id: string; name: string; playerCount: number; maxPlayers: number; status: string }[]>([]);
  const [messages, setMessages] = useState<{ playerName: string; message: string; timestamp: string }[]>([]);
  const [actionResult, setActionResult] = useState<{ action: string; amount?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use refs to track previous values to prevent unnecessary re-renders
  const tableStateRef = useRef<TableState>(emptyState);
  const socketRef = useRef(socket);

  // Update refs when values change
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    tableStateRef.current = tableState;
  }, [tableState]);

  // Clear error function - memoize to avoid recreating on every render
  const clearError = useCallback(() => setError(null), []);

  // Listen for table state updates - only depends on socket
  useEffect(() => {
    if (!socket) return;

    // Define all event handlers inside to avoid dependency issues
    const onTableState = (data: TableState) => {
      // Only update state if something significant has changed
      // This comparison is simple but can be expanded for more complex situations
      if (
        !tableStateRef.current || 
        data.tableId !== tableStateRef.current.tableId ||
        data.isYourTurn !== tableStateRef.current.isYourTurn ||
        data.gameState.status !== tableStateRef.current.gameState.status ||
        data.gameState.phase !== tableStateRef.current.gameState.phase ||
        data.gameState.pot !== tableStateRef.current.gameState.pot ||
        data.gameState.currentBet !== tableStateRef.current.gameState.currentBet ||
        data.gameState.currentPlayer !== tableStateRef.current.gameState.currentPlayer ||
        data.players.length !== tableStateRef.current.players.length ||
        JSON.stringify(data.gameState.communityCards) !== JSON.stringify(tableStateRef.current.gameState.communityCards)
      ) {
        console.log('Received table state:', data);
        setTableState(data);
      }
    };

    const onTableList = (data: any[]) => {
      setTables(data);
    };

    const onNewMessage = (data: { playerName: string; message: string; timestamp: string }) => {
      setMessages(prev => [...prev, data]);
    };

    const onActionAcknowledged = (data: { action: string; amount?: number }) => {
      setActionResult(data);
    };

    const onPlayerLeft = ({ playerId }: { playerId: string }) => {
      console.log(`Player ${playerId} left the table`);
    };

    const onPlayerDisconnected = ({ playerId }: { playerId: string }) => {
      console.log(`Player ${playerId} disconnected`);
    };

    const onError = (err: { message: string }) => {
      setError(err.message);
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
      socket.off('tableState', onTableState);
      socket.off('tableList', onTableList);
      socket.off('newMessage', onNewMessage);
      socket.off('actionAcknowledged', onActionAcknowledged);
      socket.off('playerLeft', onPlayerLeft);
      socket.off('playerDisconnected', onPlayerDisconnected);
      socket.off('error', onError);
      socket.off('gameStarting');
    };
  }, [socket]); // Only depend on socket, not tableState

  // Clear error after 5 seconds
  useEffect(() => {
    if (!error) return;
    
    const timer = setTimeout(() => {
      setError(null);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [error]); // Only depend on error

  return {
    tableState,
    tables,
    messages,
    actionResult,
    error,
    clearError
  };
} 