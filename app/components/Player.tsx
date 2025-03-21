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
    fileName: string;
  }[];
  dealer?: boolean;
  isCurrentPlayer?: boolean;
  folded?: boolean;
}

export const Player: React.FC<PlayerProps> = ({ 
  name, 
  position, 
  chips, 
  isActive = false, 
  cards = [], 
  dealer = false, 
  isCurrentPlayer = false, 
  folded = false 
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

export default Player;