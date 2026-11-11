/**
 * Production-Grade Circuit Breaker (Hystrix / Resilience4j Pattern)
 * Guards microservices, external academic APIs, and database adapters against cascading failures.
 * 
 * States:
 *  - CLOSED: Normal operation. Requests pass through.
 *  - OPEN: Tripped due to repeated errors. Requests fail-fast immediately or trigger fallback.
 *  - HALF_OPEN: Trial period. Allows a single test request through to probe service recovery.
 */

export class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeoutMs = options.recoveryTimeoutMs || 15000;
    this.timeoutMs = options.timeoutMs || 8000;

    this.state = 'CLOSED'; // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
    this.failureCount = 0;
    this.successCount = 0;
    this.lastStateChange = Date.now();
    this.lastFailureTime = null;
    this.totalCalls = 0;
    this.totalSuccesses = 0;
    this.totalFailures = 0;
    this.totalShortCircuits = 0;
  }

  /**
   * Executes a command protected by the circuit breaker.
   * @param {Function} action - Async function returning a promise.
   * @param {Function} fallback - Optional fallback function if breaker is OPEN or action fails.
   */
  async execute(action, fallback = null) {
    this.totalCalls++;
    const now = Date.now();

    // Check if recovery timeout has elapsed to transition from OPEN -> HALF_OPEN
    if (this.state === 'OPEN') {
      if (now - this.lastStateChange >= this.recoveryTimeoutMs) {
        this.transitionTo('HALF_OPEN');
      } else {
        this.totalShortCircuits++;
        if (typeof fallback === 'function') {
          return await fallback(new Error(`CircuitBreaker '${this.name}' is OPEN (fail-fast active)`));
        }
        throw new Error(`CircuitBreaker '${this.name}' is OPEN. Request short-circuited to preserve stability.`);
      }
    }

    // Execute with timeout race
    try {
      const result = await Promise.race([
        action(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Operation timed out after ${this.timeoutMs}ms in '${this.name}'`)), this.timeoutMs)
        )
      ]);

      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      if (typeof fallback === 'function') {
        return await fallback(err);
      }
      throw err;
    }
  }

  onSuccess() {
    this.totalSuccesses++;
    if (this.state === 'HALF_OPEN') {
      this.transitionTo('CLOSED');
      this.failureCount = 0;
    } else {
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  onFailure(err) {
    this.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.transitionTo('OPEN');
    }
  }

  transitionTo(newState) {
    if (this.state !== newState) {
      console.warn(`[CircuitBreaker:${this.name}] Transitioned: ${this.state} -> ${newState} (Failures: ${this.failureCount})`);
      this.state = newState;
      this.lastStateChange = Date.now();
      if (newState === 'CLOSED') {
        this.failureCount = 0;
      }
    }
  }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      totalCalls: this.totalCalls,
      totalSuccesses: this.totalSuccesses,
      totalFailures: this.totalFailures,
      totalShortCircuits: this.totalShortCircuits,
      lastStateChange: new Date(this.lastStateChange).toISOString(),
      uptimeStateMs: Date.now() - this.lastStateChange
    };
  }
}

// Registry of shared circuit breakers across the application
export const circuitBreakers = {
  pythonMicroservice: new CircuitBreaker('PythonAIBridge', { failureThreshold: 3, recoveryTimeoutMs: 10000, timeoutMs: 5000 }),
  mongoCluster: new CircuitBreaker('MongoDBAtlas', { failureThreshold: 5, recoveryTimeoutMs: 15000, timeoutMs: 6000 }),
  openAlexApi: new CircuitBreaker('OpenAlexCrawler', { failureThreshold: 4, recoveryTimeoutMs: 30000, timeoutMs: 8000 })
};
