'use client';

import { useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';

// Simply import the main page component 
import Home from '../../page';

export default function Player5Page() {
  const { isConnected, joinTable } = useSocket();
  const defaultAvatar = "https://arweave.net/Q3Ljpx6BNV98Wv6mHO41_vgXMbGXeZgi9YSwLvHDV9M?ext=png";

  // Auto-join as Player 5
  useEffect(() => {
    if (isConnected) {
      // Just join as player5, no redirect
      joinTable('test-table', 'Player 5', defaultAvatar, 1000, 'player5');
    }
  }, [isConnected, joinTable]);

  // Just render the homepage component which has all the UI
  return <Home />;
} 