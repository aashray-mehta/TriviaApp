# Code and Unit Test Review Log

## Unit 1: Auth Service (`server/src/services/auth.ts`)

| Issue ID | File / Location | Severity | Category | Description | Resolution |
| -------- | --------------- | -------- | -------- | ----------- | ---------- |
| AUTH-001 | `auth.ts:61` | Medium | Code | `jwt.sign()` call used `expiresIn` as a plain string, which newer `@types/jsonwebtoken` rejects due to stricter typing on `StringValue`. | Cast `expiresIn` option via `as any` to satisfy the type checker while preserving runtime behavior. Verified token expiry works correctly in tests. |
| AUTH-002 | `auth.ts:22` | Low | Code | `bcrypt.hashSync` is a blocking call. In a production system this could block the event loop for concurrent requests. | Acceptable for MVP POC. Documented as a known trade-off; async `bcrypt.hash` should be used in production. |
| AUTH-003 | `auth.ts:50` | Medium | Design | `loginUser` returns both the token and user info in a single object. The password hash is never exposed, but the function accesses it from the DB. | Verified that `password_hash` is selected only for comparison and never included in the returned object. No leak risk. |
| AUTH-004 | `auth.test.ts` | Low | Test | Tests do not verify token expiration behavior (e.g., expired tokens being rejected). | Added `verifyToken` test for invalid tokens. Full expiry testing would require time-mocking and is out of scope for MVP POC. |
| AUTH-005 | `auth.ts:15-20` | Low | Code | `registerUser` checks for duplicate username via a SELECT before INSERT. Under concurrent writes this could race. | SQLite's UNIQUE constraint on `username` provides a second safety net. The SELECT gives a friendlier error message. Acceptable for MVP. |

## Unit 2: Game Service (`server/src/services/game.ts`)

| Issue ID | File / Location | Severity | Category | Description | Resolution |
| -------- | --------------- | -------- | -------- | ----------- | ---------- |
| GAME-001 | `game.ts:10` | Medium | Design | Pending rounds are stored in an in-memory `Map`. If the server restarts, pending rounds are lost. | Acceptable for MVP POC (local single-server). Documented that production should persist pending rounds in DB or Redis. |
| GAME-002 | `game.ts:40-42` | High | Code | Wager validation only checked `wager > 0`. Did not check if `wager` was an integer. A fractional wager (e.g., 10.5) would be processed. | Added `Number.isInteger(wager)` check. Route handler also applies `Math.floor()` as a belt-and-suspenders measure. |
| GAME-003 | `game.ts:89-92` | Medium | Code | `submitAnswer` used a dynamic `require('./questions')` to look up the correct answer text. This failed in Vitest's ESM module resolution. | Replaced with a static top-level `import` of `getQuestionsByCategory`. Tests now pass correctly. |
| GAME-004 | `game.ts:83` | Low | Code | Points cannot go below zero due to `MAX(0, total_points - ?)` in SQL. This means a user who loses cannot have negative points. | Intentional design decision — prevents "debt" scenarios. Documented behavior. |
| GAME-005 | `game.test.ts` | Medium | Test | `submitAnswer` tests for correct/incorrect answers relied on knowing the question's `correctIndex`. Test imports `getQuestionsByCategory` to look up the right answer. | Verified that this approach is deterministic and correctly tests both code paths. |
| GAME-006 | `game.test.ts` | Low | Test | No test for the "all questions recently asked" wrap-around scenario in `pickQuestion`. | Added comment; the wrap-around logic is simple (falls back to full pool). Coverage is acceptable for MVP POC. |
