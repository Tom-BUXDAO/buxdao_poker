// Types for the poker game

// Define common types used across the application

// Card type
export interface Card {
  value: string;
  suit: string;
  fileName: string;
}

// Player type
export interface Player {
  id: number;
  position: number;
  name: string;
  chips: number;
  bet: number;
  isActive: boolean;
  folded: boolean;
  hand: Card[];
}

// Game state interface
export interface GameState {
  status: string;
  phase: string;
  dealer: number;
  activePlayer: number;
  currentPlayer?: number | null;
  smallBlind: number;
  bigBlind: number;
  pot: number;
  userCards: Card[];
  gameId: string;
  communityCards?: Card[];
  currentBet?: number;
  winners?: any[];
}

// Chat message type
export interface ChatMessage {
  type: 'chat' | 'system';
  sender?: string;
  message: string;
  time: string;
  playerId?: string;
}

// Table state type
export interface TableState {
  tableId: string;
  players: Player[];
  gameState: GameState;
  isYourTurn: boolean;
  messageHistory?: string[];
} 