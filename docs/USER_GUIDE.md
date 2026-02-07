# User Guide — Trivia Game

## Prerequisites

- **Node.js** 18 or later
- **npm** (included with Node.js)

## Running the Server

1. Open a terminal and navigate to the `server` directory:

   ```bash
   cd server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. The server will start on **http://localhost:3001**. You should see:

   ```
   Loaded 3 categories: Geography, History, Science
   Trivia server listening on http://localhost:3001
   ```

### Server Configuration

| Variable     | Default               | Description               |
| ------------ | --------------------- | ------------------------- |
| `PORT`       | `3001`                | Server listen port        |
| `JWT_SECRET` | built-in default      | Secret for signing JWTs   |
| `DB_PATH`    | `data/trivia.db`      | Path to SQLite database   |

Set environment variables to override defaults, e.g.:

```bash
PORT=4000 npm run dev
```

## Running the Client

1. Open a **separate** terminal and navigate to the `client` directory:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the Vite development server:

   ```bash
   npm run dev
   ```

4. Open **http://localhost:5173** in your browser.

The Vite dev server proxies all API requests (`/auth/*`, `/game/*`, `/stats`) to the backend at `http://localhost:3001`.

## Using the Application

### 1. Register

- On the login page, click the **Register** tab.
- Enter a username (unique) and password (at least 4 characters).
- Click **Register**. You will be automatically logged in.

### 2. Login

- On the **Login** tab, enter your credentials and click **Login**.
- A JWT token is stored in your browser and sent with each request.

### 3. Play Trivia

1. **Choose a Category** — select from Science, History, or Geography.
2. **Place a Wager** — enter how many points you want to bet (cannot exceed your current points). You can also click a quick-select chip (10, 25, or 50).
3. **Answer the Question** — click on one of the answer options.
4. **View the Result** — see whether you were correct, the correct answer, and your updated point total.
5. Click **Play Again** to start another round.

### 4. View Statistics

- Click the **Stats** button in the top navigation bar.
- A dialog shows your current points, games played, correct/incorrect counts, and accuracy percentage.

### 5. Logout

- Click **Logout** in the top navigation bar.
- Your token is discarded and you are returned to the login screen.

## Running Tests

From the `server` directory:

```bash
npm test
```

This runs both unit tests (auth and game logic) and system tests (full HTTP round-trip tests via Supertest). All tests use an in-memory SQLite database so no persistent data is created.

## Project Structure

```
exec_session_2_project/
├── server/          # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── index.ts         # Express app entry point
│   │   ├── config.ts        # Configuration
│   │   ├── types.ts         # Shared TypeScript types
│   │   ├── db/              # SQLite database schema and connection
│   │   ├── routes/          # REST API route handlers
│   │   ├── services/        # Business logic (auth, game, questions)
│   │   └── middleware/      # Auth middleware, error handler
│   └── data/
│       └── questions/       # Trivia question JSON files
├── client/          # React + Vite + MUI frontend
│   └── src/
│       ├── api/             # API client (fetch wrapper)
│       ├── components/      # Reusable UI components
│       └── pages/           # Page-level components
└── docs/            # Documentation
```
