# System Test Report

## 1. Testing Strategy

### Approach

System tests verify end-to-end client-server communication by sending HTTP requests to the Express application and asserting on response status codes, headers, and JSON bodies. Tests use **Supertest** to make requests directly against the Express app object (no actual TCP port binding required in most environments).

### Test Environment

| Component | Detail |
| --------- | ------ |
| Runtime   | Node.js 18+ |
| Framework | Vitest 2.x |
| HTTP Testing | Supertest 7.x |
| Database  | In-memory SQLite (`:memory:`) |
| Questions | Loaded from `server/data/questions/` JSON files at test setup |

### What Is Tested

The system tests cover the following REST API flows:

1. **Authentication**
   - User registration (success and duplicate rejection)
   - Input validation (missing username, short password)
   - User login (valid and invalid credentials)

2. **Authorization**
   - Unauthenticated access to protected endpoints (`/game/categories`, `/stats`) returns 401
   - Invalid JWT token returns 401

3. **Game Flow**
   - Retrieve categories (authenticated)
   - Full round: wager -> receive question -> submit answer -> receive result
   - Wager exceeding available points is rejected with 400

4. **Statistics**
   - Retrieve user stats after playing at least one round
   - Verify response shape (totalPoints, gamesPlayed, accuracy, etc.)

5. **Error Handling**
   - Malformed JSON body returns 400
   - Health check endpoint returns 200

## 2. Test Results

### Summary

| Metric | Value |
| ------ | ----- |
| Total system test cases | 15 |
| Passed | 15 |
| Failed | 0 |
| Skipped | 0 |
| Execution time | ~200ms |

### Detailed Results

| # | Test Case | Status | Notes |
| - | --------- | ------ | ----- |
| 1 | Register new user returns 201 | PASS | |
| 2 | Duplicate username returns 409 | PASS | |
| 3 | Missing username returns 400 | PASS | |
| 4 | Short password returns 400 | PASS | |
| 5 | Valid login returns token | PASS | Token saved for subsequent tests |
| 6 | Invalid password returns 401 | PASS | |
| 7 | Unauthenticated /game/categories returns 401 | PASS | |
| 8 | Unauthenticated /stats returns 401 | PASS | |
| 9 | Get categories returns array | PASS | |
| 10 | Full game round completes successfully | PASS | Wager, question, submit, result |
| 11 | Wager exceeding points returns 400 | PASS | |
| 12 | Get stats returns valid shape | PASS | gamesPlayed >= 1 after round |
| 13 | Malformed JSON returns 400 | PASS | |
| 14 | Invalid token returns 401 | PASS | |
| 15 | Health check returns ok | PASS | |

## 3. Observations

- All tests pass deterministically with an in-memory database, ensuring no test pollution.
- The full game round test (test #10) exercises the complete wager-question-submit flow in a single test case, verifying that all components (auth middleware, game service, question service, database) integrate correctly.
- Response shapes are validated to ensure the client would receive the expected JSON structure.

## 4. Known Limitations

- Tests run against the Express app object via Supertest, not against a live TCP server. This is standard practice for integration testing but does not test actual network-level concerns (TLS, connection pooling, etc.).
- No load or stress testing was performed (out of scope for MVP POC).
- Client-side (React) rendering is not tested in system tests; only the API contract is verified.
