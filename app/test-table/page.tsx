'use client';

import { useEffect, useState, useCallback, memo, useMemo, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGameState } from '../hooks/useGameState';
import Link from 'next/link';
import Image from 'next/image';
import GlobalChat from '../components/GlobalChat';
import { Card } from '../types';

// Memoize static components
const PlayerOption = memo(({ number, name, avatar }: { number: string; name: string; avatar: string }) => (
  <Link
    key={number}
    href={`/test-table/${number}`}
    className="p-4 bg-gray-700 rounded-lg hover:bg-blue-700 transition-colors flex flex-col items-center"
  >
    <div className="w-16 h-16 bg-gray-600 rounded-full mb-2 overflow-hidden">
      <Image
        src={avatar}
        alt={name}
        width={64}
        height={64}
        className="object-cover"
        unoptimized={true}
        priority={true}
      />
    </div>
    <span className="font-bold">{name}</span>
  </Link>
));

// Wrap the component to prevent render loops
export default function TestTable() {
  // Use refs to track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  const { socket, isConnected, joinTable, leaveTable, sendAction, sendMessage, startGame } = useSocket();
  const { tableState, messages, error } = useGameState();
  const [state, setState] = useState({
    playerName: '',
    chatMessage: '',
    hasJoined: false,
    raiseAmount: 0,
    showRaiseInput: false
  });
  
  // Destructure for easier access
  const { playerName, chatMessage, hasJoined, raiseAmount, showRaiseInput } = state;
  
  // Safe state update function to prevent state updates after unmount
  const safeSetState = useCallback((updates: Partial<typeof state>) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Default avatar for testing - memoize this
  const defaultAvatar = useMemo(() => "https://arweave.net/Q3Ljpx6BNV98Wv6mHO41_vgXMbGXeZgi9YSwLvHDV9M?ext=png", []);

  // List of available test players - memoize this
  const testPlayers = useMemo(() => [
    { number: 'player1', name: 'Player 1', avatar: defaultAvatar },
    { number: 'player2', name: 'Player 2', avatar: defaultAvatar },
    { number: 'player3', name: 'Player 3', avatar: defaultAvatar },
    { number: 'player4', name: 'Player 4', avatar: defaultAvatar },
    { number: 'player5', name: 'Player 5', avatar: defaultAvatar },
    { number: 'player6', name: 'Player 6', avatar: defaultAvatar },
    { number: 'player7', name: 'Player 7', avatar: defaultAvatar },
    { number: 'player8', name: 'Player 8', avatar: defaultAvatar },
  ], [defaultAvatar]);

  // Handle joining the table - memoize this callback
  const handleJoin = useCallback(() => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    joinTable('test-table', playerName, defaultAvatar);
    safeSetState({ hasJoined: true });
  }, [playerName, joinTable, defaultAvatar, safeSetState]);

  // Handle leaving the table - memoize this callback
  const handleLeave = useCallback(() => {
    leaveTable();
    safeSetState({ hasJoined: false });
  }, [leaveTable, safeSetState]);

  // Handle sending chat messages - memoize this callback
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    sendMessage(chatMessage);
    safeSetState({ chatMessage: '' });
  }, [chatMessage, sendMessage, safeSetState]);

  // Handle player actions - memoize this callback
  const handleAction = useCallback((action: string, amount?: number) => {
    sendAction(action, amount);
    safeSetState({ showRaiseInput: false });
  }, [sendAction, safeSetState]);

  // Set initial raise amount when showing raise input - use useEffect with proper dependencies
  useEffect(() => {
    if (showRaiseInput && tableState.gameState.currentBet !== undefined && tableState.gameState.currentBet > 0) {
      safeSetState({ raiseAmount: tableState.gameState.currentBet * 2 });
    }
  }, [showRaiseInput, tableState.gameState.currentBet, safeSetState]);

  // Render the player options with memoized component
  const renderPlayerOptions = useMemo(() => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {testPlayers.map((player) => (
        <PlayerOption 
          key={player.number}
          number={player.number} 
          name={player.name} 
          avatar={player.avatar} 
        />
      ))}
    </div>
  ), [testPlayers]);

  // Check if it's the player's turn - memoize this
  const isPlayerTurn = useMemo(() => tableState.isYourTurn, [tableState.isYourTurn]);

  // Get current player's data - memoize this
  const currentPlayer = useMemo(() => 
    tableState.players.find(player => socket && player.id.toString() === socket.id),
    [tableState.players, socket]
  );

  // Get player positions - memoize these values
  const dealerPosition = tableState.gameState.dealer;
  
  // Memoize these functions
  const getSmallBlindPosition = useCallback(() => {
    if (dealerPosition === undefined || tableState.players.length === 0) return -1;
    return (dealerPosition + 1) % tableState.players.length;
  }, [dealerPosition, tableState.players.length]);
  
  const getBigBlindPosition = useCallback(() => {
    if (dealerPosition === undefined || tableState.players.length === 0) return -1;
    return (dealerPosition + 2) % tableState.players.length;
  }, [dealerPosition, tableState.players.length]);

  // Get player position names - memoize this function
  const getPlayerPositionName = useCallback((playerIndex: number) => {
    if (playerIndex === dealerPosition) return 'Dealer';
    if (playerIndex === getSmallBlindPosition()) return 'Small Blind';
    if (playerIndex === getBigBlindPosition()) return 'Big Blind';
    return '';
  }, [dealerPosition, getSmallBlindPosition, getBigBlindPosition]);

  // Get minimum raise amount - memoize this function
  const getMinimumRaiseAmount = useCallback(() => {
    const currentBet = tableState.gameState.currentBet;
    return currentBet !== undefined && currentBet > 0 ? currentBet * 2 : tableState.gameState.bigBlind * 2;
  }, [tableState.gameState.currentBet, tableState.gameState.bigBlind]);

  // Check if the game is in showdown phase - memoize this
  const isShowdown = useMemo(() => 
    tableState.gameState.phase === 'showdown',
    [tableState.gameState.phase]
  );

  // Listen for game starting window events
  useEffect(() => {
    const handleGameStarting = (event: any) => {
      console.log('Test table: Detected game starting event', event.detail);
      
      // Force a refresh of the table state
      if (isConnected && socket) {
        console.log('Test table: Requesting fresh table state after game start');
        
        // Request the latest table state
        socket.emit('getTableState');
      }
    };
    
    // Add listener for the custom event
    window.addEventListener('poker-game-starting', handleGameStarting);
    
    // Clean up
    return () => {
      window.removeEventListener('poker-game-starting', handleGameStarting);
    };
  }, [isConnected, socket]);

  return (
    <div className="min-h-screen p-4 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Texas Hold'em Test Table</h1>
        
        {/* Connection status */}
        <div className="mb-4">
          <div className={`inline-block w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{isConnected ? 'Connected to server' : 'Disconnected'}</span>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-2 bg-red-800 rounded">
            Error: {error}
          </div>
        )}
        
        {/* Test players selection */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">🎮 Test Players</h2>
          <p className="mb-4">
            Select one of the predefined test players below to join the table. 
            You can open multiple browser windows to simulate a full table of players.
          </p>
          
          {renderPlayerOptions}
        </div>
        
        {/* Custom join form */}
        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Or Join With Custom Name</h2>
          {!hasJoined ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => safeSetState({ playerName: e.target.value })}
                placeholder="Enter your name"
                className="p-2 rounded text-black flex-grow"
              />
              <button
                onClick={handleJoin}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                disabled={!isConnected}
              >
                Join
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span>Joined as: <strong>{playerName}</strong></span>
              <button
                onClick={handleLeave}
                className="px-2 py-1 bg-red-600 rounded text-sm hover:bg-red-700"
              >
                Leave Table
              </button>
            </div>
          )}
        </div>
        
        {/* Game info when joined directly */}
        {hasJoined && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Game info */}
            <div className="col-span-1 md:col-span-2">
              <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                <div className="flex justify-between mb-2">
                  <h2 className="text-xl font-bold">Game Status: {tableState.gameState.status}</h2>
                  <button
                    onClick={handleLeave}
                    className="px-2 py-1 bg-red-600 rounded text-sm hover:bg-red-700"
                  >
                    Leave Table
                  </button>
                </div>
                
                {/* Game details */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>Phase: <span className="font-semibold">{tableState.gameState.phase}</span></div>
                  <div>Pot: <span className="font-semibold text-yellow-400">${tableState.gameState.pot}</span></div>
                  <div>Small Blind: <span className="font-semibold">${tableState.gameState.smallBlind}</span></div>
                  <div>Big Blind: <span className="font-semibold">${tableState.gameState.bigBlind}</span></div>
                  <div>Current Bet: <span className="font-semibold text-yellow-400">${tableState.gameState.currentBet}</span></div>
                  {tableState.gameState.currentPlayer !== null && tableState.gameState.currentPlayer !== undefined && (
                    <div>
                      Current Player: <span className="font-semibold text-green-400">
                        {tableState.players[tableState.gameState.currentPlayer]?.name}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Start game button */}
                {tableState.gameState.status === 'waiting' && (
                  <button
                    onClick={() => {
                      console.log('Test Table: Sending startGame command');
                      startGame();
                      console.log('Test Table: startGame command sent');
                    }}
                    className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 w-full"
                  >
                    Start Game
                  </button>
                )}
              </div>
              
              {/* Showdown winners */}
              {isShowdown && tableState.gameState.winners && tableState.gameState.winners.length > 0 && (
                <div className="mb-4 p-4 bg-yellow-800 rounded-lg">
                  <h2 className="text-xl font-bold mb-2">🏆 Showdown Winners 🏆</h2>
                  <div className="space-y-2">
                    {tableState.gameState.winners.map((winner, index) => (
                      <div key={index} className="bg-yellow-900 p-2 rounded">
                        <div className="font-bold">{winner.name} wins with {winner.handRank}</div>
                        {winner.winningHand && winner.winningHand.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {winner.winningHand.map((card: Card, cardIndex: number) => (
                              <div key={cardIndex} className="w-10 h-14 bg-white rounded-md relative">
                                {card.fileName && (
                                  <Image
                                    src={`/cards/${card.fileName}.png`}
                                    alt={`${card.value} of ${card.suit}`}
                                    width={40}
                                    height={56}
                                    className="object-contain w-full h-auto"
                                    unoptimized={true}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Community cards */}
              <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                <h2 className="text-xl font-bold mb-2">Community Cards</h2>
                <div className="flex gap-2 justify-center">
                  {tableState.gameState.communityCards && tableState.gameState.communityCards.length > 0 ? (
                    tableState.gameState.communityCards.map((card, i) => (
                      <div key={i} className="w-16 h-24 bg-white rounded-md relative">
                        {card.fileName && (
                          <Image
                            src={`/cards/${card.fileName}.png`}
                            alt={`${card.value} of ${card.suit}`}
                            width={64}
                            height={96}
                            className="object-contain w-full h-auto"
                            unoptimized={true}
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400">No community cards yet</div>
                  )}
                </div>
              </div>
              
              {/* Player cards */}
              {currentPlayer && (
                <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                  <h2 className="text-xl font-bold mb-2">Your Hand</h2>
                  <div className="flex gap-2 justify-center">
                    {currentPlayer.hand.length > 0 ? (
                      currentPlayer.hand.map((card, i) => (
                        <div key={i} className="w-16 h-24 bg-white rounded-md relative">
                          {card.fileName && (
                            <Image
                              src={`/cards/${card.fileName}.png`}
                              alt={`${card.value} of ${card.suit}`}
                              width={64}
                              height={96}
                              className="object-contain w-full h-auto"
                              unoptimized={true}
                            />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400">No cards dealt yet</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Player actions */}
              {isPlayerTurn && (
                <div className="mb-4 p-4 bg-green-900 rounded-lg">
                  <h2 className="text-xl font-bold mb-2">Your Turn</h2>
                  {!showRaiseInput ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAction('fold')}
                        className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
                      >
                        Fold
                      </button>
                      <button
                        onClick={() => handleAction('check')}
                        className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
                        disabled={(tableState.gameState.currentBet !== undefined && tableState.gameState.currentBet > 0) && currentPlayer?.bet !== tableState.gameState.currentBet}
                      >
                        {(tableState.gameState.currentBet !== undefined && tableState.gameState.currentBet > 0) && currentPlayer?.bet !== tableState.gameState.currentBet ? "Can't Check" : "Check"}
                      </button>
                      {tableState.gameState.currentBet !== undefined && tableState.gameState.currentBet > 0 && (
                        <button
                          onClick={() => handleAction('call')}
                          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                          disabled={currentPlayer?.bet === tableState.gameState.currentBet}
                        >
                          Call ${tableState.gameState.currentBet - (currentPlayer?.bet || 0)}
                        </button>
                      )}
                      <button
                        onClick={() => safeSetState({ showRaiseInput: true })}
                        className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
                        disabled={currentPlayer && currentPlayer.chips <= 0}
                      >
                        Raise
                      </button>
                      {currentPlayer && currentPlayer.chips > 0 && (
                        <button
                          onClick={() => handleAction('raise', currentPlayer.chips + (currentPlayer.bet || 0))}
                          className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
                        >
                          All In (${currentPlayer.chips})
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={raiseAmount}
                          onChange={(e) => safeSetState({ raiseAmount: Math.max(getMinimumRaiseAmount(), parseInt(e.target.value) || 0) })}
                          className="p-2 rounded text-black w-24"
                          min={getMinimumRaiseAmount()}
                          max={currentPlayer ? currentPlayer.chips + (currentPlayer.bet || 0) : 0}
                        />
                        <span>Min: ${getMinimumRaiseAmount()}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction('raise', raiseAmount)}
                          className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
                          disabled={raiseAmount < getMinimumRaiseAmount() || (currentPlayer && raiseAmount > currentPlayer.chips + (currentPlayer.bet || 0))}
                        >
                          Raise to ${raiseAmount}
                        </button>
                        <button
                          onClick={() => safeSetState({ showRaiseInput: false })}
                          className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Players and chat */}
            <div className="col-span-1">
              {/* Players list */}
              <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                <h2 className="text-xl font-bold mb-2">Players ({tableState.players.length})</h2>
                <div className="space-y-2">
                  {tableState.players.map((player, index) => (
                    <div 
                      key={player.id} 
                      className={`flex items-center p-2 rounded ${
                        player.id === socket?.id ? 'bg-blue-900' : 'bg-gray-700'
                      } ${!player.isActive ? 'opacity-50' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden mr-2 relative">
                        <Image
                          src={player.avatar}
                          alt={player.name}
                          width={32}
                          height={32}
                          className="object-cover w-full h-auto"
                        />
                        {/* Position indicator */}
                        {getPlayerPositionName(index) && (
                          <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {getPlayerPositionName(index) === 'Dealer' ? 'D' : 
                             getPlayerPositionName(index) === 'Small Blind' ? 'S' : 'B'}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center">
                          <span>{player.name}</span>
                          {player.id === socket?.id && <span className="ml-1 text-xs text-blue-300">(You)</span>}
                        </div>
                        <div className="text-xs flex flex-wrap gap-1">
                          <span className="text-yellow-400">${player.chips}</span>
                          {player.folded && <span className="text-red-400">(Folded)</span>}
                          {player.allIn && <span className="text-purple-400">(All-in)</span>}
                          {player.bet > 0 && <span className="text-green-400">(Bet: ${player.bet})</span>}
                        </div>
                      </div>
                      {tableState.gameState.currentPlayer !== null && 
                       tableState.players[tableState.gameState.currentPlayer]?.id === player.id && (
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Chat */}
              <div className="p-4 bg-gray-800 rounded-lg h-60">
                <GlobalChat playerName={currentPlayer?.name || 'Player'} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 