import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Custom hook to auto-join a poker table with proper reference tracking
 * to prevent infinite loops and unnecessary re-renders
 */
export default function useAutoJoin(playerNumber: number) {
  const { isConnected, joinTable } = useSocket();
  
  // Use refs to store state without causing re-renders
  const joinedRef = useRef(false);
  const joinAttemptedRef = useRef(false);
  const playerNumberRef = useRef(playerNumber);
  const isConnectedRef = useRef(isConnected);
  const joinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update playerNumber ref when it changes
  useEffect(() => {
    playerNumberRef.current = playerNumber;
  }, [playerNumber]);
  
  // Track connection status
  useEffect(() => {
    if (isConnected !== isConnectedRef.current) {
      console.log(`Connection status changed: ${isConnected ? 'connected' : 'disconnected'}`);
      isConnectedRef.current = isConnected;
    }
  }, [isConnected]);
  
  // Handle auto-join logic in a separate effect with minimal dependencies
  useEffect(() => {
    // Only try to join if we're connected and haven't joined or attempted yet
    if (isConnected && !joinedRef.current && !joinAttemptedRef.current && !joinTimeoutRef.current) {
      console.log(`Planning to join as Player ${playerNumberRef.current}`);
      
      // Mark that we've attempted to join to prevent duplicate attempts
      joinAttemptedRef.current = true;
      
      // Use a timeout to break any potential render cycles
      joinTimeoutRef.current = setTimeout(() => {
        // Only attempt to join if we're still connected
        if (isConnectedRef.current) {
          // Avatar images for different players (sample avatars)
          const playerAvatars = {
            1: "https://arweave.net/Q3Ljpx6BNV98Wv6mHO41_vgXMbGXeZgi9YSwLvHDV9M?ext=png",
            2: "https://nftstorage.link/ipfs/bafybeigo2argdud77koqsik6bucisxhsqix3emkkmxw6x54q6y5zjhhwva/10.png",
            3: "https://arweave.net/dDbt5xjUijtWa9cgQI8pNgQxQWGtWzSjCai6_Q8IYNw",
            4: "https://nftstorage.link/ipfs/bafybeieecnb4ngc6rnsagyvmfciy5sjgqbhpxrehgfv6qcbntq3hdrm6wq/126.png",
            5: "https://nftstorage.link/ipfs/bafybeieecnb4ngc6rnsagyvmfciy5sjgqbhpxrehgfv6qcbntq3hdrm6wq/437.png",
            6: "https://arweave.net/yheuGMtf3wV622CC9vaXJNQ8MSRKblgYfYmzpvma2_Y",
            7: "https://arweave.net/xptNzwgdR4ReqkZvhCBpdRAcBczygNr7p2Kw2I0XkJM",
            8: "https://gateway.pinata.cloud/ipfs/QmXrUnsKMogkfifzqSb2odBacrYxagsCZFdEHrFjiCY3Fd"
          };
          
          try {
            // Get the appropriate avatar or use a default
            const avatar = playerAvatars[playerNumberRef.current as keyof typeof playerAvatars] || playerAvatars[1];
            
            console.log(`Joining table as Player ${playerNumberRef.current}`);
            joinTable('test-table', `Player ${playerNumberRef.current}`, avatar, 1000, `player${playerNumberRef.current}`);
            console.log("Join table request sent");
            
            // Mark as successfully joined
            joinedRef.current = true;
          } catch (error) {
            console.error("Error joining table:", error);
            
            // Reset the attempt flag after a delay to allow retry
            setTimeout(() => {
              joinAttemptedRef.current = false;
            }, 5000);
          }
        } else {
          // If we're no longer connected by the time the timeout fires, reset attempt flag
          joinAttemptedRef.current = false;
        }
        
        // Clear the timeout ref
        joinTimeoutRef.current = null;
      }, 500); // Use a longer delay (500ms) to ensure socket connection is stabilized
    }
    
    // Cleanup function to handle component unmount or dependency changes
    return () => {
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
        joinTimeoutRef.current = null;
      }
    };
  }, [isConnected, joinTable]); // Only depend on connection status and join function
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear the timeout if the component unmounts
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }
      
      // Reset all refs
      joinedRef.current = false;
      joinAttemptedRef.current = false;
      joinTimeoutRef.current = null;
    };
  }, []);
  
  // No need to return anything
  return null;
} 