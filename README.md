# Trivia Game — Client-Server System

A distributed client-server trivia game built with Node.js/TypeScript (server) and React/MUI (client). Supports user authentication, category-based trivia questions with wagering, and persistent user statistics.

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Run the Server

```bash
cd server
npm install
npm run dev
```

The server starts on `http://localhost:3001`.

### Run the Client

```bash
cd client
npm install
npm run dev
```

The client starts on `http://localhost:5173` and proxies API requests to the server.

### Run Tests

```bash
cd server
npm test
```

## Documentation

- [User Guide](docs/USER_GUIDE.md)
- [Review Log](docs/REVIEW_LOG.md)
- [Review Report](docs/REVIEW_REPORT.md)
- [System Test Report](docs/SYSTEM_TEST_REPORT.md)
