# Poker Game

A multiplayer poker game built with Next.js and TypeScript.

## Project Structure

The project has been refactored into smaller, more maintainable components:

### Components

- `ActionButtons.tsx` - Buttons for player actions (fold, call, raise)
- `Cards.tsx` - Card-related components (UserHand, LargeCard, FaceUpCard, FaceDownCard)
- `GameStatusHeader.tsx` - Header displaying game status information
- `GlobalChat.tsx` - Chat component for player communication
- `Player.tsx` - Player component displaying avatar, chips, and cards
- `Table.tsx` - Main table component with game logic
- `TableElements.tsx` - Table UI elements (CommunityCards, PokerChip, TotalPot)

### Types

Shared types are defined in `app/types/index.ts`:
- `Card` - Card interface
- `Player` - Player interface
- `GameState` - Game state interface
- `ChatMessage` - Chat message interface
- `TableState` - Table state interface

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result. 