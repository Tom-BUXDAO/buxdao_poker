import React from "react";
import Image from "next/image";
import { FaceUpCard, FaceDownCard } from './Cards';

// Player Component with face down cards
interface PlayerProps {
  name: string;
  position: number;
  chips: number;
  isActive?: boolean;
  cards?: {
    value: string;
    suit: string;
    fileName?: string;
  }[];
  dealer?: boolean;
  isCurrentPlayer?: boolean;
  folded?: boolean;
  showDebugCards?: boolean;
}

export const Player: React.FC<PlayerProps> = ({ 
  name, 
  position, 
  chips, 
  isActive = false, 
  cards = [], 
  dealer = false, 
  isCurrentPlayer = false, 
  folded = false,
  showDebugCards = false
}) => {
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

  // Add a highlight for current player - keep the green border, no triangle indicator
  const currentPlayerClass = isCurrentPlayer ? "border-green-400 border-4" : "";

  // Add folded visual state - gray out the player avatar
  const foldedClass = folded ? "opacity-50 grayscale" : "";

  // Check if this is a bottom seat (positions 6, 7, 8)
  const isBottomSeat = position === 6 || position === 7 || position === 8;

  // Only show cards if player hasn't folded
  const shouldShowCards = !folded;

  // Prepare cards - ensure each card has fileName property
  const processedCards = cards.map(card => {
    if (!card.fileName && card.value && card.suit) {
      return {
        ...card,
        fileName: `${card.value}${card.suit.toLowerCase()}`
      };
    }
    return card;
  });

  // Debug - log card data to help diagnose the issue
  console.log(`Player ${name} cards:`, processedCards, `isCurrentPlayer:`, isCurrentPlayer, `folded:`, folded);

  return (
    <div className="player-wrapper relative">
      {/* Dealer Button - fixed position outside flex layout */}
      {dealer && (
        <div 
          className="absolute bg-yellow-500 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-20"
          style={{ 
            // Positions carefully adjusted for each seat to avoid card overlap
            top: position === 1 ? "40px" : 
                 position === 2 ? "115px" : 
                 position === 3 ? "115px" : 
                 position === 4 ? "115px" : 
                 position === 6 ? "60px" : 
                 position === 7 ? "60px" : 
                 position === 8 ? "60px" : 
                 position === 5 ? "40px" : "0px",
            // Left position for specific seats - adjust to account for fixed width container
            left: position === 5 ? "-3px" : 
                  position === 1 ? "auto" : 
                  position === 2 ? "auto" : 
                  position === 3 ? "auto" : 
                  position === 4 ? "auto" : 
                  position === 6 ? "auto" : 
                  position === 7 ? "auto" : 
                  position === 8 ? "auto" : "auto",
            // Right position for specific seats - adjust to account for fixed width container
            right: position === 5 ? "auto" : 
                   position === 1 ? "-3px" : 
                   position === 2 ? "-3px" : 
                   position === 3 ? "-3px" : 
                   position === 4 ? "-3px" : 
                   position === 6 ? "-3px" : 
                   position === 7 ? "-3px" : 
                   position === 8 ? "-3px" : "0px"
          }}
        >
          D
        </div>
      )}
      
      {/* All other content in flex layout */}
      <div className="flex flex-col items-center w-[160px]">
        {/* Player name and chips - show above avatar for non-bottom seats */}
        {!isBottomSeat && (
          <div className={`player-name-chip text-white text-base font-bold bg-gray-800 px-3 py-1 rounded-md flex items-center justify-between mb-2 w-full ${folded ? "opacity-50" : ""}`}>
            <span className="truncate max-w-[80px]">{name}</span>
            <span className="mx-1 text-gray-400">|</span>
            <span className="text-yellow-400">{chips}</span>
          </div>
        )}
        
        {/* Cards for bottom positions - always reserve the space, conditionally show cards */}
        {isBottomSeat && (
          <div className="h-[70px] flex items-center justify-center mb-2 w-full">
            {shouldShowCards && processedCards.length > 0 && (
              <div className="flex space-x-2">
                {processedCards.map((card, idx) => (
                  <div key={idx}>
                    {(isCurrentPlayer || showDebugCards) && card.fileName ? 
                      <FaceUpCard cardName={card.fileName} /> : 
                      <FaceDownCard />
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Circular avatar - restored overflow-hidden */}
        <div className={`player-avatar rounded-full h-20 w-20 overflow-hidden ${activeClass} ${currentPlayerClass} ${foldedClass} border-[3px] border-white shadow-lg relative`}>
          <Image
            src={playerImages[position as keyof typeof playerImages]} 
            alt={name} 
            width={80} 
            height={80}
            className="object-cover"
            priority={true}
          />
        </div>
        
        {/* Cards for non-bottom positions - always reserve the space, conditionally show cards */}
        {!isBottomSeat && (
          <div className="h-[70px] flex items-center justify-center mt-2 w-full">
            {shouldShowCards && processedCards.length > 0 && (
              <div className="flex space-x-2">
                {processedCards.map((card, idx) => (
                  <div key={idx}>
                    {(isCurrentPlayer || showDebugCards) && card.fileName ? 
                      <FaceUpCard cardName={card.fileName} /> : 
                      <FaceDownCard />
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Player name and chips - show below avatar for bottom seats */}
        {isBottomSeat && (
          <div className={`player-name-chip text-white text-base font-bold bg-gray-800 px-3 py-1 rounded-md flex items-center justify-between mt-2 w-full ${folded ? "opacity-50" : ""}`}>
            <span className="truncate max-w-[80px]">{name}</span>
            <span className="mx-1 text-gray-400">|</span>
            <span className="text-yellow-400">{chips}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Player;