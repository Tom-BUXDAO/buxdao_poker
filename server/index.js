const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pokerLogic = require('./pokerLogic');
const { mapCardToFilename } = require('./cardUtils');
require('dotenv').config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io server
const io = new Server(server, {
  cors: {
    origin: "*", // Accept all origins for development
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Pass the system message function to the poker logic module
pokerLogic.setSystemMessageFunction((tableId, message) => {
  emitSystemMessage(tableId, message);
});

// Game state management
const tables = new Map();
const players = new Map();

// Create a test table for development
const TEST_TABLE_ID = 'test-table';
tables.set(TEST_TABLE_ID, {
  id: TEST_TABLE_ID,
  name: 'Test Table',
  maxPlayers: 8,
  players: [],
  messageHistory: [], // Initialize message history array
  gameState: {
    status: 'waiting', // waiting, starting, playing, ended
    phase: 'waiting', // waiting, preflop, flop, turn, river, showdown
    dealer: 0,
    smallBlind: 10,
    bigBlind: 20,
    currentPlayer: null,
    pot: 0,
    communityCards: [],
    deck: [],
    currentBet: 0,
    winners: []
  }
});

// Pre-defined test player data to make testing easier
const TEST_PLAYERS = [
  { playerNumber: 'player1', name: 'Player 1', avatar: 'https://arweave.net/Q3Ljpx6BNV98Wv6mHO41_vgXMbGXeZgi9YSwLvHDV9M?ext=png', chips: 1000 },
  { playerNumber: 'player2', name: 'Player 2', avatar: 'https://arweave.net/Q3Ljpx6BNV98Wv6mHO41_vgXMbGXeZgi9YSwLvHDV9M?ext=png', chips: 1000 },
  { playerNumber: 'player3', name: 'Player 3', avatar: 'https://arweave.net/Q3Ljpx6BNV98Wv6mHO41_vgXMbGXeZgi9YSwLvHDV9M?ext=png', chips: 1000 },
  { playerNumber: 'player4', name: 'Player 4', avatar: 'https://arweave.net/Q3Ljpx6BNV98Wv6mHO41_vgXMbGXeZgi9YSwLvHDV9M?ext=png', chips: 1000 },
  { playerNumber: 'player5', name: 'Player 5', avatar: 'https://arweave.net/Q3Ljpx6BNV98Wv6mHO41_vgXMbGXeZgi9YSwLvHDV9M?ext=png', chips: 1000 },
  { playerNumber: 'player6', name: 'Player 6', avatar: 'https://arweave.net/Q3Ljpx6BNV98Wv6mHO41_vgXMbGXeZgi9YSwLvHDV9M?ext=png', chips: 1000 },
  { playerNumber: 'player7', name: 'Player 7', avatar: 'https://arweave.net/Q3Ljpx6BNV98Wv6mHO41_vgXMbGXeZgi9YSwLvHDV9M?ext=png', chips: 1000 },
  { playerNumber: 'player8', name: 'Player 8', avatar: 'https://arweave.net/Q3Ljpx6BNV98Wv6mHO41_vgXMbGXeZgi9YSwLvHDV9M?ext=png', chips: 1000 },
];

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Send available tables to the newly connected player
  const tableList = Array.from(tables.values()).map(table => ({
    id: table.id,
    name: table.name,
    playerCount: table.players.length,
    maxPlayers: table.maxPlayers,
    status: table.gameState.status
  }));
  socket.emit('tableList', tableList);

  // Handle player joining a table
  socket.on('joinTable', ({ tableId, playerName, avatar, chips = 1000, playerNumber = null }) => {
    console.log(`Player ${playerName} joining table ${tableId} as ${playerNumber}`);
    
    // Validate table exists
    const table = tables.get(tableId);
    if (!table) {
      socket.emit('error', { message: 'Table not found' });
      return;
    }

    // Create player object
    let player;
    let isNewPlayer = true;
    
    // For test table with player numbers, handle specially
    if (tableId === TEST_TABLE_ID && playerNumber) {
      // Find if this test player already exists at the table
      const existingPlayerIndex = table.players.findIndex(p => 
        p.testPlayerNumber === playerNumber
      );
      
      let position;
      
      if (existingPlayerIndex >= 0) {
        // Replace the existing player with this new connection
        const oldPlayerId = table.players[existingPlayerIndex].id;
        console.log(`Replacing test player ${playerNumber} (${oldPlayerId} with ${socket.id})`);
        
        // Remove old player from players map
        players.delete(oldPlayerId);
        
        // Keep the same position, just update the socket ID
        position = existingPlayerIndex;
        table.players.splice(existingPlayerIndex, 1);
        isNewPlayer = false; // This is a reconnection, not a new player
      } else {
        // Find the predefined test player data
        const testPlayer = TEST_PLAYERS.find(p => p.playerNumber === playerNumber);
        
        if (testPlayer) {
          position = parseInt(playerNumber.replace('player', '')) - 1; // Convert player1 to position 0
          playerName = testPlayer.name;
          avatar = testPlayer.avatar;
          chips = testPlayer.chips;
        } else {
          socket.emit('error', { message: 'Invalid player number' });
          return;
        }
      }

      // Create player object
      player = {
        id: socket.id,
        name: playerName,
        avatar: avatar,
        chips: chips,
        position: position,
        hand: [],
        bet: 0,
        folded: false,
        allIn: false,
        isActive: true,
        testPlayerNumber: playerNumber
      };

      // Add player to table and global players map
      table.players.push(player);
      players.set(socket.id, {
        tableId,
        player
      });
    } else {
      // For regular tables, check if the table is full
      if (table.players.length >= table.maxPlayers) {
        socket.emit('error', { message: 'Table is full' });
        return;
      }

      // Create player object for regular tables
      player = {
        id: socket.id,
        name: playerName,
        avatar: avatar,
        chips: chips,
        position: table.players.length,
        hand: [],
        bet: 0,
        folded: false,
        allIn: false,
        isActive: true
      };

      // Add player to table and global players map
      table.players.push(player);
      players.set(socket.id, {
        tableId,
        player
      });
    }

    // Join the socket room for this table
    socket.join(tableId);
    
    // Add a system message for new player joining (only if they're actually new)
    if (isNewPlayer) {
      const joinMessage = {
        message: `${playerName} joined the table`,
        timestamp: new Date().toISOString(),
        type: 'system'
      };
      
      if (!table.messageHistory) {
        table.messageHistory = [];
      }
      table.messageHistory.push(joinMessage);
      
      // Broadcast the join message to all players at the table
      io.to(tableId).emit('systemMessage', joinMessage);
    }

    // Send updated table state to all players at the table
    emitTableState(tableId);

    // If we have enough players and the game isn't running, we could start it
    if (table.players.length >= 2 && table.gameState.status === 'waiting') {
      // In the future, we'd add logic to start the game here
      console.log('We have enough players to start a game');
    }
  });

  // Handle starting the game
  socket.on('startGame', (data, callback) => {
    console.log(`startGame event received from ${socket.id}`);
    
    const playerData = players.get(socket.id);
    if (!playerData) {
      console.log(`Player not found for socket ${socket.id}`);
      socket.emit('error', { message: 'You need to join a table first' });
      if (callback) callback({ success: false, error: 'You need to join a table first' });
      return;
    }

    const { tableId, player } = playerData;
    console.log(`Player ${player.name} (${socket.id}) is trying to start game at table ${tableId}`);
    
    const table = tables.get(tableId);
    if (!table) {
      console.log(`Table ${tableId} not found`);
      socket.emit('error', { message: 'Table not found' });
      if (callback) callback({ success: false, error: 'Table not found' });
      return;
    }

    // Check if we have enough players
    if (table.players.length < 2) {
      console.log(`Not enough players at table ${tableId}: ${table.players.length}`);
      socket.emit('error', { message: 'Need at least 2 players to start' });
      if (callback) callback({ success: false, error: 'Need at least 2 players to start' });
      return;
    }

    // Check if game is already running, allow restart if it's stuck in 'starting' state
    if (table.gameState.status === 'playing') {
      // Check if this is the same player that started the game or an admin (for demo purposes)
      const isTestTable = tableId === TEST_TABLE_ID;
      if (isTestTable) {
        console.log(`Force restarting game on test table ${tableId} by ${player.name}`);
        // Reset the game state completely - for test table only
        pokerLogic.resetGameState(table);
      } else {
        console.log(`Game already in progress at table ${tableId}`);
        socket.emit('error', { message: 'Game is already in progress' });
        if (callback) callback({ success: false, error: 'Game is already in progress' });
        return;
      }
    }

    console.log(`Starting game on table ${tableId}, initiated by ${player.name} (${socket.id})`);

    // Set table status immediately
    table.gameState.status = 'starting';
    
    // Create a clear system message about game starting
    const gameStartMessage = {
      message: `Game started by ${player.name}`,
      timestamp: new Date().toISOString(),
      type: 'system'
    };
    
    // Add directly to message history
    if (!table.messageHistory) {
      table.messageHistory = [];
    }
    table.messageHistory.push(gameStartMessage);
    
    // Broadcast to all clients at the table
    io.to(tableId).emit('systemMessage', gameStartMessage);
    io.to(tableId).emit('gameStarting');
    
    // Emit table state with updated message history to all clients
    emitTableState(tableId);
    
    if (callback) callback({ success: true });

    // Short delay before dealing cards
    setTimeout(() => {
      try {
        // Randomly assign dealer position before starting a new hand
        table.gameState.dealer = Math.floor(Math.random() * table.players.length);
        console.log(`Randomly assigned dealer position to ${table.gameState.dealer}`);
        
        // Start a new hand
        pokerLogic.startNewHand(table);
        
        // Add another system message for hand dealt
        const handDealtMessage = {
          message: "A new hand has been dealt!",
          timestamp: new Date().toISOString(),
          type: 'system'
        };
        
        // Add to message history
        table.messageHistory.push(handDealtMessage);
        
        // Send message to all clients
        io.to(tableId).emit('systemMessage', handDealtMessage);
        
        // Emit updated state to all players
        emitTableState(tableId);
        
        console.log(`New hand started on table ${tableId}`);
        
        // Force all clients to refresh their state (needed for reliable synchronization)
        setTimeout(() => {
          console.log(`Forcing table state refresh to all clients`);
          io.to(tableId).emit('refreshTableState');
        }, 500);
        
      } catch (error) {
        console.error(`Error starting new hand on table ${tableId}:`, error);
        table.gameState.status = 'waiting';
        io.to(tableId).emit('error', { message: 'Failed to start game. Please try again.' });
      }
    }, 1000);
  });

  // Handle player actions (fold, check, call, raise)
  socket.on('playerAction', ({ action, amount }) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const { tableId, player } = playerData;
    const table = tables.get(tableId);
    if (!table) return;

    // Validate it's the player's turn
    const currentPlayerIndex = table.gameState.currentPlayer;
    if (currentPlayerIndex === null || table.players[currentPlayerIndex].id !== socket.id) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    try {
      // Process the player's action
      pokerLogic.processPlayerAction(table, socket.id, action, amount);
      
      // Construct action message
      const playerName = player.name;
      let actionMessage = '';
      
      switch(action) {
        case 'fold':
          actionMessage = `${playerName} folded`;
          break;
        case 'check':
          actionMessage = `${playerName} checked`;
          break;
        case 'call':
          actionMessage = `${playerName} called $${amount}`;
          break;
        case 'raise':
          actionMessage = `${playerName} raised to $${amount}`;
          break;
        case 'bet':
          actionMessage = `${playerName} bet $${amount}`;
          break;
        case 'allIn':
          actionMessage = `${playerName} went ALL IN with $${amount}`;
          break;
        default:
          actionMessage = `${playerName} took action: ${action}`;
      }
      
      // Create system message for this action
      const systemMessage = {
        message: actionMessage,
        timestamp: new Date().toISOString(),
        type: 'system'
      };
      
      // Add to message history
      if (!table.messageHistory) {
        table.messageHistory = [];
      }
      table.messageHistory.push(systemMessage);
      
      // Send the message to all clients
      io.to(tableId).emit('systemMessage', systemMessage);
      
      // Emit updated state to all players
      emitTableState(tableId);
      
      // Acknowledge the action
      socket.emit('actionAcknowledged', { action, amount });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle player leaving a table
  socket.on('leaveTable', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const { tableId, player } = playerData;
    const table = tables.get(tableId);
    if (!table) return;

    // Remove player from table
    table.players = table.players.filter(p => p.id !== socket.id);
    
    // Update positions for remaining players
    table.players.forEach((p, index) => {
      p.position = index;
    });

    // Remove player from global players map
    players.delete(socket.id);

    // Leave the socket room
    socket.leave(tableId);

    // Notify other players
    io.to(tableId).emit('playerLeft', { playerId: socket.id });
    
    // Update table state for remaining players
    emitTableState(tableId);

    console.log(`Player ${player.name} left table ${tableId}`);
  });

  // Handle chat messages
  socket.on('sendMessage', ({ message }) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const { tableId, player } = playerData;
    const timestamp = new Date().toISOString();
    
    const messageData = {
      playerId: socket.id,
      playerName: player.name,
      message,
      timestamp,
      type: 'chat'
    };
    
    // Emit to all clients at the table
    io.to(tableId).emit('newMessage', messageData);
    
    // Save to table message history
    const table = tables.get(tableId);
    if (table) {
      if (!table.messageHistory) {
        table.messageHistory = [];
      }
      
      // Add to message history
      table.messageHistory.push(messageData);
      
      // Keep only the latest 50 messages
      if (table.messageHistory.length > 50) {
        table.messageHistory = table.messageHistory.slice(-50);
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const { tableId, player } = playerData;
    const table = tables.get(tableId);
    if (!table) return;

    // Mark player as inactive rather than removing
    // This allows for reconnection in a real game
    const tablePlayer = table.players.find(p => p.id === socket.id);
    if (tablePlayer) {
      tablePlayer.isActive = false;
    }

    // Notify other players
    io.to(tableId).emit('playerDisconnected', { playerId: socket.id });
    
    // Update table state for remaining players
    emitTableState(tableId);
  });

  // Handle direct requests for table state
  socket.on('getTableState', () => {
    console.log(`Received getTableState request from ${socket.id}`);
    
    const playerData = players.get(socket.id);
    if (!playerData) {
      console.log(`Player not found for socket ${socket.id}`);
      return;
    }

    const { tableId } = playerData;
    
    // Emit the latest table state to this client
    emitTableState(tableId);
  });
});

// Helper function to emit table state to all players at a table
function emitTableState(tableId) {
  const table = tables.get(tableId);
  if (!table) return;

  // Send table state to each player individually to ensure they only see their own cards
  table.players.forEach(player => {
    const playerSocket = io.sockets.sockets.get(player.id);
    if (playerSocket) {
      playerSocket.emit('tableState', {
        tableId,
        players: table.players.map(p => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          chips: p.chips,
          position: p.position,
          bet: p.bet,
          folded: p.folded,
          allIn: p.allIn,
          isActive: p.isActive,
          // Only send hand details for the current player
          hand: p.id === player.id ? p.hand.map(card => ({
            ...card,
            fileName: mapCardToFilename(card)
          })) : []
        })),
        gameState: {
          status: table.gameState.status,
          phase: table.gameState.phase,
          dealer: table.gameState.dealer,
          smallBlind: table.gameState.smallBlind,
          bigBlind: table.gameState.bigBlind,
          currentPlayer: table.gameState.currentPlayer,
          pot: table.gameState.pot,
          communityCards: table.gameState.communityCards.map(card => ({
            ...card,
            fileName: mapCardToFilename(card)
          })),
          currentBet: table.gameState.currentBet,
          winners: table.gameState.winners?.map(winner => ({
            ...winner,
            winningHand: winner.winningHand?.map(card => ({
              ...card,
              fileName: mapCardToFilename(card)
            }))
          }))
        },
        isYourTurn: table.gameState.currentPlayer !== null && 
                   table.players[table.gameState.currentPlayer]?.id === player.id,
        // Include the table's message history
        messageHistory: table.messageHistory || []
      });
    }
  });
}

// Helper function to emit system messages to all players at a table
function emitSystemMessage(tableId, message) {
  if (!tableId || !message) return;

  console.log(`Sending system message to table ${tableId}: "${message}"`);
  
  const timestamp = new Date().toISOString();
  
  // Emit the system message with explicit type field
  io.to(tableId).emit('systemMessage', {
    message,
    timestamp,
    type: 'system'  // Explicitly set the type
  });
  
  // Also save this message to the table's message history for new clients
  const table = tables.get(tableId);
  if (table) {
    if (!table.messageHistory) {
      table.messageHistory = [];
    }
    
    // Add to message history
    table.messageHistory.push({
      message,
      timestamp,
      type: 'system'
    });
    
    // Keep only the latest 50 messages
    if (table.messageHistory.length > 50) {
      table.messageHistory = table.messageHistory.slice(-50);
    }
  }
}

// Helper function to broadcast game starting to all players
function broadcastGameStarting(tableId, initiatorName) {
  if (!tableId) return;
  
  console.log(`Broadcasting gameStarting to all players at table ${tableId}`);
  
  // First emit the gameStarting event to all clients
  io.to(tableId).emit('gameStarting');
  
  // Then send a system message about who started the game
  emitSystemMessage(tableId, `Game started by ${initiatorName}`);
  
  // Update the table status in our data structure
  const table = tables.get(tableId);
  if (table) {
    table.gameState.status = 'starting';
    
    // Ask all clients to request a fresh table state
    setTimeout(() => {
      console.log(`Prompting clients to refresh table state`);
      io.to(tableId).emit('refreshTableState');
    }, 500);
  }
}

// API Endpoints
app.get('/api/tables', (req, res) => {
  const tableList = Array.from(tables.values()).map(table => ({
    id: table.id,
    name: table.name,
    playerCount: table.players.length,
    maxPlayers: table.maxPlayers,
    status: table.gameState.status
  }));
  res.json(tableList);
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 