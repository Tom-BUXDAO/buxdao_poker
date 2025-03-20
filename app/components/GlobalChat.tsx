'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

interface ChatMessage {
  type: 'chat' | 'system';
  sender?: string;
  message: string;
  time: string;
  playerId?: string;  // Added to track which messages are from current user
}

interface ToggleProps {
  label: string;
  isActive: boolean;
  onChange: () => void;
}

// Toggle Switch Component
const ToggleSwitch: React.FC<ToggleProps> = ({ label, isActive, onChange }) => (
  <div className="flex items-center gap-2">
    <button 
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-blue-600' : 'bg-gray-600'}`}
    >
      <span 
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
    <span className="text-sm text-white">{label}</span>
  </div>
);

const GlobalChat: React.FC<{ playerName: string }> = ({ playerName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showChatMessages, setShowChatMessages] = useState(true);
  const [showSystemMessages, setShowSystemMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get socket context
  const { socket, sendMessage: socketSendMessage } = useSocket();
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Listen for new messages from Socket.io
  useEffect(() => {
    if (!socket) return;
    
    // Handler for new chat messages
    const handleNewMessage = (data: { playerId: string; playerName: string; message: string; timestamp: string }) => {
      console.log('Received chat message:', data);
      const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Add to local messages
      setMessages(prev => {
        // Check for duplicate messages (can happen with socket reconnections)
        const isDuplicate = prev.some(
          msg => msg.type === 'chat' && 
                msg.sender === data.playerName && 
                msg.message === data.message
        );
        
        if (isDuplicate) return prev;
        
        return [...prev, {
          type: 'chat',
          sender: data.playerName,
          message: data.message,
          time,
          playerId: data.playerId
        }];
      });
    };
    
    // Handler for system messages (assuming server emits these with 'systemMessage' event)
    const handleSystemMessage = (data: { message: string; timestamp: string }) => {
      console.log('Received system message:', data);
      const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      setMessages(prev => [
        ...prev, 
        {
          type: 'system',
          message: data.message,
          time
        }
      ]);
    };
    
    // Subscribe to Socket.io events
    socket.on('newMessage', handleNewMessage);
    socket.on('systemMessage', handleSystemMessage);
    
    // Cleanup
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('systemMessage', handleSystemMessage);
    };
  }, [socket]);
  
  // Handle sending a chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputMessage.trim()) {
      const now = new Date();
      const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Add message to local state
      setMessages(prev => [...prev, {
        type: 'chat',
        sender: playerName,
        message: inputMessage.trim(),
        time: timeString,
        playerId: socket?.id
      }]);
      
      // Send message via Socket.io if connected
      if (socket && socket.connected) {
        socketSendMessage(inputMessage.trim());
      }
      
      setInputMessage('');
    }
  };

  // Filter messages based on toggle settings
  const filteredMessages = messages.filter(msg => {
    if (msg.type === 'chat' && !showChatMessages) return false;
    if (msg.type === 'system' && !showSystemMessages) return false;
    return true;
  });
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg flex flex-col h-full">
      <div className="p-3 bg-gray-900 rounded-t-lg flex items-center justify-between">
        <div className="flex gap-4">
          <ToggleSwitch 
            label="Chat" 
            isActive={showChatMessages} 
            onChange={() => setShowChatMessages(!showChatMessages)}
          />
          <ToggleSwitch 
            label="System" 
            isActive={showSystemMessages} 
            onChange={() => setShowSystemMessages(!showSystemMessages)}
          />
        </div>
      </div>
      
      <div className="flex-grow p-3 overflow-y-auto space-y-3 bg-gray-800">
        {filteredMessages.length > 0 ? (
          <>
            {filteredMessages.map((msg, index) => {
              const isCurrentUser = msg.playerId === socket?.id;
              
              if (msg.type === 'system') {
                return (
                  <div key={index} className="flex justify-center">
                    <div className="bg-gray-600 px-3 py-1 rounded-full text-xs text-gray-300 max-w-[80%]">
                      <span className="italic">{msg.message}</span>
                      <span className="ml-2 text-gray-400 text-[10px]">{msg.time}</span>
                    </div>
                  </div>
                );
              }
              
              return (
                <div key={index} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`relative max-w-[80%] px-3 py-2 rounded-lg ${
                    isCurrentUser 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-gray-700 text-white rounded-tl-none'
                  }`}>
                    {!isCurrentUser && (
                      <div className="text-xs font-semibold text-blue-400 mb-1">
                        {msg.sender}
                      </div>
                    )}
                    <p className="text-sm break-words">
                      {msg.message}
                    </p>
                    <div className="text-[10px] text-right mt-1 opacity-70">
                      {msg.time}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500 text-sm">No messages yet. Be the first to say hello!</p>
          </div>
        )}
      </div>
      
      <div className="p-2 bg-gray-700 rounded-b-lg">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input 
            type="text" 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..." 
            className="flex-grow p-2 text-sm rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default GlobalChat; 