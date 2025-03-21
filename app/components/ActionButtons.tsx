'use client';

import React, { useState, useEffect } from 'react';

// Action Buttons Component
interface ActionButtonsProps {
  isGameActive: boolean;
  isPlayerTurn: boolean;
  currentBet: number;
  bigBlind: number;
  onFold?: () => void;
  onCall?: (amount: number) => void;
  onRaise?: (amount: number) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  isGameActive, 
  isPlayerTurn, 
  currentBet, 
  bigBlind, 
  onFold, 
  onCall, 
  onRaise 
}) => {
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
      {/* Main buttons row */}
      <div className="flex justify-center space-x-3 mb-2">
        <div className="w-[130px]">
          <button 
            disabled={isDisabled}
            className={`bg-red-600 hover:bg-red-700 text-white w-full py-2 rounded-md font-bold text-lg
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleFold}
          >
            FOLD
          </button>
        </div>

        <div className="w-[130px]">
          <button 
            disabled={isDisabled}
            className={`bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded-md font-bold text-lg
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleCall}
          >
            {currentBet > 0 ? `CALL ${currentBet}` : 'CHECK'}
          </button>
        </div>

        <div className="w-[130px]">
          <button 
            disabled={isDisabled}
            className={`bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded-md font-bold text-lg
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleRaise}
          >
            RAISE {betAmount}
          </button>
        </div>
      </div>
      
      {/* Secondary buttons row - precisely aligned with buttons above */}
      <div className="flex justify-center space-x-3">
        {/* 1/2 and 2/3 buttons aligned with FOLD */}
        <div className="w-[130px] flex space-x-1">
          <button 
            disabled={isDisabled}
            className={`bg-gray-800 hover:bg-gray-700 text-white py-1 rounded-sm border border-gray-600 text-sm flex-1
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => currentBet > 0 && setBetAmount(Math.floor(currentBet * 1.5))}
          >
            1/2
          </button>
          <button 
            disabled={isDisabled}
            className={`bg-gray-800 hover:bg-gray-700 text-white py-1 rounded-sm border border-gray-600 text-sm flex-1
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => currentBet > 0 && setBetAmount(Math.floor(currentBet * 1.67))}
          >
            2/3
          </button>
        </div>
        
        {/* POT and ALL IN buttons aligned with CALL/CHECK */}
        <div className="w-[130px] flex space-x-1">
          <button 
            disabled={isDisabled}
            className={`bg-gray-800 hover:bg-gray-700 text-white py-1 rounded-sm border border-gray-600 text-sm flex-1
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => currentBet > 0 && setBetAmount(currentBet * 2)}
          >
            POT
          </button>
          <button 
            disabled={isDisabled}
            className={`bg-gray-800 hover:bg-gray-700 text-white py-1 rounded-sm border border-gray-600 text-sm flex-1
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => setBetAmount(1000)}
          >
            ALL IN
          </button>
        </div>
        
        {/* Increment/decrement controls aligned with RAISE */}
        <div className="w-[130px] flex items-center space-x-1">
          <button 
            disabled={isDisabled}
            className={`bg-gray-800 hover:bg-gray-700 text-white w-8 h-8 rounded-full border border-gray-600 text-sm flex items-center justify-center
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Decrease by min bet"
            onClick={decreaseBet}
          >
            -
          </button>
          <div className={`${isDisabled ? 'bg-gray-200 text-gray-500' : 'bg-white text-black'} px-2 py-1 rounded-sm text-center flex-grow`}>
            {betAmount}
          </div>
          <button 
            disabled={isDisabled}
            className={`bg-gray-800 hover:bg-gray-700 text-white w-8 h-8 rounded-full border border-gray-600 text-sm flex items-center justify-center
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Increase by min bet"
            onClick={increaseBet}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionButtons; 