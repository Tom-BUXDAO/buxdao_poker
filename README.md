# Texas Hold'em Poker Game

A real-time multiplayer Texas Hold'em poker game with a Next.js frontend and Socket.io backend.

## Project Structure

This project consists of two main parts:

- **Server (`/server`)**: A Socket.io server that handles the game logic, player actions, and real-time communication.
- **Frontend (`/texas-holdem-ui`)**: A Next.js application that provides the user interface for the poker game.

## Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)

## Installation

1. Clone this repository
2. Install dependencies for all parts of the project with a single command:

```bash
npm run install-all
```

## Configuration

1. Set up the server environment variables:
   - Copy `/server/.env.example` to `/server/.env`
   - Adjust any values if needed, but the defaults should work fine for local development

2. Set up the frontend environment variables:
   - The installation process creates `/texas-holdem-ui/.env.local` automatically
   - Adjust the Socket.io server URL if needed

## Running the Application

You can run the entire application (both server and frontend) with a single command:

```bash
npm run dev
```

This will start both the server and the frontend in development mode with hot reloading.

### Running Parts Separately

If you need to run just one part of the application:

- To run only the server:
  ```bash
  npm run server
  ```

- To run only the frontend:
  ```bash
  npm run client
  ```

## Accessing the Game

Once the application is running, you can access the poker game at:

```
http://localhost:3000
```

For testing, open multiple browser tabs or windows to simulate different players joining the game.

## Folder Structure

```
poker-bot/
├── package.json          # Root package.json with scripts to run both parts
├── README.md             # This readme file
├── server/               # Socket.io server
│   ├── index.js          # Main server entry point
│   ├── pokerLogic.js     # Game logic implementation
│   ├── cardUtils.js      # Utilities for card handling
│   └── ...
└── texas-holdem-ui/      # Next.js frontend
    ├── app/              # Application routes and components
    ├── public/           # Static assets
    └── ...
```

## Game Features

- Real-time multiplayer gameplay with Socket.io
- Modern, responsive UI built with Next.js and Tailwind CSS
- Complete Texas Hold'em game logic
- Visual representation of cards, chips, and player actions
- Player status indicators and turn management
- Pot calculation and bet handling

For more detailed information about each part, see the respective README files in the server and frontend directories. 