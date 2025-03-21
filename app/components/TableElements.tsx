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
  // Position classes based on player number
  const positionClasses = {
    1: "bottom-1/4 right-[25%]", // top right
    2: "bottom-[42%] right-[18%]", // right
    3: "top-[42%] right-[25%]", // right
    4: "top-1/4 right-[40%]", // top
    5: "top-1/4 left-[40%]", // top
    6: "top-[42%] left-[25%]", // left
    7: "bottom-[42%] left-[18%]", // left 
    8: "bottom-1/4 left-[25%]", // bottom left
  };
  
  const chipColor = amount >= 100 ? "bg-green-600" : "bg-red-600";
  
  return (
    <div className={`poker-chip absolute ${positionClasses[playerNumber as keyof typeof positionClasses]} z-15`}>
      <div className={`chip-inner relative ${chipColor} text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-md`}>
        <div className="absolute inset-1 rounded-full border-2 border-dashed border-white opacity-50"></div>
        <span>{amount}</span>
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