# Handoff Report — Milestone 1 Iteration 2 Adversarial Verification

**Agent**: `challenger_m1_r2_1` (Archetype: EMPIRICAL CHALLENGER; Roles: critic, specialist)  
**Working Directory**: `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\challenger_m1_r2_1\`  
**Date**: 2026-11-03T22:15:00Z  
**Verdict**: **REQUEST_CHANGES**  

---

## 1. Observation

Adversarial empirical testing was executed directly against the live gateway server and codebase using the independent harness `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\challenger_m1_r2_1\verify_challenges.mjs`, the 42-test E2E suite, and the 1,000-user concurrency benchmark.

### Empirical Execution Results

| Challenge | Test Case | Target Endpoint / Mechanism | Empirical Result | Status |
|---|---|---|---|---|
| **Challenge 1** | 1.1 IP Spoofing via `X-Forwarded-For` | `POST /api/voice/turn` (35 reqs, rotated IPs) | All 35 returned `HTTP 200` (Bypassed rate limiter) | **FAIL (VULNERABLE)** |
| **Challenge 1** | 1.2 IP Spoofing via `X-Real-IP` | `POST /api/voice/turn` (35 reqs, rotated IPs) | Reqs 31–35 returned `HTTP 429` (Throttled) | **PASS (DEFENDED)** |
| **Challenge 1** | 1.3 Invalid Bearer Token Fallback | `POST /api/voice/turn` & `GET /api/students/me` | Safe fallback to IP limiter, `403` on protected, 0 crashes | **PASS (DEFENDED)** |
| **Challenge 1** | 1.4 Expired Bearer Token Fallback | `POST /api/voice/turn` & `GET /api/students/me` | Safe fallback to IP limiter, `403` on protected, 0 crashes | **PASS (DEFENDED)** |
| **Challenge 1** | 1.5 Multi-User Quota Isolation | `POST /api/agents/mock-interview` | User A throttled at 429; User B succeeds (200) on same IP | **PASS (DEFENDED)** |
| **Challenge 2** | 2.1 Mongoose Schema Model Fields | `server/models/User.js` | Schema defines `isInstitutionalVerified` & `institutionalEmail` | **PASS (DEFENDED)** |
| **Challenge 2** | 2.2 Profile Field & Credit Persistence | `POST /api/auth/verify-institutional-email` | Initial verify awards +10 credits (10 -> 20), fields set | **PASS (DEFENDED)** |
| **Challenge 2** | 2.3 Double-Spending & Race Condition | `POST /api/auth/verify-institutional-email` | 2nd call: +10 credits (30); 5 concurrent: +50 credits (60) | **FAIL (VULNERABLE)** |
| **Challenge 3** | 3.1 42-Test E2E Suite | `node --test tests/e2e/tier*.test.mjs` | 42 / 42 passed in 1.54s (0 failures) | **PASS** |
| **Challenge 3** | 3.2 1,000-User Concurrency Benchmark | `node tests/load/concurrency_benchmark_1000.cjs` | 6,521 reqs, 444.8 RPS, 0.20% error rate (< 1.0%), 0 crashes | **PASS** |

### Direct File & Code Observations

#### 1. Double-Spending Race Condition in Institutional Verification (`server/routes/authRoutes.js:277-309`)
```javascript
let updatedUserDoc = null;
if (isDbConnected()) {
  try {
    updatedUserDoc = await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          isVerified: true,
          isInstitutionalVerified: true,
          institutionalEmail: normalizedInstEmail,
          updatedAt: new Date()
        },
        $inc: { creditsRemaining: 10 }
      },
      { new: true }
    );
  } catch (dbErr) {
    console.error('[Auth Verify Institutional Error - DB]:', dbErr);
  }
}

