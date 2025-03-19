# Texas Hold'em Poker Game Server

This is the Socket.io server for the Texas Hold'em poker game. It handles game state management, player connections, and the poker game logic.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   
Copy `.env.example` to `.env` and adjust settings if needed:
```bash
cp .env.example .env
```

The default settings are:
```
PORT=3001
CLIENT_URL=http://localhost:3000
```

### Running the Server

#### Development mode (with auto-restart)
```bash
npm run dev
```

#### Production mode
```bash
npm start
```

## Features

- Real-time multiplayer poker game using Socket.io
- Implementation of Texas Hold'em rules and game flow
- Support for multiple tables
- Test table for development
- Player actions: fold, check, call, raise
- Chat functionality
- Player reconnection handling

## API

### Socket.io Events

#### Client to Server Events:

- `joinTable`: Join a poker table
- `leaveTable`: Leave the current table
- `playerAction`: Perform a game action (fold, check, call, raise)
- `sendMessage`: Send a chat message
- `startGame`: Start the game (when enough players are present)

#### Server to Client Events:

- `tableList`: List of available tables
- `tableState`: Current state of the table (players, cards, bets, etc.)
- `newMessage`: New chat message received
- `playerLeft`: Notification when a player leaves
- `playerDisconnected`: Notification when a player disconnects
- `error`: Error messages
- `gameStarting`: Notification that the game is starting
- `actionAcknowledged`: Confirmation of player action

## Folder Structure

- `index.js` - Main server file with Socket.io and Express setup
- `pokerLogic.js` - Core poker game rules and logic
- `cardUtils.js` - Utility functions for card handling 