'use client';

import React from 'react';
import Image from "next/image";
import { Card } from '../types';
import { FaceUpCard } from './Cards';

// Community Cards Component
export const CommunityCards: React.FC<{ cards?: Card[] }> = ({ cards = [] }) => {
  return (
    <div className="community-cards absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
      <div className="cards flex gap-2 justify-center">
        {cards.map((card, index) => (
          <FaceUpCard key={index} cardName={card.fileName} />
        ))}
        {/* Fill empty spots with placeholders if needed */}
        {Array.from({ length: Math.max(0, 5 - cards.length) }).map((_, index) => (
          <div key={`empty-${index}`} className="w-[50px] h-[70px] rounded-md bg-gray-800 opacity-30"></div>
        ))}
      </div>
    </div>
  );
};

// Poker Chip Component
export const PokerChip: React.FC<{ amount: number; playerNumber: number }> = ({ amount, playerNumber }) => {
  // Position classes with all adjustments
  const positionClasses = {
    1: "left-[calc(10%+120px)] top-[45%]", // Player 1 - moved right 120px (adjusted 30px left)
    2: "left-[30%] top-[calc(38%+135px)]", // Player 2 - centered with player
    3: "left-[50%] top-[calc(38%+135px)] -translate-x-1/2", // Player 3 - centered with player
    4: "right-[30%] top-[calc(38%+135px)]", // Player 4 - centered with player
    5: "right-[calc(10%+120px)] top-[45%]", // Player 5 - moved left 120px
    6: "right-[30%] bottom-[calc(15%+180px)]", // Player 6 - moved up 180px
    7: "left-[50%] bottom-[calc(15%+180px)] -translate-x-1/2", // Player 7 - moved up 180px
    8: "left-[30%] bottom-[calc(15%+180px)]", // Player 8 - moved up 180px
  };
  
  // Determine chip color based on amount
  let chipColor;
  if (amount >= 500) {
    chipColor = "bg-black"; // Black chip for high bets
  } else if (amount >= 200) {
    chipColor = "bg-green-800"; // Dark green for $200
  } else if (amount >= 100) {
    chipColor = "bg-green-800"; // Green for $100
  } else if (amount >= 50) {
    chipColor = "bg-blue-800"; // Blue for $50
  } else if (amount >= 20) {
    chipColor = "bg-red-700"; // Red for smaller amounts
  } else {
    chipColor = "bg-gray-700"; // Gray for smallest bets
  }
  
  // For player 5, we need to reverse the order of chip and amount
  if (playerNumber === 5) {
    return (
      <div className={`poker-chip absolute ${positionClasses[playerNumber as keyof typeof positionClasses]} z-20`}>
        <div className="flex items-center">
          {/* Bet amount on the left for player 5 */}
          <div className="bg-black/70 text-yellow-400 font-bold text-sm mr-1 px-2 py-0.5 rounded-full shadow-md">
            {amount}
          </div>
          
          {/* Chip image exactly sized */}
          <div className={`${chipColor} rounded-full overflow-hidden w-6 h-6 shadow-md`}>
            <Image 
              src="/poker-chip-thin.svg" 
              alt="Chip" 
              width={24} 
              height={24} 
              className="invert" // Make SVG white
            />
          </div>
        </div>
      </div>
    );
  }
  
  // For all other players, keep the original layout
  return (
    <div className={`poker-chip absolute ${positionClasses[playerNumber as keyof typeof positionClasses]} z-20`}>
      <div className="flex items-center">
        {/* Chip image exactly sized */}
        <div className={`${chipColor} rounded-full overflow-hidden w-6 h-6 shadow-md`}>
          <Image 
            src="/poker-chip-thin.svg" 
            alt="Chip" 
            width={24} 
            height={24} 
            className="invert" // Make SVG white
          />
        </div>
        
        {/* Bet amount in separate container - matches screenshot */}
        <div className="bg-black/70 text-yellow-400 font-bold text-sm ml-1 px-2 py-0.5 rounded-full shadow-md">
          {amount}
        </div>
      </div>
    </div>
  );
};

// Total Pot Component
export const TotalPot: React.FC<{ amount: number }> = ({ amount }) => {
  if (amount <= 0) return null;
  
  return (
    <div className="total-pot absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-[130%] z-15">
      <div className="chip flex flex-col items-center">
        <div className="bg-purple-700 text-white text-sm font-bold rounded-full px-4 py-1.5 flex items-center justify-center shadow-lg">
          <span className="chip-stack-icon mr-1.5">
            <div className="relative w-4 h-4">
              <Image src="/poker-chip-thin.svg" alt="Chip" width={16} height={16} className="absolute top-0" />
              <Image src="/poker-chip-thin.svg" alt="Chip" width={16} height={16} className="absolute top-[2px]" />
              <Image src="/poker-chip-thin.svg" alt="Chip" width={16} height={16} className="absolute top-[4px]" />
            </div>
          </span>
          <span>{amount}</span>
        </div>
        <div className="chip-label text-xs text-white/80 mt-1">Total Pot</div>
      </div>
    </div>
  );
}; 