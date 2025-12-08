# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ft_transcendance is a full-stack Pong game web application with real-time multiplayer capabilities. It consists of a vanilla TypeScript SPA client and a Node.js/Fastify backend with WebSocket support.

## Commands

### Docker (Primary Development)
```bash
make run        # Build and start all services (frontend + backend)
make detach     # Build and start in detached mode
make stop       # Stop all services
make logs       # View container logs
make clean      # Remove containers, volumes, and images
make re         # Restart (stop + run)
make backend    # Run only backend service
make frontend   # Run only frontend service
```

### Client Development (inside client/)
```bash
npm run dev     # Start Vite dev server
npm run build   # TypeScript compile + Vite build
npm run preview # Preview production build
```

### Server Development (inside server/)
```bash
npm run dev     # Start Fastify server
npm start       # Same as dev
```

## Architecture

### Client (`client/`)
Vanilla TypeScript SPA using Vite, Navigo router, and TailwindCSS v4.

**Layered pattern per feature:**
- `pages/{feature}.ts` - Renders HTML template strings, sets up DOM event listeners
- `services/{feature}.ts` - API calls using centralized `api.ts` wrapper
- `types/{feature}.ts` - TypeScript interfaces
- `utils/{feature}.ts` - Pure helper functions
- `styles/{feature}.css` - Page-specific CSS with component naming (`.{feature}-*`)

**Key files:**
- `router.ts` - Navigo route definitions with auth guards via `isAuthenticated()`
- `api.ts` - Centralized fetch wrapper that injects JWT Bearer token from localStorage

**Pages:** auth, home, landingPage, offlineGame, onlineGame, profile, friend, tournament, stats, notFound

### Server (`server/`)
Node.js with Fastify framework and SQLite database.

**Structure:**
- `server/app.js` - Main entry, registers plugins (CORS, WebSocket, multipart) and routes
- `routes/users.js` - User authentication and profile endpoints
- `routes/tournaments.js` - Tournament management endpoints
- `websocket/GameWebSocket.js` - Real-time game communication
- `game/GameEngine.js` - Pong game logic
- `database/db.js` - SQLite initialization and queries

**API Endpoints:**
- `/api/users/*` - User auth and profile management
- `/api/tournaments/*` - Tournament CRUD
- `/api/games` - Active games list
- `/ws` - WebSocket for real-time gameplay
- `/uploads/*` - Static file serving for avatars

### Ports
- Frontend: 8080 (HTTP), 8443 (HTTPS)
- Backend API: 3001
- WebSocket: ws://localhost:3001/ws
