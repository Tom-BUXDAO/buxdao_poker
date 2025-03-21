'use client';

import React from 'react';
import Image from "next/image";
import { Card } from '../types';

// Player Card Component (Face Down version)
export const FaceDownCard: React.FC = () => {
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
export const FaceUpCard: React.FC<{ cardName: string }> = ({ cardName }) => {
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
export const LargeCard: React.FC<{ cardName: string }> = ({ cardName }) => {
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

// User Hand Component (shown in bottom left corner)
export const UserHand: React.FC<{ cards: Card[] | undefined, folded: boolean }> = ({ cards = [], folded }) => {
  // Safely handle undefined or null cards
  if (!cards || cards.length === 0) {
    return <div className="absolute bottom-0 left-8 flex space-x-3 z-20"></div>;
  }
  
  return (
    <div className={`absolute bottom-0 left-8 flex space-x-3 z-20 ${folded ? "opacity-40" : ""}`}>
      {cards.map((card, index) => (
        <LargeCard key={index} cardName={card.fileName || `${card.value}${card.suit}`} />
      ))}
    </div>
  );
}; 