/**
 * Circuit breaker pattern for external dependencies
 * Prevents cascading failures by detecting service degradation and temporarily disabling calls
 */

export enum CircuitState {
  CLOSED = "CLOSED",   // Normal operation
  OPEN = "OPEN",       // Circuit is open, calls are blocked
  HALF_OPEN = "HALF_OPEN", // Testing if service has recovered
}

export interface CircuitBreakerOptions {
  /** Number of failures before opening the circuit */
  failureThreshold?: number;
  /** Time window for failure counting (ms) */
  failureWindow?: number;
  /** How long to keep circuit open (ms) */
  recoveryTimeout?: number;
  /** Number of successful calls to close circuit in half-open state */
  successThreshold?: number;
  /**
   * Decides whether an error counts toward opening the circuit. Defaults to
   * counting every error. Use this to ignore failures that say the *request* was
   * wrong rather than that the dependency is unhealthy — see
   * `isHttpServiceFailure`.
   */
  isFailure?: (error: unknown) => boolean;
}

export class CircuitBreaker {
  private state: CircuitState;
  private failures: number[];
  private lastFailureTime: number;
  private successCount: number;
  private options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.state = CircuitState.CLOSED;
    this.failures = [];
    this.lastFailureTime = 0;
    this.successCount = 0;
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      failureWindow: options.failureWindow ?? 60000, // 1 minute
      recoveryTimeout: options.recoveryTimeout ?? 30000, // 30 seconds
      successThreshold: options.successThreshold ?? 2,
      isFailure: options.isFailure ?? (() => true),
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error("Circuit breaker is OPEN - service unavailable");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failures = [];
        this.successCount = 0;
      }
    } else {
      // Clear recent failures on success
      const now = Date.now();
      this.failures = this.failures.filter(
        timestamp => now - timestamp < this.options.failureWindow
      );
    }
  }

  /**
   * Handle failed execution.
   *
   * Errors rejected by `isFailure` still propagate to the caller — they just do
   * not count toward opening the circuit.
   */
  private onFailure(error: unknown): void {
    if (!this.options.isFailure(error)) return;

    const now = Date.now();
    this.failures.push(now);
    this.lastFailureTime = now;

    // Clean up old failures
    this.failures = this.failures.filter(
      timestamp => now - timestamp < this.options.failureWindow
    );

    // Check if we should open the circuit
    if (this.failures.length >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  /**
   * Check if we should attempt to reset the circuit
   */
  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime > this.options.recoveryTimeout;
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get current failure count
   */
  getFailureCount(): number {
    const now = Date.now();
    this.failures = this.failures.filter(
      timestamp => now - timestamp < this.options.failureWindow
    );
    return this.failures.length;
  }

  /**
   * Manually reset the circuit to closed state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = [];
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

/**
 * Decides whether an HTTP-shaped error means the service is unhealthy.
 *
 * A 4xx means the request was rejected — a bad credential, a missing route, a
 * malformed payload — and the service is answering perfectly well. Counting those
 * is actively harmful: one wrong API key would trip the breaker and then fail
 * every *unrelated* Database call with "Circuit breaker is OPEN" for the whole
 * recovery window, hiding the real error behind a misleading one.
 *
 * 408, 425 and 429 are the exceptions. Those are transient conditions that do
 * indicate the service is under strain, so they still count.
 *
 * Errors with no numeric status (DNS failure, connection refused, timeout) are
 * treated as service failures.
 */
export function isHttpServiceFailure(error: unknown): boolean {
  const status = (error as { status?: unknown } | null | undefined)?.status;
  if (typeof status !== "number") return true;
  if (status >= 400 && status < 500) {
    return status === 408 || status === 425 || status === 429;
  }
  return true;
}

/**
 * Global circuit breakers for different services
 */
export const globalCircuitBreakers = {
  // Database API circuit breaker
  database: new CircuitBreaker({
    failureThreshold: 5,
    failureWindow: 60000, // 1 minute
    recoveryTimeout: 30000, // 30 seconds
    successThreshold: 2,
    isFailure: isHttpServiceFailure,
  }),

  // Discord API circuit breaker
  discord: new CircuitBreaker({
    failureThreshold: 3,
    failureWindow: 60000, // 1 minute
    recoveryTimeout: 60000, // 1 minute
    successThreshold: 3,
  }),

  // External API circuit breaker
  external: new CircuitBreaker({
    failureThreshold: 2,
    failureWindow: 30000, // 30 seconds
    recoveryTimeout: 60000, // 1 minute
    successThreshold: 1,
  }),
};
