# Texas Hold'em Poker Game UI

This is a real-time multiplayer Texas Hold'em poker game built with Next.js and Socket.io.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- The poker game server running (see the [Server README](../server/README.md))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   
Create a `.env.local` file with the following:
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Running the Application

#### Development mode
```bash
npm run dev
```

#### Production build
```bash
npm run build
npm start
```

## Testing the Game

1. Start the server in one terminal:
```bash
cd ../server
npm run dev
```

2. Start the frontend in another terminal:
```bash
npm run dev
```

3. Open the test table in your browser:
   
   http://localhost:3000/test-table

4. For multiplayer testing, open the same URL in different browsers or incognito windows.

## Features

- Real-time multiplayer gameplay
- Responsive UI with Tailwind CSS
- Game status display
- Player cards and community cards visualization
- Player actions: fold, check, call, raise
- Chat functionality
- Visual indicators for turn, dealer position, and player status

## Technology Stack

- **Frontend Framework**: Next.js
- **Styling**: Tailwind CSS
- **Real-time Communication**: Socket.io client
- **State Management**: React hooks and context API
