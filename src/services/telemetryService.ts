/**
 * Anusandhan - Observability & Telemetry Client
 * Sentry-compatible zero-overhead error tracking and performance monitoring.
 * Falls back to structured browser telemetry when SENTRY_DSN is not configured.
 */

interface ErrorContext {
  component?: string;
  action?: string;
  studentId?: string;
  metadata?: Record<string, unknown>;
}

interface PerformanceMetric {
  name: string;
  durationMs: number;
  timestamp: string;
}

class TelemetryClient {
  private dsn: string | null = null;
  private enabled: boolean = true;
  private metrics: PerformanceMetric[] = [];

  constructor() {
    this.dsn = (import.meta as any).env?.VITE_SENTRY_DSN || null;
    this.initGlobalHandlers();
  }

  private initGlobalHandlers() {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.captureException(event.error || new Error(event.message), {
        component: 'window.onerror',
        metadata: { filename: event.filename, lineno: event.lineno, colno: event.colno }
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(event.reason || new Error('Unhandled Promise Rejection'), {
        component: 'unhandledrejection'
      });
    });
  }

  public captureException(error: Error | unknown, context?: ErrorContext): void {
    if (!this.enabled) return;

    const errorPayload = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      context
    };

    if (this.dsn) {
      // In production with Sentry configured, send beacon
      try {
        navigator.sendBeacon?.(
          `https://${this.dsn}@sentry.io/api/events`,
          JSON.stringify(errorPayload)
        );
      } catch {
        // Silent fallback
      }
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn('[Telemetry] Captured non-fatal event:', errorPayload);
    }
  }

  public recordMetric(name: string, durationMs: number): void {
    const metric = { name, durationMs, timestamp: new Date().toISOString() };
    this.metrics.push(metric);
    if (this.metrics.length > 50) {
      this.metrics.shift();
    }
  }

  public getRecentMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

export const telemetry = new TelemetryClient();
