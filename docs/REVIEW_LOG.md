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

# Phase 1: Individual Review

**Reviewer:** Bhumir
**Date:** 2026-02-07

## Review Checklist
- [x] Code and tests reviewed independently
- [x] Findings logged with severity
- [x] Minimum expectations met:
    - [x] >= 10 comments (11 identified)
    - [x] >= 3 code issues
    - [x] >= 3 test issues
    - [x] >= 2 design or maintainability issues

## Findings

| ID | Category | Severity | File | Description | Proposed Fix |
|:---|:---------|:---------|:-----|:------------|:-------------|
| 1 | Logic | **Blocker** | `server/src/services/game.ts` | **Wager Not Deducted on Start**: `startRound` checks balance but does not deduct points. Wager is only deducted on *incorrect submission*. This allows users to "shop" for easy questions by abandoning difficult ones without penalty. | Deduct wager immediately in `startRound`. Refund if the question is "timed out" or handle abandonment through a timeout job (more complex), or simply make the wager the "cost to play" and return `2 * wager` for a win. Or, mark the round as "active" in DB and deduct on start, effectively treating abandonment as a loss. |
| 2 | Design | **Major** | `server/src/services/game.ts` | **In-Memory State**: `pendingRounds` are stored in a JS Map. If the server restarts, all active games are lost, but points (in DB) remain. This leads to user frustration. | Store pending rounds in the database (e.g., `pending_rounds` table) or Redis. |
| 3 | Security | **Major** | `server/src/config.ts` | **Hardcoded Secrets**: `jwtSecret` defaults to a hardcoded string locally. If this leaks to production, it compromises all auth. | Ensure `process.env.JWT_SECRET` is mandatory in production and fail startup if missing. Remove default value or make it obviously insecure (e.g., "CHANGE_ME"). |
| 4 | Security | **Major** | `client/src/api/client.ts` | **Insecure Token Storage**: `localStorage` is used for JWTs, which is vulnerable to XSS attacks. | Use `httpOnly` cookies for token storage. |
| 5 | Test | **Major** | `server/src/services/game.test.ts` | **Missing Abandonment Test**: Testing purely the happy path handles `start` -> `submit`. There is no test for "start -> abandon -> start new question", which would reveal the wagering exploit. | Add a test case: User starts round (wager 10), abandons, starts new round. Verify points balance decreases or is handled correctly. |
| 6 | Test | **Major** | `server/src/services/game.test.ts` | **Missing Concurrency Tests**: No tests for race conditions (e.g., double submission, multiple `startRound` calls). | Add tests using `Promise.all` to simulate concurrent requests for the same user. |
| 7 | Code | **Major** | `client/src/api/client.ts` | **No Error Handling for Fetch Failures**: `request` helper catches `res.json()` errors but doesn't robustly handle network failures (e.g., server down). | Add global error boundary or interceptor to handle network errors gracefully. |
| 8 | Code | **Minor** | `server/src/services/questions.ts` | **Synchronous File I/O**: `loadAllQuestions` uses `fs.readFileSync`. | Use `fs.promises` or streams for better scalability, although acceptable for startup-only logic. |
| 9 | Code | **Minor** | `server/src/index.ts` | **Race Condition on Startup**: `app.listen` is called inside `start()`, but `initDb` and `loadAllQuestions` are synchronous so this is technically fine, *but* if they ever become async (as good practice suggests), this will break. | Make `initDb` and `loadAllQuestions` async and `await` them before `app.listen`. |
| 10 | Test | **Minor** | `server/src/services/game.test.ts` | **Tautological Testing**: Some tests just check if a value exists without validating strict correctness (e.g., `expect(q.text).toBeTruthy()`). | Validate expected structure more strictly. |
| 11 | Code | **Nit** | `server/src/middleware/errorHandler.ts` | **Type Casting**: usage of `(err as any).type` is unsafe. | Define a custom Error type or interface extending Error for these known error structures. |

## Summary of Findings
- **Total Comments:** 11
- **Code Issues:** 5 (Logic, Security, Sync I/O, Startup Race, Error Handling)
- **Test Issues:** 3 (Abandonment, Concurrency, Tautology)
- **Design/Maintainability Issues:** 3 (Wager Design, In-Memory State, Hardcoded Secrets)

## Recommendation
The **Wager Not Deducted** issue is a blocker for fair play and must be resolved before Phase 2. The **In-Memory State** is a major design flaw that limits scalability and reliability. Security issues regarding JWT and LocalStorage should be addressed before any public release.
