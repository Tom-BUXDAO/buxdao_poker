'use client';

import Image from "next/image";
import React, { useState, useEffect, useCallback } from "react";

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
}> = ({ name, position, chips, isActive = false, cards = [], dealer = false }) => {
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

  // Check if this is a bottom seat (positions 6, 7, 8)
  const isBottomSeat = position === 6 || position === 7 || position === 8;

  return (
    <div className="player-wrapper flex flex-col items-center relative">
      {/* Player name and chips - show above avatar for non-bottom seats */}
      {!isBottomSeat && (
        <div className="player-name-chip text-white text-base font-bold bg-gray-800 px-3 py-1 rounded-md flex items-center mb-2">
          <span>{name}</span>
          <span className="mx-1 text-gray-400">|</span>
          <span className="text-yellow-400">{chips}</span>
        </div>
      )}
      
      {/* Cards for bottom positions - show above avatar */}
      {isBottomSeat && cards.length > 0 && (
        <div className="flex space-x-2 mb-2">
          {cards.map((card, idx) => (
            <div key={idx}>
              {position === 8 ? 
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
      <div className={`player-avatar rounded-full h-20 w-20 overflow-hidden ${activeClass} border-[3px] border-white shadow-lg`}>
        <Image
          src={playerImages[position as keyof typeof playerImages]} 
          alt={name} 
          width={80} 
          height={80}
          className="object-cover"
        />
      </div>
      
      {/* Cards for non-bottom positions - show below avatar */}
      {!isBottomSeat && cards.length > 0 && (
        <div className="flex space-x-2 mt-2">
          {cards.map((card, idx) => (
            <div key={idx}>
              <FaceDownCard />
            </div>
          ))}
        </div>
      )}
      
      {/* Player name and chips - show below avatar for bottom seats */}
      {isBottomSeat && (
        <div className="player-name-chip text-white text-base font-bold bg-gray-800 px-3 py-1 rounded-md flex items-center mt-2">
          <span>{name}</span>
          <span className="mx-1 text-gray-400">|</span>
          <span className="text-yellow-400">{chips}</span>
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
}> = ({ isGameActive, isPlayerTurn, currentBet, bigBlind }) => {
  // Set bet amounts based on blinds
  const minBet = bigBlind;
  const [betAmount, setBetAmount] = useState(currentBet * 2); // Min raise is current bet + min bet
  
  // Helper to increase bet in increments of minBet
  const increaseBet = () => {
    setBetAmount(prev => prev + minBet);
  };
  
  // Helper to decrease bet in increments of minBet, but not below minimum
  const decreaseBet = () => {
    if (betAmount - minBet >= currentBet * 2) {
      setBetAmount(prev => prev - minBet);
    }
  };
  
  // Update bet amount when current bet changes
  useEffect(() => {
    setBetAmount(currentBet * 2);
  }, [currentBet]);

  // Determine if buttons should be disabled
  const isDisabled = !isGameActive || !isPlayerTurn;
  
  return (
    <div className="action-buttons">
      {/* Main action buttons */}
      <div className="flex justify-center space-x-3 mb-2">
        <button 
          disabled={isDisabled}
          className={`bg-red-600 hover:bg-red-700 text-white px-12 py-2 rounded-md font-bold text-lg
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => console.log('Fold')}
        >
          FOLD
        </button>
        <button 
          disabled={isDisabled}
          className={`bg-blue-600 hover:bg-blue-700 text-white px-12 py-2 rounded-md font-bold text-lg
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => console.log('Call', currentBet)}
        >
          {currentBet > 0 ? `CALL ${currentBet}` : 'CHECK'}
        </button>
        <button 
          disabled={isDisabled}
          className={`bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-md font-bold text-lg
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => console.log('Raise', betAmount)}
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
          onClick={() => setBetAmount(Math.floor(currentBet * 1.5))}
        >
          1/2
        </button>
        <button 
          disabled={isDisabled}
          className={`bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-sm border border-gray-600 text-sm
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => setBetAmount(Math.floor(currentBet * 1.67))}
        >
          2/3
        </button>
        <button 
          disabled={isDisabled}
          className={`bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-sm border border-gray-600 text-sm
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => setBetAmount(currentBet * 2)}
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
const Chat: React.FC = () => {
  const [showChat, setShowChat] = useState(true);
  const [showSystem, setShowSystem] = useState(true);
  
  const dummyMessages = [
    { type: 'chat', sender: 'Player 1', message: 'Good luck everyone!', time: '10:22' },
    { type: 'system', message: 'Game starting...', time: '10:20' },
    { type: 'chat', sender: 'Player 3', message: 'Thanks, you too!', time: '10:23' },
    { type: 'system', message: 'Player 1 joined the table', time: '10:21' },
    { type: 'chat', sender: 'Player 2', message: 'Nice hand there.', time: '10:25' },
    { type: 'system', message: 'Player 3 is the dealer', time: '10:22' },
    { type: 'chat', sender: 'Player 4', message: 'I should have folded.', time: '10:27' },
    { type: 'system', message: 'Player 4 calls 20', time: '10:24' },
    { type: 'chat', sender: 'Player 6', message: 'All in next time!', time: '10:28' },
    { type: 'system', message: 'Player 2 raises to 40', time: '10:26' },
  ].sort((a, b) => {
    const timeA = parseInt(a.time.replace(':', ''));
    const timeB = parseInt(b.time.replace(':', ''));
    return timeA - timeB;
  });
  
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
  const filteredMessages = dummyMessages.filter(msg => {
    if (msg.type === 'chat' && !showChat) return false;
    if (msg.type === 'system' && !showSystem) return false;
    return true;
  });
  
  return (
    <div className="chat-container bg-gray-800 rounded-lg shadow-lg h-full flex flex-col">
      <div className="chat-header p-3 flex justify-between items-center bg-gray-900 rounded-t-lg">
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
          filteredMessages.map((msg, index) => (
            <div key={index} className={`message ${msg.type === 'system' ? 'bg-gray-700/50' : 'bg-gray-700'} p-2 rounded-lg`}>
              <div className="message-header flex justify-between text-xs">
                <span className={`font-semibold ${msg.type === 'system' ? 'text-yellow-400' : 'text-blue-400'}`}>
                  {msg.type === 'system' ? 'System' : msg.sender}
                </span>
                <span className="text-gray-400">{msg.time}</span>
              </div>
              <p className={`message-content text-sm ${msg.type === 'system' ? 'text-gray-300' : 'text-white'}`}>
                {msg.type === 'system' ? msg.message : msg.message}
              </p>
            </div>
          ))
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500 text-sm">No messages to display</p>
          </div>
        )}
      </div>
      
      <div className="chat-input p-2 bg-gray-700 rounded-b-lg mt-auto">
        <div className="flex space-x-2">
          <input 
            type="text" 
            placeholder="Type your message..." 
            className="flex-grow p-2 text-sm rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!showChat}
          />
          <button 
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
const UserHand: React.FC<{ cards: Card[] }> = ({ cards }) => {
  if (cards.length === 0) {
    return <div className="absolute bottom-0 left-8 flex space-x-3 z-20"></div>;
  }
  
  return (
    <div className="absolute bottom-0 left-8 flex space-x-3 z-20">
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
  }) => void 
}> = ({ onGameStateChange }) => {
  const [gameState, setGameState] = useState({
    status: 'waiting', // 'waiting', 'playing'
    dealer: 0, // Dealer position (0-7)
    activePlayer: 2, // Active player (0-7)
    smallBlind: 10,
    bigBlind: 20,
    pot: 0,
    userCards: [] as Card[]
  });
  
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
  
  // Fixed useEffect to prevent infinite loops
  useEffect(() => {
    // Only notify the parent when we have a callback
    if (onGameStateChange) {
      // Create a stable reference to the current data to pass
      const stateToSend = {
        ...gameState,
        userCards: players[7]?.hand || [] // Pass Player 8's cards
      };
      
      onGameStateChange(stateToSend);
    }
  }, [
    // Only dependencies that matter for this update
    gameState.status, 
    gameState.dealer, 
    gameState.activePlayer, 
    gameState.pot,
    gameState.smallBlind,
    gameState.bigBlind,
    players[7]?.hand,
    onGameStateChange
  ]);
  
  // Start game function
  const handleStartGame = () => {
    // 1. Assign dealer button randomly
    const randomDealerPosition = Math.floor(Math.random() * 8);
    
    // Calculate positions for small blind and big blind
    const smallBlindPos = (randomDealerPosition + 1) % 8;
    const bigBlindPos = (randomDealerPosition + 2) % 8;
    const firstToActPos = (randomDealerPosition + 3) % 8;
    
    // 2. Post blinds (update player bets and chips)
    const updatedPlayers = [...players];
    
    // Post small blind
    updatedPlayers[smallBlindPos].bet = gameState.smallBlind;
    updatedPlayers[smallBlindPos].chips -= gameState.smallBlind;
    
    // Post big blind
    updatedPlayers[bigBlindPos].bet = gameState.bigBlind;
    updatedPlayers[bigBlindPos].chips -= gameState.bigBlind;
    
    // 3. Deal cards (simulate card dealing)
    const deck = generateDeck();
    shuffleDeck(deck);
    
    // Deal 2 cards to each player
    updatedPlayers.forEach((player, index) => {
      // Create a typed array for the hand
      player.hand = [deck.pop()!, deck.pop()!] as Card[];
      player.isActive = index === firstToActPos; // 4. Assign active player
    });
    
    // Update game state
    setPlayers(updatedPlayers);
    setGameState({
      ...gameState,
      status: 'playing',
      dealer: randomDealerPosition,
      activePlayer: firstToActPos,
      pot: gameState.smallBlind + gameState.bigBlind
    });
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
            />
            {players[0].bet > 0 && (
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
            />
            {players[1].bet > 0 && (
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
            />
            {players[2].bet > 0 && (
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
            />
            {players[3].bet > 0 && (
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
            />
            {players[4].bet > 0 && (
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
            />
            {players[5].bet > 0 && (
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
            />
            {players[6].bet > 0 && (
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
            />
            {players[7].bet > 0 && (
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
  // State to hold the game status from the Table component
  const [gameState, setGameState] = useState({
    status: 'waiting',
    dealer: 0,
    activePlayer: -1,
    pot: 0,
    smallBlind: 10,
    bigBlind: 20,
    userCards: [] as Card[]
  });
  
  // Determine if it's the user's turn (Player 8, position 7)
  const isUserTurn = gameState.status === 'playing' && gameState.activePlayer === 7;
  
  // Memoize the callback to prevent it from changing on every render
  // This is crucial to prevent infinite loops
  const handleGameStateChange = useCallback((newState: typeof gameState) => {
    // Only update state if something actually changed
    // This comparison helps prevent unnecessary re-renders
    if (
      newState.status !== gameState.status ||
      newState.dealer !== gameState.dealer ||
      newState.activePlayer !== gameState.activePlayer ||
      newState.pot !== gameState.pot ||
      newState.userCards !== gameState.userCards ||
      // For arrays, check if length changed as a simple heuristic
      (Array.isArray(newState.userCards) && 
       Array.isArray(gameState.userCards) && 
       newState.userCards.length !== gameState.userCards.length)
    ) {
      setGameState(newState);
    }
  }, [
    gameState.status,
    gameState.dealer,
    gameState.activePlayer,
    gameState.pot,
    gameState.userCards
  ]);

  return (
    <main className="min-h-screen p-4 bg-gray-900 flex flex-col h-screen">
      <GameStatusHeader />
      <div className="flex flex-col lg:flex-row gap-4 flex-grow relative">
        <div className="poker-table-container lg:w-3/4 flex flex-col justify-between relative">
          <div className="flex-shrink-0 h-10"></div>
          <div className="flex-grow flex items-center justify-center mt-4 mb-12">
            <Table onGameStateChange={handleGameStateChange} />
          </div>
          <div className="flex-shrink-0 mt-8">
            <ActionButtons 
              isGameActive={gameState.status === 'playing'} 
              isPlayerTurn={isUserTurn}
              currentBet={gameState.bigBlind}
              bigBlind={gameState.bigBlind}
            />
          </div>
          {/* Pass the user's cards to UserHand */}
          <UserHand cards={gameState.userCards} />
        </div>
        <div className="chat-section lg:w-1/4">
          <Chat />
        </div>
      </div>
    </main>
  );
}
