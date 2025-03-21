'use client';

import React from 'react';

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

export default GameStatusHeader; 