if (updatedUserDoc) {
  memoryUsers.set(normalizedEmail, updatedUserDoc.toObject ? updatedUserDoc.toObject() : updatedUserDoc);
} else {
  const user = memoryUsers.get(normalizedEmail);
  if (user) {
    user.isVerified = true;
    user.isInstitutionalVerified = true;
    user.institutionalEmail = normalizedInstEmail;
    user.creditsRemaining = (user.creditsRemaining || 10) + 10;
    user.updatedAt = new Date();
  }
}
```
**Empirical Log Output**:
```
After second verification call: status=200, resp={"verified":true,"domain":"iisc.ac.in","bonusCreditsAwarded":10,"message":"Institutional scholar affiliation verified successfully! +10 outreach credits awarded."}, creditsRemaining=30
After 5 concurrent verification calls on fresh user: creditsRemaining=60
[DEFECT DETECTED] Race condition / replay double-spending: creditsRemaining is 60 instead of 20!
```

#### 2. Rate Limiting Bypass on Direct Server Connections (`server/server.js:44-56` & `server/middleware/rateLimiter.js:20`)
```javascript
// server/server.js
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, '/').toLowerCase() === process.argv[1].replace(/\\/g, '/').toLowerCase();
const isTestEnv = !isDirectRun || process.execArgv.some(arg => arg.startsWith('--test')) || process.env.NODE_ENV === 'test';
const trustProxyConfig = process.env.TRUST_PROXY || process.env.TRUSTED_PROXIES;
if (trustProxyConfig) {
  // ...
} else if (isTestEnv) {
  app.set('trust proxy', false);
} else {
  app.set('trust proxy', 1);
}

