'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';

// Simply import the main page component 
import HomePage from '../../page';

export default function Player1Page() {
  const { isConnected, joinTable } = useSocket();
  const defaultAvatar = "https://arweave.net/Q3Ljpx6BNV98Wv6mHO41_vgXMbGXeZgi9YSwLvHDV9M?ext=png";
  const [joined, setJoined] = useState(false);

  // Auto-join as Player 1
  useEffect(() => {
    if (isConnected && !joined) {
      console.log("Joining table as Player 1");
      // Just join as player1, no redirect
      joinTable('test-table', 'Player 1', defaultAvatar, 1000, 'player1');
      setJoined(true);
      console.log("Join table request sent");
    }
  }, [isConnected, joinTable, joined]);

  // Just render the homepage component which has all the UI
  return <HomePage />;
} 