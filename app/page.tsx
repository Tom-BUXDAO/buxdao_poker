'use client';

import Image from "next/image";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from './context/SocketContext';
import GlobalChat from './components/GlobalChat';

// Declare global properties for the window object
declare global {
  interface Window {
    _pokerHandlerAttached?: boolean;
    _homeComponentSetupComplete?: boolean;
    _socketUpdateInProgress?: boolean;
  }
}

// Define card types
interface Card {
  value: string;
  suit: string;
  fileName: string;
}

// Add type to player
interface Player {
  id: number;
  position: number;
  name: string;
  chips: number;
  bet: number;
  isActive: boolean;
  folded: boolean;
  hand: Card[];
}

// Define game state interface
interface GameState {
  status: string;
  dealer: number;
  activePlayer: number;
  smallBlind: number;
  bigBlind: number;
  pot: number;
  userCards: Card[];
  gameId: string;
}

// Game Status Header Component
const GameStatusHeader: React.FC = () => {
  return (
    <div className="game-status-header bg-gray-800 text-white p-3 rounded-lg shadow-lg mb-4">
      <div className="flex justify-between items-center">
        <div className="blind-info">
          <div className="flex space-x-6">
            <div>
              <span className="text-gray-400 mr-2">Blind:</span>
              <span className="font-bold">10/20</span>
            </div>
            <div>
              <span className="text-gray-400 mr-2">Next blinds:</span>
              <span className="font-bold">10:00</span>
            </div>
          </div>
        </div>
        <div className="player-info">
          <div className="flex space-x-6">
            <div>
              <span className="text-gray-400 mr-2">Players:</span>
              <span className="font-bold">8/8</span>
            </div>
            <div>
              <span className="text-gray-400 mr-2">Position:</span>
              <span className="font-bold">4th</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Player Card Component (Face Down version)
const FaceDownCard: React.FC = () => {
  return (
    <div className="relative w-[50px] h-[70px] rounded-md overflow-hidden">
      <div className="absolute inset-0 bg-blue-600 border border-white rounded-md"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[80%] h-[85%] border-2 border-blue-400 rounded-sm flex items-center justify-center">
          <div className="w-[60%] h-[60%] border border-blue-400 rounded-sm"></div>
        </div>
      </div>
    </div>
  );
};

// Face Up Card Component (to match face down card size)
const FaceUpCard: React.FC<{ cardName: string }> = ({ cardName }) => {
  return (
    <div className="relative w-[50px] h-[70px] rounded-md overflow-hidden">
        <Image
        src={`/cards/${cardName}.png`} 
        alt={`${cardName} Card`} 
        width={50} 
        height={70}
        className="w-full h-full object-contain"
          priority
        />
    </div>
  );
};

// Large Card Component for the user's hand in bottom left
const LargeCard: React.FC<{ cardName: string }> = ({ cardName }) => {
  return (
    <div className="relative w-[112px] h-[160px] rounded-md overflow-hidden">
            <Image
        src={`/cards/${cardName}.png`} 
        alt={`${cardName} Card`} 
        width={112} 
        height={160}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
};

// Player Component with face down cards
const Player: React.FC<{ 
  name: string; 
  position: number; 
  chips: number;
  isActive?: boolean;
  cards?: Card[];
  dealer?: boolean;
  isCurrentPlayer?: boolean;
  folded?: boolean;
}> = ({ name, position, chips, isActive = false, cards = [], dealer = false, isCurrentPlayer = false, folded = false }) => {
  // Map of player profile images
  const playerImages = {
    1: "https://arweave.net/Q3Ljpx6BNV98Wv6mHO41_vgXMbGXeZgi9YSwLvHDV9M?ext=png",
    2: "https://nftstorage.link/ipfs/bafybeigo2argdud77koqsik6bucisxhsqix3emkkmxw6x54q6y5zjhhwva/10.png",
    3: "https://arweave.net/dDbt5xjUijtWa9cgQI8pNgQxQWGtWzSjCai6_Q8IYNw",
    4: "https://nftstorage.link/ipfs/bafybeieecnb4ngc6rnsagyvmfciy5sjgqbhpxrehgfv6qcbntq3hdrm6wq/126.png",
    5: "https://nftstorage.link/ipfs/bafybeieecnb4ngc6rnsagyvmfciy5sjgqbhpxrehgfv6qcbntq3hdrm6wq/437.png",
    6: "https://arweave.net/yheuGMtf3wV622CC9vaXJNQ8MSRKblgYfYmzpvma2_Y",
    7: "https://arweave.net/xptNzwgdR4ReqkZvhCBpdRAcBczygNr7p2Kw2I0XkJM",
    8: "https://gateway.pinata.cloud/ipfs/QmXrUnsKMogkfifzqSb2odBacrYxagsCZFdEHrFjiCY3Fd"
  };

  // Add a highlight class for the active player
  const activeClass = isActive ? "border-yellow-400 border-4" : "";

  // Add a highlight for current player
  const currentPlayerClass = isCurrentPlayer ? "border-green-400 border-4" : "";

  // Add folded visual state - gray out the player avatar
  const foldedClass = folded ? "opacity-50 grayscale" : "";

  // Check if this is a bottom seat (positions 6, 7, 8)
  const isBottomSeat = position === 6 || position === 7 || position === 8;

  // Only show cards if player hasn't folded
  const shouldShowCards = !folded;

  return (
    <div className="player-wrapper flex flex-col items-center relative">
      {/* Player name and chips - show above avatar for non-bottom seats */}
      {!isBottomSeat && (
        <div className={`player-name-chip text-white text-base font-bold bg-gray-800 px-3 py-1 rounded-md flex items-center mb-2 ${folded ? "opacity-50" : ""}`}>
        <span>{name}</span>
        <span className="mx-1 text-gray-400">|</span>
        <span className="text-yellow-400">{chips}</span>
          {isCurrentPlayer && <span className="ml-1 text-green-400">▶</span>}
      </div>
      )}
      
      {/* Cards for bottom positions - show above avatar */}
      {isBottomSeat && shouldShowCards && cards.length > 0 && (
        <div className="flex space-x-2 mb-2">
          {cards.map((card, idx) => (
            <div key={idx}>
              {isCurrentPlayer && card.fileName ? 
                <FaceUpCard cardName={card.fileName} /> : 
                <FaceDownCard />
              }
            </div>
          ))}
        </div>
      )}
      
      {/* Dealer Button - show beside the avatar */}
      {dealer && (
        <div className="absolute bottom-1/2 right-0 translate-x-4 transform bg-yellow-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
          D
        </div>
      )}
      
      {/* Circular avatar */}
      <div className={`player-avatar rounded-full h-20 w-20 overflow-hidden ${activeClass} ${currentPlayerClass} ${foldedClass} border-[3px] border-white shadow-lg`}>
        <Image
          src={playerImages[position as keyof typeof playerImages]} 
          alt={name} 
          width={80} 
          height={80}
          className="object-cover"
          priority={true}
        />
      </div>
      
      {/* Cards for non-bottom positions - show below avatar */}
      {!isBottomSeat && shouldShowCards && cards.length > 0 && (
        <div className="flex space-x-2 mt-2">
          {cards.map((card, idx) => (
            <div key={idx}>
              {isCurrentPlayer && card.fileName ? 
                <FaceUpCard cardName={card.fileName} /> : 
                <FaceDownCard />
              }
            </div>
          ))}
        </div>
      )}
      
      {/* Player name and chips - show below avatar for bottom seats */}
      {isBottomSeat && (
        <div className={`player-name-chip text-white text-base font-bold bg-gray-800 px-3 py-1 rounded-md flex items-center mt-2 ${folded ? "opacity-50" : ""}`}>
          <span>{name}</span>
          <span className="mx-1 text-gray-400">|</span>
          <span className="text-yellow-400">{chips}</span>
          {isCurrentPlayer && <span className="ml-1 text-green-400">▶</span>}
        </div>
      )}
    </div>
  );
};

// Community Cards Component
const CommunityCards: React.FC = () => {
  return (
    <div className="community-cards absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
      <div className="cards flex gap-2 justify-center">
        {/* No cards shown initially */}
      </div>
    </div>
  );
};

// Poker Chip Component
const PokerChip: React.FC<{ amount: number; playerNumber: number }> = ({ amount, playerNumber }) => {
  // Function to get chip color for the SVG fill
  const getChipColor = (playerNum: number) => {
    switch(playerNum) {
      case 1: return "#2563eb"; // Blue
      case 2: return "#f97316"; // Orange
      case 3: return "#16a34a"; // Green
      case 4: return "#dc2626"; // Red
      case 5: return "#9333ea"; // Purple
      case 6: return "#ca8a04"; // Yellow
      case 7: return "#0d9488"; // Teal
      case 8: return "#4f46e5"; // Indigo
      default: return "#2563eb"; // Default Blue
    }
  };

  const chipColor = getChipColor(playerNumber);

  return (
    <div className="flex items-center space-x-0.5">
      <div className="w-7 h-7">
        <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
          {/* Background circle with player color */}
          <circle cx="128" cy="128" r="120" fill={chipColor} />
          
          {/* White lines of the chip */}
          <path
            d="M199.03711,198.30981a99.82288,99.82288,0,0,0,0-140.61962A3.982,3.982,0,0,0,198.71,57.29a3.90416,3.90416,0,0,0-.40088-.32776,99.8226,99.8226,0,0,0-140.61816,0A3.90416,3.90416,0,0,0,57.29,57.29a3.982,3.982,0,0,0-.32715.40015,99.82288,99.82288,0,0,0,0,140.61962A3.982,3.982,0,0,0,57.29,198.71a3.93475,3.93475,0,0,0,.40088.32764,99.82231,99.82231,0,0,0,140.61816,0A3.93475,3.93475,0,0,0,198.71,198.71,3.982,3.982,0,0,0,199.03711,198.30981ZM36.09229,132H68.14844a59.72942,59.72942,0,0,0,14.72217,35.47327L60.2124,190.13135A91.64821,91.64821,0,0,1,36.09229,132ZM60.2124,65.86865,82.87061,88.52673A59.72942,59.72942,0,0,0,68.14844,124H36.09229A91.64821,91.64821,0,0,1,60.2124,65.86865ZM219.90771,124H187.85156a59.72942,59.72942,0,0,0-14.72217-35.47327L195.7876,65.86865A91.64821,91.64821,0,0,1,219.90771,124ZM128,180a52,52,0,1,1,52-52A52.059,52.059,0,0,1,128,180Zm39.47314-97.12952A59.73257,59.73257,0,0,0,132,68.14819V36.09229A91.64757,91.64757,0,0,1,190.13135,60.2124ZM124,68.14819A59.73257,59.73257,0,0,0,88.52686,82.87048L65.86865,60.2124A91.64757,91.64757,0,0,1,124,36.09229ZM88.52686,173.12952A59.73257,59.73257,0,0,0,124,187.85181v32.0559A91.64757,91.64757,0,0,1,65.86865,195.7876ZM132,187.85181a59.73257,59.73257,0,0,0,35.47314-14.72229l22.65821,22.65808A91.64757,91.64757,0,0,1,132,219.90771Zm41.12939-20.37854A59.72942,59.72942,0,0,0,187.85156,132h32.05615a91.64821,91.64821,0,0,1-24.12011,58.13135Z"
            fill="white"
            stroke="none"
          />
          
          {/* Inner circle for the chip */}
          <circle cx="128" cy="128" r="52" fill={chipColor} stroke="white" strokeWidth="2" />
        </svg>
      </div>
      <div className="text-sm font-bold text-yellow-400 bg-gray-800/90 px-2 py-0.5 rounded-full shadow-sm z-10">
        ${amount}
      </div>
    </div>
  );
};

// Total Pot Component
const TotalPot: React.FC = () => {
  return (
    <div className="pot-display flex items-center">
      <div className="pot-amount bg-gray-800/95 px-3 py-1.5 rounded-full shadow-md mr-2">
        <span className="text-yellow-400 font-bold text-lg">$0</span>
      </div>
      <div className="w-7 h-7">
        <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
          {/* Background circle with black color */}
          <circle cx="128" cy="128" r="120" fill="#1A1A1A" />
          
          {/* White lines of the chip */}
          <path
            d="M199.03711,198.30981a99.82288,99.82288,0,0,0,0-140.61962A3.982,3.982,0,0,0,198.71,57.29a3.90416,3.90416,0,0,0-.40088-.32776,99.8226,99.8226,0,0,0-140.61816,0A3.90416,3.90416,0,0,0,57.29,57.29a3.982,3.982,0,0,0-.32715.40015,99.82288,99.82288,0,0,0,0,140.61962A3.982,3.982,0,0,0,57.29,198.71a3.93475,3.93475,0,0,0,.40088.32764,99.82231,99.82231,0,0,0,140.61816,0A3.93475,3.93475,0,0,0,198.71,198.71,3.982,3.982,0,0,0,199.03711,198.30981ZM36.09229,132H68.14844a59.72942,59.72942,0,0,0,14.72217,35.47327L60.2124,190.13135A91.64821,91.64821,0,0,1,36.09229,132ZM60.2124,65.86865,82.87061,88.52673A59.72942,59.72942,0,0,0,68.14844,124H36.09229A91.64821,91.64821,0,0,1,60.2124,65.86865ZM219.90771,124H187.85156a59.72942,59.72942,0,0,0-14.72217-35.47327L195.7876,65.86865A91.64821,91.64821,0,0,1,219.90771,124ZM128,180a52,52,0,1,1,52-52A52.059,52.059,0,0,1,128,180Zm39.47314-97.12952A59.73257,59.73257,0,0,0,132,68.14819V36.09229A91.64757,91.64757,0,0,1,190.13135,60.2124ZM124,68.14819A59.73257,59.73257,0,0,0,88.52686,82.87048L65.86865,60.2124A91.64757,91.64757,0,0,1,124,36.09229ZM88.52686,173.12952A59.73257,59.73257,0,0,0,124,187.85181v32.0559A91.64757,91.64757,0,0,1,65.86865,195.7876ZM132,187.85181a59.73257,59.73257,0,0,0,35.47314-14.72229l22.65821,22.65808A91.64757,91.64757,0,0,1,132,219.90771Zm41.12939-20.37854A59.72942,59.72942,0,0,0,187.85156,132h32.05615a91.64821,91.64821,0,0,1-24.12011,58.13135Z"
            fill="white"
            stroke="none"
          />
          
          {/* Inner circle for the chip */}
          <circle cx="128" cy="128" r="52" fill="#1A1A1A" stroke="white" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
};

// Action Buttons Component
const ActionButtons: React.FC<{ 
  isGameActive: boolean; 
  isPlayerTurn: boolean;
  currentBet: number;
  bigBlind: number;
  onFold?: () => void;
  onCall?: (amount: number) => void;
  onRaise?: (amount: number) => void;
}> = ({ isGameActive, isPlayerTurn, currentBet, bigBlind, onFold, onCall, onRaise }) => {
  // Set bet amounts based on blinds
  const minBet = bigBlind;
  const [betAmount, setBetAmount] = useState(currentBet > 0 ? currentBet * 2 : minBet); // Min raise is current bet + min bet
  
  // Helper to increase bet in increments of minBet
  const increaseBet = () => {
    setBetAmount(prev => prev + minBet);
  };
  
  // Helper to decrease bet in increments of minBet, but not below minimum
  const decreaseBet = () => {
    if (betAmount - minBet >= (currentBet > 0 ? currentBet * 2 : minBet)) {
      setBetAmount(prev => prev - minBet);
    }
  };
  
  // Update bet amount when current bet changes
  useEffect(() => {
    setBetAmount(currentBet > 0 ? currentBet * 2 : minBet);
  }, [currentBet, minBet]);

  // Determine if buttons should be disabled
  const isDisabled = !isGameActive || !isPlayerTurn;
  
  // Handle fold click with proper check
  const handleFold = () => {
    if (onFold && !isDisabled) {
      onFold();
    }
  };

  // Handle call click with proper check
  const handleCall = () => {
    if (onCall && !isDisabled) {
      onCall(currentBet);
    }
  };

  // Handle raise click with proper check
  const handleRaise = () => {
    if (onRaise && !isDisabled) {
      onRaise(betAmount);
    }
  };
  
  return (
    <div className="action-buttons">
      {/* Main action buttons */}
      <div className="flex justify-center space-x-3 mb-2">
        <button 
          disabled={isDisabled}
          className={`bg-red-600 hover:bg-red-700 text-white px-12 py-2 rounded-md font-bold text-lg
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleFold}
        >
          FOLD
        </button>
        <button 
          disabled={isDisabled}
          className={`bg-blue-600 hover:bg-blue-700 text-white px-12 py-2 rounded-md font-bold text-lg
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleCall}
        >
          {currentBet > 0 ? `CALL ${currentBet}` : 'CHECK'}
        </button>
        <button 
          disabled={isDisabled}
          className={`bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-md font-bold text-lg
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleRaise}
        >
          RAISE {betAmount}
        </button>
      </div>
      
      {/* Bet sizing controls */}
      <div className="flex justify-center items-center space-x-2">
        <button 
          disabled={isDisabled}
          className={`bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-sm border border-gray-600 text-sm
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => currentBet > 0 && setBetAmount(Math.floor(currentBet * 1.5))}
        >
          1/2
        </button>
        <button 
          disabled={isDisabled}
          className={`bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-sm border border-gray-600 text-sm
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => currentBet > 0 && setBetAmount(Math.floor(currentBet * 1.67))}
        >
          2/3
        </button>
        <button 
          disabled={isDisabled}
          className={`bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-sm border border-gray-600 text-sm
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => currentBet > 0 && setBetAmount(currentBet * 2)}
        >
          POT
        </button>
        <button 
          disabled={isDisabled}
          className={`bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-sm border border-gray-600 text-sm
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => setBetAmount(1000)}
        >
          ALL IN
        </button>
        <button 
          disabled={isDisabled}
          className={`bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded-full border border-gray-600 text-sm
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Decrease by min bet"
          onClick={decreaseBet}
        >
          -
        </button>
        <div className={`${isDisabled ? 'bg-gray-200 text-gray-500' : 'bg-white text-black'} px-5 py-1 rounded-sm text-center min-w-[40px]`}>
          {betAmount}
        </div>
        <button 
          disabled={isDisabled}
          className={`bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded-full border border-gray-600 text-sm
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Increase by min bet"
          onClick={increaseBet}
        >
          +
        </button>
      </div>
    </div>
  );
};

// Chat Component
const Chat: React.FC<{ 
  messages: Array<{
    type: 'chat' | 'system';
    sender?: string;
    message: string;
    time: string;
  }>, 
  addMessage: React.Dispatch<React.SetStateAction<Array<{
    type: 'chat' | 'system';
    sender?: string;
    message: string;
    time: string;
  }>>>, 
  playerName: string 
}> = ({ messages, addMessage, playerName }) => {
  const [showChat, setShowChat] = useState(true);
  const [showSystem, setShowSystem] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get socket context
  const { socket, sendMessage: socketSendMessage } = useSocket();
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Listen for new messages from Socket.io
  useEffect(() => {
    if (!socket) return;
    
    // Handler for new chat messages
    const handleNewMessage = (data: { playerId: string; playerName: string; message: string; timestamp: string }) => {
      console.log('Received chat message:', data);
      const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Add to local messages
      addMessage(prev => {
        // Check for duplicate messages (can happen with socket reconnections)
        const isDuplicate = prev.some(
          msg => msg.type === 'chat' && 
                msg.sender === data.playerName && 
                msg.message === data.message
        );
        
        if (isDuplicate) return prev;
        
        return [...prev, {
          type: 'chat',
          sender: data.playerName,
          message: data.message,
          time
        }];
      });
    };
    
    // Subscribe to Socket.io events
    socket.on('newMessage', handleNewMessage);
    
    // Cleanup
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, addMessage]);
  
  // Toggle switch component for better reusability
  const ToggleSwitch: React.FC<{ 
    label: string, 
    isOn: boolean, 
    onToggle: () => void,
    activeColor?: string
  }> = ({ label, isOn, onToggle, activeColor = 'bg-blue-600' }) => (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-300">{label}</span>
      <button 
        onClick={onToggle}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isOn ? activeColor : 'bg-gray-600'}`}
      >
        <span 
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} 
        />
      </button>
    </div>
  );
  
  // Filter messages based on toggle states
  const filteredMessages = messages.filter(msg => {
    if (msg.type === 'chat' && !showChat) return false;
    if (msg.type === 'system' && !showSystem) return false;
    return true;
  });
  
  // Handle sending a chat message
  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const now = new Date();
      const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const newMessage = {
        type: 'chat' as const,
        sender: playerName,
        message: inputMessage.trim(),
        time: timeString
      };
      
      // Add message to local state
      addMessage(prev => [...prev, newMessage]);
      
      // Send message via Socket.io if connected
      if (socket && socket.connected) {
        socketSendMessage(inputMessage.trim());
      }
      
      setInputMessage('');
    }
  };
  
  // Handle pressing Enter to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="chat-container bg-gray-800 rounded-lg shadow-lg flex flex-col h-full">
      <div className="chat-header p-3 flex justify-between items-center bg-gray-900 rounded-t-lg flex-shrink-0">
        <div className="toggle-group flex space-x-4">
          <ToggleSwitch 
            label="Chat" 
            isOn={showChat} 
            onToggle={() => setShowChat(!showChat)} 
            activeColor="bg-blue-600"
          />
          <ToggleSwitch 
            label="System" 
            isOn={showSystem} 
            onToggle={() => setShowSystem(!showSystem)} 
            activeColor="bg-yellow-600"
          />
        </div>
      </div>
      
      <div className="chat-messages flex-grow p-3 overflow-y-auto space-y-2 bg-gray-800">
        {filteredMessages.length > 0 ? (
          <>
            {filteredMessages.map((msg, index) => (
              <div key={index} className={`message ${msg.type === 'system' ? 'bg-gray-700/50' : 'bg-gray-700'} p-2 rounded-lg`}>
            <div className="message-header flex justify-between text-xs">
                  <span className={`font-semibold ${msg.type === 'system' ? 'text-yellow-400' : 'text-blue-400'}`}>
                    {msg.type === 'system' ? 'System' : msg.sender}
                  </span>
                  <span className="text-gray-400">{msg.time}</span>
            </div>
                <p className={`message-content text-sm ${msg.type === 'system' ? 'text-gray-300' : 'text-white'}`}>
                  {msg.message}
                </p>
          </div>
        ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500 text-sm">No messages to display</p>
          </div>
        )}
      </div>
      
      <div className="chat-input p-2 bg-gray-700 rounded-b-lg flex-shrink-0">
        <div className="flex space-x-2">
          <input 
            type="text" 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..." 
            className="flex-grow p-2 text-sm rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!showChat}
          />
          <button 
            onClick={handleSendMessage}
            className={`${showChat ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'} text-white px-3 py-1 rounded-lg text-sm transition-colors`}
            disabled={!showChat}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

// User Hand Component (shown in bottom left corner)
const UserHand: React.FC<{ cards: Card[], folded: boolean }> = ({ cards, folded }) => {
  if (cards.length === 0) {
    return <div className="absolute bottom-0 left-8 flex space-x-3 z-20"></div>;
  }
  
  return (
    <div className={`absolute bottom-0 left-8 flex space-x-3 z-20 ${folded ? "opacity-40" : ""}`}>
      {cards.map((card, index) => (
        <LargeCard key={index} cardName={card.fileName} />
      ))}
    </div>
  );
};

// Table Component
const Table: React.FC<{ 
  onGameStateChange?: (gameState: { 
    status: string; 
    dealer: number; 
    activePlayer: number; 
    pot: number;
    smallBlind: number;
    bigBlind: number;
    userCards: Card[];
    gameId: string;
  }) => void,
  addSystemMessage?: (message: string) => void,
  playerPosition?: number,
  onFold?: (handler: () => void) => void,
  onCall?: (handler: (amount: number) => void) => void,
  onRaise?: (handler: (amount: number) => void) => void,
}> = ({ 
  onGameStateChange, 
  addSystemMessage, 
  playerPosition = 7,
  onFold,
  onCall,
  onRaise
}) => {
  const [gameState, setGameState] = useState({
    status: 'waiting', // 'waiting', 'playing'
    dealer: 0, // Dealer position (0-7)
    activePlayer: 2, // Active player (0-7)
    smallBlind: 10,
    bigBlind: 20,
    pot: 0, // Total pot
    communityCards: [] as Card[], // Community cards
    gameId: '' // Unique ID for the current game
  });
  
  // Track mounted state to prevent updates after unmount
  const isMountedRef = useRef(true);
  // Use a ref for player position to prevent circular dependencies
  const playerPositionRef = useRef(playerPosition); // Initialize with prop value
  // Refs to track state changes for preventing unnecessary updates
  const prevStateKeyRef = useRef('');
  const prevCardsStringRef = useRef('');
  const lastActivePlayerRef = useRef(-1);
  const lastStatusRef = useRef('waiting');
  const lastPotRef = useRef(0);
  // Refs to track if we've already loaded state - prevents infinite update loop
  const loadedGameRef = useRef(true); // Start with true when onGameStateChange exists
  const loadedPlayersRef = useRef(true); // Start with true when onGameStateChange exists
  
  // Fixed to prevent redundant updates causing infinite loops
  const notifyParentOfStateChange = useCallback(() => {
    // CRITICAL FIX: Prevent call during initial mount or if not mounted - this fixes the infinite loop
    if (!isMountedRef.current || !onGameStateChange) return;
    
    // Only send update if we have player data
    if (playerPositionRef.current === undefined) return;

    try {
      // Get current player data
      const playersData = localStorage.getItem('pokerPlayers');
      if (!playersData) return;
      
      const parsedPlayers = JSON.parse(playersData);
      const currentPlayer = parsedPlayers[playerPositionRef.current];
      
      if (!currentPlayer) return;
      
      // Create state to send to parent
      const stateToSend = {
        ...gameState,
        userCards: currentPlayer.hand || []
      };
      
      console.log("Notifying parent component with user cards:", stateToSend.userCards);
      
      // Use requestAnimationFrame to break potential render cycles
      requestAnimationFrame(() => {
        if (isMountedRef.current && onGameStateChange) {
          onGameStateChange(stateToSend);
        }
      });
    } catch (e) {
      console.error("Error in notifyParentOfStateChange:", e);
    }
  }, [gameState, onGameStateChange]);
  
  // Update the position ref when the prop changes
  useEffect(() => {
    playerPositionRef.current = playerPosition;
  }, [playerPosition]);
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // REMOVED PROBLEMATIC EFFECT: The useEffect that was causing the infinite loop has been deleted
  // Sample player data
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, position: 0, name: "Player 1", chips: 1000, bet: 0, isActive: false, folded: false, hand: [] as Card[] },
    { id: 2, position: 1, name: "Player 2", chips: 1000, bet: 0, isActive: false, folded: false, hand: [] as Card[] },
    { id: 3, position: 2, name: "Player 3", chips: 1000, bet: 0, isActive: false, folded: false, hand: [] as Card[] },
    { id: 4, position: 3, name: "Player 4", chips: 1000, bet: 0, isActive: false, folded: false, hand: [] as Card[] },
    { id: 5, position: 4, name: "Player 5", chips: 1000, bet: 0, isActive: false, folded: false, hand: [] as Card[] },
    { id: 6, position: 5, name: "Player 6", chips: 1000, bet: 0, isActive: false, folded: false, hand: [] as Card[] },
    { id: 7, position: 6, name: "Player 7", chips: 1000, bet: 0, isActive: false, folded: false, hand: [] as Card[] },
    { id: 8, position: 7, name: "Player 8", chips: 1000, bet: 0, isActive: false, folded: false, hand: [] as Card[] }
  ]);
  
  // Sample community cards
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  
  // Helper to find the next active player
  const findNextActivePlayer = (currentPos: number): number => {
    let nextPos = (currentPos + 1) % 8;
    // Loop until we find a player who hasn't folded
    while (players[nextPos].folded && nextPos !== currentPos) {
      nextPos = (nextPos + 1) % 8;
    }
    return nextPos;
  };
  
  // Helper to save game state to localStorage - with improved throttling
  interface SaveGameStateFunction {
    (gameState: any, players: Player[]): void;
    lastSaveTime: number;
  }

  const saveGameState: SaveGameStateFunction = (gameState: any, players: Player[]) => {
    try {
      // CRITICAL FIX: Add throttling to prevent excessive localStorage updates
      // Only allow saves every 50ms
      const now = Date.now();
      if (!saveGameState.lastSaveTime) {
        saveGameState.lastSaveTime = 0;
      }

      // Skip if we've saved too recently
      if (now - saveGameState.lastSaveTime < 50) {
        return;
      }
      
      // Update the last save time
      saveGameState.lastSaveTime = now;
      
      // IMPORTANT: Don't prevent localStorage propagation
      window._socketUpdateInProgress = false;
      
      // Make sure we have the userCards property required by the GameState interface
      const completeGameState = {
        ...gameState,
        userCards: [] // Add empty userCards to satisfy the interface
      };
      
      // Clear existing data first to ensure events trigger on every update
      localStorage.removeItem('pokerGameState');
      localStorage.removeItem('pokerPlayers');
      
      // Save with a version to force a new event
      const saveVersion = Date.now();
      localStorage.setItem('pokerGameStateVersion', saveVersion.toString());
      localStorage.setItem('pokerGameState', JSON.stringify(completeGameState));
      localStorage.setItem('pokerPlayers', JSON.stringify(players));
    } catch (e) {
      console.error("Error saving game state to localStorage:", e);
      window._socketUpdateInProgress = false;
    }
  };
  
  // Add the property to the function for throttling
  saveGameState.lastSaveTime = 0;
  
  // Helper to save system messages to localStorage
  const saveSystemMessage = (message: string) => {
    try {
      const now = new Date();
      const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Get existing messages or create new array
      const existingMessages = localStorage.getItem('pokerChatMessages');
      let messages = [];
      
      if (existingMessages) {
        messages = JSON.parse(existingMessages);
      }
      
      // Add new message
      messages.push({
        type: 'system',
        message,
        time: timeString
      });
      
      // Clear existing messages first to ensure the event triggers
      localStorage.removeItem('pokerChatMessages');
      
      // Save with a version to force a new event
      localStorage.setItem('pokerChatVersion', Date.now().toString());
      localStorage.setItem('pokerChatMessages', JSON.stringify(messages));
    } catch (e) {
      console.error("Error saving system message to localStorage:", e);
    }
  };

  // Action handling functions
  const handleFold = useCallback(() => {
    if (playerPosition === undefined || gameState.status !== 'playing') return;
    
    console.log(`Player ${playerPosition + 1} is folding`);
    
    // Update player state to mark as folded
    const updatedPlayers = [...players];
    const currentPlayer = updatedPlayers[playerPosition];
    
    // Get player's current bet before folding
    const currentBet = currentPlayer.bet;
    
    // Mark as folded
    currentPlayer.folded = true;
    
    // Move action to next player
    const nextPlayerPos = findNextActivePlayer(playerPosition);
    updatedPlayers.forEach((p, i) => {
      p.isActive = i === nextPlayerPos;
    });
    
    // Update game state with increased pot
    const newGameState = {
      ...gameState,
      activePlayer: nextPlayerPos,
      pot: gameState.pot + currentBet // Add the player's bet to the pot
    };
    
    // Clear the player's bet since it's now in the pot
    currentPlayer.bet = 0;
    
    // Update state
    setPlayers(updatedPlayers);
    setGameState(newGameState);
    
    // Save to localStorage
    saveGameState(newGameState, updatedPlayers);
    
    // Add system message
    if (addSystemMessage) {
      const message = `Player ${playerPosition + 1} folds`;
      addSystemMessage(message);
      saveSystemMessage(message);
    }
  }, [playerPosition, gameState, players, addSystemMessage, findNextActivePlayer, saveGameState, saveSystemMessage]);
  
  const handleCall = useCallback((amount: number) => {
    if (playerPosition === undefined || gameState.status !== 'playing') return;
    
    console.log(`Player ${playerPosition + 1} is calling/checking ${amount}`);
    
    // Get current highest bet
    const highestBet = Math.max(...players.map(p => p.bet));
    const callAmount = highestBet - players[playerPosition].bet;
    
    // Update player state
    const updatedPlayers = [...players];
    const currentPlayer = updatedPlayers[playerPosition];
    
    // If no bet to call, this is a check
    const isCheck = callAmount === 0;
    
    if (!isCheck) {
      // Adjust chips and bet for call
      currentPlayer.chips -= callAmount;
      currentPlayer.bet = highestBet;
    }
    
    // Move action to next player
    const nextPlayerPos = findNextActivePlayer(playerPosition);
    updatedPlayers.forEach((p, i) => {
      p.isActive = i === nextPlayerPos;
    });
    
    // Update pot
    const newPot = gameState.pot + (isCheck ? 0 : callAmount);
    
    // Update game state
    const newGameState = {
      ...gameState,
      activePlayer: nextPlayerPos,
      pot: newPot
    };
    
    // Update state
    setPlayers(updatedPlayers);
    setGameState(newGameState);
    
    // Save to localStorage
    saveGameState(newGameState, updatedPlayers);
    
    // Add system message
    if (addSystemMessage) {
      const message = isCheck 
        ? `Player ${playerPosition + 1} checks` 
        : `Player ${playerPosition + 1} calls $${callAmount}`;
      addSystemMessage(message);
      saveSystemMessage(message);
    }
  }, [playerPosition, gameState, players, addSystemMessage, findNextActivePlayer, saveGameState, saveSystemMessage]);
  
  const handleRaise = useCallback((amount: number) => {
    if (playerPosition === undefined || gameState.status !== 'playing') return;
    
    console.log(`Player ${playerPosition + 1} is raising to ${amount}`);
    
    // Get current highest bet
    const highestBet = Math.max(...players.map(p => p.bet));
    const raiseAmount = amount - players[playerPosition].bet;
    
    // Update player state
    const updatedPlayers = [...players];
    const currentPlayer = updatedPlayers[playerPosition];
    
    // Adjust chips and bet for raise
    currentPlayer.chips -= raiseAmount;
    currentPlayer.bet = amount;
    
    // Move action to next player
    const nextPlayerPos = findNextActivePlayer(playerPosition);
    updatedPlayers.forEach((p, i) => {
      p.isActive = i === nextPlayerPos;
    });
    
    // Update pot
    const newPot = gameState.pot + raiseAmount;
    
    // Update game state
    const newGameState = {
      ...gameState,
      activePlayer: nextPlayerPos,
      pot: newPot
    };
    
    // Update state
    setPlayers(updatedPlayers);
    setGameState(newGameState);
    
    // Save to localStorage
    saveGameState(newGameState, updatedPlayers);
    
    // Add system message
    if (addSystemMessage) {
      const message = `Player ${playerPosition + 1} raises to $${amount}`;
      addSystemMessage(message);
      saveSystemMessage(message);
    }
  }, [playerPosition, gameState, players, addSystemMessage, findNextActivePlayer, saveGameState, saveSystemMessage]);

  // Register handlers with parent component
  useEffect(() => {
    // Only register handlers if the game is active and it's the player's turn
    if (gameState.status === 'playing' && playerPosition !== undefined) {
      if (onFold) onFold(() => {
        console.log("Fold handler called");
        handleFold();
      });
      if (onCall) onCall((amount: number) => {
        console.log("Call handler called with amount:", amount);
        handleCall(amount);
      });
      if (onRaise) onRaise((amount: number) => {
        console.log("Raise handler called with amount:", amount);
        handleRaise(amount);
      });
    }
  }, [gameState.status, playerPosition, handleFold, handleCall, handleRaise, onFold, onCall, onRaise]);
  
  // Check for game state in localStorage on component mount
  useEffect(() => {
    // CRITICAL FIX: Add a ref to track if we've set up the listener already
    // This breaks the infinite loop by ensuring we don't add duplicate listeners
    if (window._pokerHandlerAttached) {
      console.log("Storage handler already attached, skipping duplicate setup");
      return;
    }
    window._pokerHandlerAttached = true;
    
    console.log("Setting up localStorage event handling");
    
    // Try to load game state from localStorage (ONLY ONCE on mount)
    try {
      const savedGameState = localStorage.getItem('pokerGameState');
      if (savedGameState) {
        const parsedState = JSON.parse(savedGameState);
        console.log("Found saved game state:", parsedState);
        
        // Mark as loaded first to prevent loops
        loadedGameRef.current = true;
        
        // Only update if the game is in progress
        if (parsedState.status === 'playing') {
          // CRITICAL FIX: Use a single-shot timeout to break render cycles
          setTimeout(() => {
            if (!isMountedRef.current) return;
            
            setGameState(parsedState);
            
            // Also load players state if available
            const savedPlayers = localStorage.getItem('pokerPlayers');
            if (savedPlayers) {
              try {
                loadedPlayersRef.current = true; // Mark as loaded first
                const parsedPlayers = JSON.parse(savedPlayers);
                setPlayers(parsedPlayers);
                console.log("Loaded saved player data");
                
                // If we have a system message callback, send a connection message
                if (addSystemMessage) {
                  addSystemMessage(`Connected to game ID: ${parsedState.gameId}`);
                }
                
                // Update community cards if available
                if (parsedState.communityCards && parsedState.communityCards.length > 0) {
                  setCommunityCards(parsedState.communityCards);
                }
              } catch (playerError) {
                console.error("Error parsing saved players:", playerError);
              }
            }
          }, 100);
        }
      }
    } catch (e) {
      console.error("Error parsing saved game state:", e);
    }
    
    // Set up window storage event listener to catch changes from other windows
    const handleStorageChange = (e: StorageEvent) => {
      // Skip if we're unmounted
      if (!isMountedRef.current) return;
      
      console.log(`Storage event detected: ${e.key}`);
      
      // Skip if it's not a key we care about or there's no new value
      if (!e.key || !e.newValue) {
        return;
      }
      
      // Check for version changes - these trigger us to load the actual data
      if (e.key === 'pokerGameStateVersion') {
        console.log("Game state version change detected, reloading data");
        
        // Reload the actual game state
        try {
          const savedGameState = localStorage.getItem('pokerGameState');
          const savedPlayers = localStorage.getItem('pokerPlayers');
          
          if (savedGameState && savedPlayers) {
            const parsedState = JSON.parse(savedGameState);
            const parsedPlayers = JSON.parse(savedPlayers);
            
            console.log("New game detected! Loading game state:", parsedState.status, "GameID:", parsedState.gameId);
            
            // Update local state immediately with a single render
            requestAnimationFrame(() => {
              if (!isMountedRef.current) return;
              
              // If we're not in the middle of another update
              setTimeout(() => {
                if (isMountedRef.current) {
                  // Set players first
                  setPlayers(parsedPlayers);
                  
                  // Then update game state
                  setGameState(parsedState);
                  
                  // Update community cards if they exist
                  if (parsedState.communityCards && Array.isArray(parsedState.communityCards)) {
                    setCommunityCards(parsedState.communityCards);
                  } else {
                    setCommunityCards([]);
                  }
                  
                  // Notify parent with this player's cards
                  if (playerPositionRef.current !== undefined && onGameStateChange) {
                    const userCards = parsedPlayers[playerPositionRef.current]?.hand || [];
                    
                    console.log(`Sharing player ${playerPositionRef.current + 1}'s cards with parent:`, userCards);
                    
                    // Let the parent know about our cards
                    setTimeout(() => {
                      if (isMountedRef.current && onGameStateChange) {
                        onGameStateChange({
                          ...parsedState,
                          userCards
                        });
                      }
                    }, 100);
                  }
                }
              }, 100);
            });
          }
        } catch (err) {
          console.error("Error loading game state during version change:", err);
        }
        return;
      }
      
      // Check for chat version changes - reload chat messages
      if (e.key === 'pokerChatVersion' && addSystemMessage) {
        console.log("Chat version change detected, reloading messages");
        
        try {
          const savedChatMessages = localStorage.getItem('pokerChatMessages');
          if (savedChatMessages) {
            const parsedMessages = JSON.parse(savedChatMessages);
            console.log("Loading new chat messages, count:", parsedMessages.length);
            
            // Get the most recent system message
            const systemMessages = parsedMessages.filter((msg: any) => msg.type === 'system');
            if (systemMessages.length > 0) {
              const latestMessage = systemMessages[systemMessages.length - 1];
              
              // Use requestAnimationFrame to ensure we don't conflict with other updates
              requestAnimationFrame(() => {
                if (isMountedRef.current && addSystemMessage) {
                  addSystemMessage(latestMessage.message);
                }
              });
            }
          }
        } catch (err) {
          console.error("Error loading chat messages during version change:", err);
        }
        return;
      }
      
      // Handle direct updates to game state (less reliable but keep as fallback)
      if (e.key === 'pokerGameState' && e.newValue) {
        try {
          const parsedState = JSON.parse(e.newValue);
          console.log("Direct game state update received:", parsedState.status);
          
          // Use requestAnimationFrame for optimal timing
          requestAnimationFrame(() => {
            if (isMountedRef.current) {
              setGameState(parsedState);
            }
          });
        } catch (e) {
          console.error("Error parsing game state update:", e);
        }
      }
      
      // Handle direct updates to player data (less reliable but keep as fallback)
      if (e.key === 'pokerPlayers' && e.newValue) {
        try {
          const parsedPlayers = JSON.parse(e.newValue);
          console.log("Direct player data update received");
          
          requestAnimationFrame(() => {
            if (isMountedRef.current) {
              setPlayers(parsedPlayers);
            }
          });
        } catch (e) {
          console.error("Error parsing player data update:", e);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    console.log("Added storage event listener");
    
    // Also check for existing chat messages (ONLY ONCE on mount)
    try {
      const savedChatMessages = localStorage.getItem('pokerChatMessages');
      if (savedChatMessages && addSystemMessage) {
        const parsedMessages = JSON.parse(savedChatMessages);
        console.log("Found saved chat messages:", parsedMessages);
        
        // Only send a summary message, not all messages
        setTimeout(() => {
          if (isMountedRef.current && addSystemMessage) {
            const count = parsedMessages.filter((msg: any) => msg.type === 'system').length;
            if (count > 0) {
              addSystemMessage(`Connected to game. Found ${count} previous messages.`);
              
              // Also show the most recent system message
              const systemMessages = parsedMessages.filter((msg: any) => msg.type === 'system');
              if (systemMessages.length > 0) {
                const latestMessage = systemMessages[systemMessages.length - 1];
                addSystemMessage(`Latest update: ${latestMessage.message}`);
              }
            }
          }
        }, 100);
      }
    } catch (e) {
      console.error("Error parsing saved chat messages:", e);
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      console.log("Removed storage event listener");
    };
  }, []); // Empty dependency array - only run once on mount
  
  // Start game function
  const handleStartGame = () => {
    console.log("Start game clicked! Player position:", playerPosition);
    
    // 1. Generate a unique game ID
    const gameId = `game_${Date.now()}`;
    console.log("Generated game ID:", gameId);
    
    // 2. Assign dealer button randomly
    const randomDealerPosition = Math.floor(Math.random() * 8);
    console.log("Dealer position:", randomDealerPosition + 1);
    
    // 3. Calculate positions for small blind and big blind
    const smallBlindPos = (randomDealerPosition + 1) % 8;
    const bigBlindPos = (randomDealerPosition + 2) % 8;
    const firstToActPos = (randomDealerPosition + 3) % 8;
    console.log("Small blind: Player", smallBlindPos + 1);
    console.log("Big blind: Player", bigBlindPos + 1);
    console.log("First to act: Player", firstToActPos + 1);
    
    // 4. Post blinds (update player bets and chips)
    const updatedPlayers = [...players];
    
    // Post small blind
    updatedPlayers[smallBlindPos].bet = gameState.smallBlind;
    updatedPlayers[smallBlindPos].chips -= gameState.smallBlind;
    
    // Post big blind
    updatedPlayers[bigBlindPos].bet = gameState.bigBlind;
    updatedPlayers[bigBlindPos].chips -= gameState.bigBlind;
    
    // 5. Deal cards (simulate card dealing)
    const deck = generateDeck();
    shuffleDeck(deck);
    console.log("Deck shuffled");
    
    // Deal 2 cards to each player
    updatedPlayers.forEach((player, index) => {
      // Create a typed array for the hand
      player.hand = [deck.pop()!, deck.pop()!] as Card[];
      player.isActive = index === firstToActPos; // 6. Assign active player
      player.folded = false; // Reset folded state
    });
    console.log("Cards dealt to all players");
    
    // 7. Create new game state
    const newGameState = {
      ...gameState,
      status: 'playing',
      dealer: randomDealerPosition,
      activePlayer: firstToActPos,
      pot: gameState.smallBlind + gameState.bigBlind,
      communityCards: [], // Explicitly set empty community cards
      gameId
    };
    
    // 8. Update local state
    setPlayers(updatedPlayers);
    setGameState(newGameState);
    setCommunityCards([]); // Explicitly clear community cards
    console.log("Local state updated");
    
    // 9. Notify parent of the state change with the current player's cards
    if (playerPosition !== undefined && onGameStateChange) {
      const userCards = updatedPlayers[playerPosition].hand || [];
      
      console.log(`Sending player ${playerPosition + 1}'s cards to parent:`, userCards);
      
      // Call parent's callback with user's cards
      onGameStateChange({
        ...newGameState,
        userCards
      });
    }
    
    // 10. Generate system messages
    const systemMessages = [
      `Game started (ID: ${gameId})`,
      `Player ${randomDealerPosition + 1} is the dealer`,
      `Player ${smallBlindPos + 1} posts small blind: $${gameState.smallBlind}`,
      `Player ${bigBlindPos + 1} posts big blind: $${gameState.bigBlind}`,
      `Player ${firstToActPos + 1} to act`
    ];
    
    // Add messages locally if callback is available
    if (addSystemMessage) {
      systemMessages.forEach(msg => addSystemMessage(msg));
    }
    
    // 11. Share game state with other browsers via localStorage
    try {
      // Clear previous data
      localStorage.removeItem('pokerGameState');
      localStorage.removeItem('pokerPlayers');
      localStorage.removeItem('pokerChatMessages');
      localStorage.removeItem('pokerGameStateVersion');
      localStorage.removeItem('pokerChatVersion');
      
      // Use a small delay to ensure removal events complete
      setTimeout(() => {
        try {
          // Save chat messages first
          const now = new Date();
          const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          const chatMessages = systemMessages.map(message => ({
            type: 'system',
            message,
            time: timeString
          }));
          
          // Set unique version ID for chat
          const chatVersion = Date.now();
          console.log("Setting chat version:", chatVersion);
          localStorage.setItem('pokerChatVersion', chatVersion.toString());
          localStorage.setItem('pokerChatMessages', JSON.stringify(chatMessages));
          
          // Use another delay before saving game state
          setTimeout(() => {
            try {
              // Generate a unique version for the game state
              const gameVersion = Date.now();
              console.log("Setting game state version:", gameVersion);
              
              // Save game state without any player-specific data
              localStorage.setItem('pokerGameStateVersion', gameVersion.toString());
              localStorage.setItem('pokerGameState', JSON.stringify(newGameState));
              localStorage.setItem('pokerPlayers', JSON.stringify(updatedPlayers));
              
              console.log("Game state successfully saved for other browsers");
            } catch (err) {
              console.error("Error saving game state:", err);
            }
          }, 100);
        } catch (err) {
          console.error("Error saving chat messages:", err);
        }
      }, 100);
    } catch (err) {
      console.error("Error clearing localStorage:", err);
    }
  };
  
  // Helper function to generate a deck
  const generateDeck = (): Card[] => {
    const suits = ['H', 'D', 'C', 'S'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];
    
    for (const suit of suits) {
      for (const value of values) {
        deck.push({
          value,
          suit,
          fileName: value + suit
        });
      }
    }
    
    return deck;
  };
  
  // Helper function to shuffle deck
  const shuffleDeck = (deck: Card[]): Card[] => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };

  return (
    <div className="table-container relative w-full max-w-7xl mx-auto">
      <div 
        className="table p-10 border-[3px] border-[#f0aa22] rounded-[8rem] shadow-xl mx-auto h-[420px] w-[90%] relative overflow-hidden"
        style={{
          background: 'radial-gradient(circle, #1fb3a7 0%, #18938a 40%, #0e635d 100%)'
        }}
      >
        {/* Orange border glow effect */}
        <div className="absolute -inset-1 bg-[#f0aa22]/10 rounded-[8rem] blur-sm"></div>
        
        {/* Start Game button in the center of the table - only show if game is waiting */}
        {gameState.status === 'waiting' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
            <button 
              onClick={handleStartGame}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md font-bold text-xl transition-colors shadow-lg"
            >
              Start Game
            </button>
          </div>
        )}
        
        {/* Total Pot display */}
        <div className="absolute top-1/2 left-[25%] transform -translate-y-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center">
            <div className="text-white text-xs font-bold uppercase tracking-wider mb-1">
              TOTAL POT
            </div>
            <div className="pot-display flex items-center">
              <div className="pot-amount bg-gray-800/95 px-3 py-1.5 rounded-full shadow-md mr-2">
                <span className="text-yellow-400 font-bold text-lg">${gameState.pot}</span>
              </div>
              {gameState.pot > 0 && (
              <div className="w-7 h-7">
                <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="128" cy="128" r="120" fill="#1A1A1A" />
                  <path
                    d="M199.03711,198.30981a99.82288,99.82288,0,0,0,0-140.61962A3.982,3.982,0,0,0,198.71,57.29a3.90416,3.90416,0,0,0-.40088-.32776,99.8226,99.8226,0,0,0-140.61816,0A3.90416,3.90416,0,0,0,57.29,57.29a3.982,3.982,0,0,0-.32715.40015,99.82288,99.82288,0,0,0,0,140.61962A3.982,3.982,0,0,0,57.29,198.71a3.93475,3.93475,0,0,0,.40088.32764,99.82231,99.82231,0,0,0,140.61816,0A3.93475,3.93475,0,0,0,198.71,198.71,3.982,3.982,0,0,0,199.03711,198.30981ZM36.09229,132H68.14844a59.72942,59.72942,0,0,0,14.72217,35.47327L60.2124,190.13135A91.64821,91.64821,0,0,1,36.09229,132ZM60.2124,65.86865,82.87061,88.52673A59.72942,59.72942,0,0,0,68.14844,124H36.09229A91.64821,91.64821,0,0,1,60.2124,65.86865ZM219.90771,124H187.85156a59.72942,59.72942,0,0,0-14.72217-35.47327L195.7876,65.86865A91.64821,91.64821,0,0,1,219.90771,124ZM128,180a52,52,0,1,1,52-52A52.059,52.059,0,0,1,128,180Zm39.47314-97.12952A59.73257,59.73257,0,0,0,132,68.14819V36.09229A91.64757,91.64757,0,0,1,190.13135,60.2124ZM124,68.14819A59.73257,59.73257,0,0,0,88.52686,82.87048L65.86865,60.2124A91.64757,91.64757,0,0,1,124,36.09229ZM88.52686,173.12952A59.73257,59.73257,0,0,0,124,187.85181v32.0559A91.64757,91.64757,0,0,1,65.86865,195.7876ZM132,187.85181a59.73257,59.73257,0,0,0,35.47314-14.72229l22.65821,22.65808A91.64757,91.64757,0,0,1,132,219.90771Zm41.12939-20.37854A59.72942,59.72942,0,0,0,187.85156,132h32.05615a91.64821,91.64821,0,0,1-24.12011,58.13135Z"
                    fill="white"
                    stroke="none"
                  />
                  <circle cx="128" cy="128" r="52" fill="#1A1A1A" stroke="white" strokeWidth="2" />
                </svg>
              </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Center Community Cards */}
        <div className="community-cards absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="cards flex gap-2 justify-center">
            {communityCards.map((card, index) => (
              <Image 
                key={index}
                src={`/cards/${card.fileName}.png`} 
                alt="Card" 
                width={72} 
                height={108} 
                className="object-contain" 
              />
            ))}
          </div>
        </div>
        
        {/* Players positioned around the table */}
        <div className="players-layout absolute inset-0">
          {/* Player 1 (left) */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/3">
            <Player 
              name="Player 1" 
              position={1}
              chips={players[0].chips}
              isActive={players[0].isActive}
              cards={gameState.status === 'playing' ? players[0].hand : []}
              dealer={gameState.status === 'playing' && gameState.dealer === 0}
              isCurrentPlayer={playerPosition === 0}
              folded={players[0].folded}
            />
            {players[0].bet > 0 && !players[0].folded && (
              <div className="absolute -right-12 top-1/2 transform -translate-y-1/2">
                <PokerChip amount={players[0].bet} playerNumber={1} />
              </div>
            )}
          </div>
          
          {/* Player 2 (top left) */}
          <div className="absolute top-0 left-1/4 transform -translate-y-1/2 -translate-x-1/4">
            <Player 
              name="Player 2" 
              position={2}
              chips={players[1].chips}
              isActive={players[1].isActive}
              cards={gameState.status === 'playing' ? players[1].hand : []}
              dealer={gameState.status === 'playing' && gameState.dealer === 1}
              isCurrentPlayer={playerPosition === 1}
              folded={players[1].folded}
            />
            {players[1].bet > 0 && !players[1].folded && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8">
                <PokerChip amount={players[1].bet} playerNumber={2} />
              </div>
            )}
          </div>
          
          {/* Player 3 (top center) */}
          <div className="absolute top-0 left-1/2 transform -translate-y-1/2 -translate-x-1/2">
            <Player 
              name="Player 3" 
              position={3}
              chips={players[2].chips}
              isActive={players[2].isActive}
              cards={gameState.status === 'playing' ? players[2].hand : []}
              dealer={gameState.status === 'playing' && gameState.dealer === 2}
              isCurrentPlayer={playerPosition === 2}
              folded={players[2].folded}
            />
            {players[2].bet > 0 && !players[2].folded && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8">
                <PokerChip amount={players[2].bet} playerNumber={3} />
              </div>
            )}
          </div>
          
          {/* Player 4 (top right) */}
          <div className="absolute top-0 right-1/4 transform -translate-y-1/2 translate-x-1/4">
            <Player 
              name="Player 4" 
              position={4}
              chips={players[3].chips}
              isActive={players[3].isActive}
              cards={gameState.status === 'playing' ? players[3].hand : []}
              dealer={gameState.status === 'playing' && gameState.dealer === 3}
              isCurrentPlayer={playerPosition === 3}
              folded={players[3].folded}
            />
            {players[3].bet > 0 && !players[3].folded && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8">
                <PokerChip amount={players[3].bet} playerNumber={4} />
              </div>
            )}
          </div>
          
          {/* Player 5 (right) */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/3">
            <Player 
              name="Player 5" 
              position={5}
              chips={players[4].chips}
              isActive={players[4].isActive}
              cards={gameState.status === 'playing' ? players[4].hand : []}
              dealer={gameState.status === 'playing' && gameState.dealer === 4}
              isCurrentPlayer={playerPosition === 4}
              folded={players[4].folded}
            />
            {players[4].bet > 0 && !players[4].folded && (
              <div className="absolute -left-12 top-1/2 transform -translate-y-1/2">
                <PokerChip amount={players[4].bet} playerNumber={5} />
              </div>
            )}
          </div>
          
          {/* Player 6 (bottom right) */}
          <div className="absolute bottom-0 right-1/4 transform translate-y-1/2 translate-x-1/4">
            <Player 
              name="Player 6" 
              position={6}
              chips={players[5].chips}
              isActive={players[5].isActive}
              cards={gameState.status === 'playing' ? players[5].hand : []}
              dealer={gameState.status === 'playing' && gameState.dealer === 5}
              isCurrentPlayer={playerPosition === 5}
              folded={players[5].folded}
            />
            {players[5].bet > 0 && !players[5].folded && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8">
                <PokerChip amount={players[5].bet} playerNumber={6} />
              </div>
            )}
          </div>
          
          {/* Player 7 (bottom center) */}
          <div className="absolute bottom-0 left-1/2 transform translate-y-1/2 -translate-x-1/2">
            <Player 
              name="Player 7" 
              position={7}
              chips={players[6].chips}
              isActive={players[6].isActive}
              cards={gameState.status === 'playing' ? players[6].hand : []}
              dealer={gameState.status === 'playing' && gameState.dealer === 6}
              isCurrentPlayer={playerPosition === 6}
              folded={players[6].folded}
            />
            {players[6].bet > 0 && !players[6].folded && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8">
                <PokerChip amount={players[6].bet} playerNumber={7} />
              </div>
            )}
          </div>
          
          {/* Player 8 (bottom left) - Current user */}
          <div className="absolute bottom-0 left-1/4 transform translate-y-1/2 -translate-x-1/4">
            <Player 
              name="Player 8" 
              position={8}
              chips={players[7].chips}
              isActive={players[7].isActive}
              cards={gameState.status === 'playing' ? players[7].hand : []}
              dealer={gameState.status === 'playing' && gameState.dealer === 7}
              isCurrentPlayer={playerPosition === 7}
              folded={players[7].folded}
            />
            {players[7].bet > 0 && !players[7].folded && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8">
                <PokerChip amount={players[7].bet} playerNumber={8} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
  
  // State to hold the game status from the Table component
  const [gameState, setGameState] = useState({
    status: 'waiting',
    dealer: 0,
    activePlayer: -1,
    pot: 0,
    smallBlind: 10,
    bigBlind: 20,
    userCards: [] as Card[],
    gameId: ''
  });
  
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
  const { socket, isConnected, joinTable } = useSocket();

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
            const userCards = parsedPlayers[playerPosition].hand;
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
        const highestBet = Math.max(...parsedPlayers.map((p: Player) => p.bet));
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
            <Table 
              onGameStateChange={handleGameStateChange} 
              addSystemMessage={addSystemMessage}
              playerPosition={playerPosition}
              onFold={setFoldHandler}
              onCall={setCallHandler}
              onRaise={setRaiseHandler}
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
            cards={gameState.userCards} 
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