// server/middleware/rateLimiter.js:20
let rawIp = (req.app?.get('trust proxy') ? req.ip : null) || req.socket?.remoteAddress || req.ip || '127.0.0.1';
```
When running the gateway directly (`node server.js`), `isTestEnv` is false, causing `app.set('trust proxy', 1)` to be active.
When a direct client sends requests to port 5000 with forged `X-Forwarded-For: 198.51.100.${i}`, Express parses `req.ip` from the untrusted header because `trust proxy` is 1. `rateLimiter.js` accepts this forged IP, giving each request a fresh rate limit bucket.
**Empirical Log Output**:
```
1.1 Direct client cannot bypass rate limit by rotating X-Forwarded-For: Server must rate limit despite rotating X-Forwarded-For headers. Got responses: 200,200,200,200,200,200,200 (all 35 requests succeeded, 0 were throttled)
```

---

## 2. Logic Chain

1. **Institutional Verification Double-Spending (Defect 1)**:
   - *Observation*: `authRoutes.js` executes `$inc: { creditsRemaining: 10 }` (or `user.creditsRemaining += 10`) on every request without checking if `user.isInstitutionalVerified` is already `true`.
   - *Observation*: The MongoDB filter query is `{ email: normalizedEmail }`, rather than an atomic idempotency filter `{ email: normalizedEmail, isInstitutionalVerified: { $ne: true } }`.
   - *Deduction*: Any verified user can call `/api/auth/verify-institutional-email` repeatedly in a loop or dispatch concurrent bursts. Each call unconditionally adds 10 credits to their balance.
   - *Conclusion*: A severe credit inflation and double-spending vulnerability exists. In empirical testing, 5 concurrent calls awarded 60 credits instead of the maximum allowed 20 credits.

2. **IP Rate Limiting Bypass via Forged `X-Forwarded-For` (Defect 2)**:
   - *Observation*: In `server.js`, `trust proxy` defaults to `1` hop whenever `isTestEnv` is false.
   - *Observation*: In `rateLimiter.js`, `(req.app?.get('trust proxy') ? req.ip : null)` evaluates to `req.ip` because `trust proxy` returns `1` (truthy).
   - *Observation*: In unit tests (`adversarial_m1.test.js`), `process.env.NODE_ENV = 'test'` set `trust proxy` to `false`. But in real operational runtime (`node server.js`), `trust proxy` is `1`.
   - *Deduction*: When port 5000 is directly reachable by an attacker, the server blindly trusts the client's `X-Forwarded-For` header. An attacker rotating `X-Forwarded-For` completely circumvents the sliding window rate limiter.
   - *Conclusion*: Rate limiting fails against direct client spoofing in operational mode.

3. **Multi-User Quota Isolation & Bearer Token Fallback**:
   - *Observation*: Pre-limiter JWT extraction in `rateLimiter.js` and `server.js` populates `req.user`. When User A exhausts their 30 req/min quota on `/api/agents/mock-interview`, User B from the same IP can still make requests (`200 OK`) because buckets use `usr:${userId}`.
   - *Observation*: Malformed or expired Bearer tokens leave `req.user` undefined and fall back safely to `ip:${clientIp}` without throwing exceptions or crashing the server (0 unhandled crashes).

4. **E2E & Concurrency Benchmark**:
   - *Observation*: All 42 E2E tests across Tiers 1-4 pass (100%).
   - *Observation*: The 1,000-user concurrency benchmark achieved 6,521 requests at 444.8 req/sec with an error rate of 0.20% (< 1.0% threshold) and 0 unhandled crashes.

---

## 3. Caveats

1. **Reverse Proxy Architecture**: If the gateway is deployed strictly behind an upstream reverse proxy (e.g. AWS ALB, Cloudflare, NGINX) that strips untrusted client `X-Forwarded-For` headers before appending the true client IP, Defect 2 would be mitigated at the edge. However, the gateway code itself does not enforce this, leaving direct access to the server vulnerable.
2. **MongoDB Simulation Mode**: When running without an active MongoDB daemon, the server uses `memoryUsers`. Both the MongoDB query (`User.findOneAndUpdate`) and the in-memory branch (`memoryUsers.get`) suffer from the exact same missing idempotency check in Defect 1.

---

## 4. Conclusion & Verdict

**Verdict**: **REQUEST_CHANGES**

While Challenge 3 (E2E and 1,000-user concurrency benchmark) and several components of Challenge 1 (token fallback safety, multi-user quota isolation) passed cleanly, two critical defects must be remediated:

### Required Remediations:

1. **Remedy for Defect 1 (Institutional Verification Idempotency & Anti-Double-Spending)**:
   In `server/routes/authRoutes.js`:
   - Prior to awarding credits, check if the user is already verified:
     ```javascript
     const existingUser = isDbConnected() ? await User.findOne({ email: normalizedEmail }) : memoryUsers.get(normalizedEmail);
     if (existingUser?.isInstitutionalVerified) {
       return res.status(400).json({
         verified: true,
         error: 'Institutional affiliation has already been verified for this account.'
       });
     }
     ```
   - In MongoDB update, use atomic conditional query:
     ```javascript
     updatedUserDoc = await User.findOneAndUpdate(
       { email: normalizedEmail, isInstitutionalVerified: { $ne: true } },
       {
         $set: {
           isVerified: true,
           isInstitutionalVerified: true,
           institutionalEmail: normalizedInstEmail,
           updatedAt: new Date()
         },
         $inc: { creditsRemaining: 10 }
       },
       { new: true }
     );
     ```
     If `updatedUserDoc` is null because the user was already verified concurrently, return 400 without incrementing credits.

2. **Remedy for Defect 2 (Direct Client IP Anti-Spoofing)**:
   In `server/server.js` and `server/middleware/rateLimiter.js`:
   - Do NOT default `trust proxy` to `1` unless `TRUST_PROXY` environment variable is explicitly configured by the operator.
   - Alternatively, inside `rateLimiter.js`, verify if `req.socket.remoteAddress` is a known private/trusted proxy subnet before trusting `req.ip`.

---

## 5. Verification Method

To independently reproduce the failures:

### 1. Reproduce Institutional Verification Double-Spending (Defect 1)
Run `verify_challenges.mjs`:
```powershell
node .agents\teamwork\challenger_m1_r2_1\verify_challenges.mjs
```
*Observed Defect*: `creditsRemaining` inflates to 60 under 5 concurrent requests, and sequential replay increments credits by 10 indefinitely.

### 2. Reproduce Direct Client `X-Forwarded-For` Bypass (Defect 2)
Ensure gateway is running via `node server.js` on port 5000:
```powershell
node -e '
async function test() {
  for (let i = 0; i < 35; i++) {
    const res = await fetch("http://127.0.0.1:5000/api/voice/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "198.51.100." + i },
      body: JSON.stringify({ user_input: "bypass test" })
    });
    console.log("Req", i + 1, "Status:", res.status);
  }
}
test();
'
```
*Observed Defect*: All 35 requests return `200 OK` (none return `429 Too Many Requests`).
