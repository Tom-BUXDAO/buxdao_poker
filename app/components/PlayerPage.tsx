'use client';

import { useState, useEffect, memo } from 'react';
import useAutoJoin from '../hooks/useAutoJoin';
import Home from '../page';

// Memoized stable component that only renders once
const StableRenderer = memo(function StableRenderer({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
});

// Wrapper component to handle auto-join separately from rendering
function AutoJoiner({ playerNumber }: { playerNumber: number }) {
  // Use our custom hook to auto-join as the specified player
  useAutoJoin(playerNumber);
  return null;
}

/**
 * Reusable player page component that prevents render cycles
 * by separating the auto-join logic from the main UI rendering
 */
export default function PlayerPage({ playerNumber }: { playerNumber: number }) {
  const [isReady, setIsReady] = useState(false);
  
  // Only run once on mount to avoid render cycles
  useEffect(() => {
    console.log(`Player${playerNumber}Page initializing`);
    
    // Delay rendering slightly to ensure all hooks are properly initialized
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [playerNumber]);
  
  return (
    <>
      {/* Auto-joiner runs separately from the main UI */}
      <AutoJoiner playerNumber={playerNumber} />
      
      {/* Only render the main UI once we're ready */}
      {isReady && (
        <StableRenderer>
          <Home />
        </StableRenderer>
      )}
    </>
  );
} 