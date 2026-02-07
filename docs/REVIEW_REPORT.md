# Code and Unit Test Review Report

## 1. Review Scope

Two units were reviewed:

1. **Auth Service** (`server/src/services/auth.ts` and `server/src/services/auth.test.ts`)
   - User registration with bcrypt hashing
   - User login with credential verification and JWT issuance
   - Token verification
   - Associated unit tests (8 test cases)

2. **Game Service** (`server/src/services/game.ts` and `server/src/services/game.test.ts`)
   - Wager validation
   - Question selection with "recent questions" avoidance
   - Answer evaluation and point adjustment
   - User stats retrieval
   - Associated unit tests (9 test cases)

## 2. Defect Summary

| Severity | Auth Service | Game Service | Total |
| -------- | ------------ | ------------ | ----- |
| High     | 0            | 1            | 1     |
| Medium   | 2            | 3            | 5     |
| Low      | 3            | 2            | 5     |
| **Total** | **5**       | **6**        | **11** |

### Key Findings

- **GAME-002 (High)**: Wager validation did not check for integer values. A fractional wager would have been accepted. Fixed by adding `Number.isInteger()` check.
- **GAME-003 (Medium)**: Dynamic `require()` in `submitAnswer` broke under Vitest's module resolution. Fixed by using a static import.
- **AUTH-001 (Medium)**: TypeScript type mismatch with `jsonwebtoken`'s stricter types. Resolved with a type cast.

All identified issues have been resolved.

## 3. Test Quality Assessment

### Coverage

| Service | Test Cases | Functions Tested | Branch Coverage (estimated) |
| ------- | ---------- | ---------------- | --------------------------- |
| Auth    | 8          | 3 (`registerUser`, `loginUser`, `verifyToken`) | ~85% |
| Game    | 9          | 4 (`getStats`, `startRound`, `submitAnswer`, `hasPendingRound`) | ~80% |

### Test Characteristics

- **Isolation**: All tests use an in-memory SQLite database (`:memory:`), ensuring no side effects on real data.
- **Positive and negative paths**: Both services test success cases and expected failure modes (wrong password, duplicate username, invalid wager, missing pending round).
- **Determinism**: Tests that need the correct answer index look it up from the loaded question data to ensure deterministic assertions.

### Gaps (acceptable for MVP POC)

- No time-based JWT expiry tests (would require mocking `Date.now`)
- No concurrency / race-condition tests for registration
- No test for question pool wrap-around when all questions have been recently asked
- No client-side (React component) unit tests

## 4. Review Metrics

| Metric | Value |
| ------ | ----- |
| Total issues found | 11 |
| Issues resolved | 11 |
| Issues deferred | 0 |
| Review coverage (files reviewed / total files) | 4 / 12 server source files (~33%) |
| Time spent on review | ~30 minutes |
| Test pass rate | 32/32 (100%) |
