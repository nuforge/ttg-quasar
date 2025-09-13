import { logger } from 'src/utils/logger';

export interface MonitoringEvent {
  name: string;
  properties?: Record<string, unknown> | undefined;
  timestamp?: Date | undefined;
  userId?: string | undefined;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  userId?: string | undefined;
}

export interface ErrorReport {
  message: string;
  stack?: string | undefined;
  context?: string | undefined;
  userId?: string | undefined;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class MonitoringService {
  private static instance: MonitoringService;
  private events: MonitoringEvent[] = [];
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorReport[] = [];

  private constructor() {
    // Initialize monitoring
    this.setupPerformanceMonitoring();
    this.setupErrorHandling();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // Event tracking
  trackEvent(eventName: string, properties?: Record<string, unknown>, userId?: string): void {
    const event: MonitoringEvent = {
      name: eventName,
      properties: this.sanitizeProperties(properties),
      timestamp: new Date(),
      userId,
    };

    this.events.push(event);

    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    logger.info('Event tracked', { eventName, properties, userId });

    // Send to analytics service if available
    this.sendToAnalytics(event);
  }

  // Performance monitoring
  trackPerformance(metricName: string, value: number, unit: string, userId?: string): void {
    const metric: PerformanceMetric = {
      name: metricName,
      value,
      unit,
      timestamp: new Date(),
      userId,
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    logger.debug('Performance metric tracked', { metricName, value, unit, userId });
  }

  // Error tracking
  trackError(
    error: Error | string,
    context?: string,
    userId?: string,
    severity: ErrorReport['severity'] = 'medium',
  ): void {
    const errorReport: ErrorReport = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context,
      userId,
      timestamp: new Date(),
      severity,
    };

    this.errors.push(errorReport);

    // Keep only last 1000 errors in memory
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000);
    }

    const errorObj = typeof error === 'string' ? new Error(error) : error;
    logger.error('Error tracked', errorObj, { context, userId, severity });

    // Send to error tracking service if available
    this.sendToErrorTracking(errorReport);
  }

  // User behavior tracking
  trackUserAction(action: string, target?: string, userId?: string): void {
    this.trackEvent(
      'user_action',
      {
        action,
        target,
        timestamp: new Date().toISOString(),
      },
      userId,
    );
  }

  trackPageView(page: string, userId?: string): void {
    this.trackEvent(
      'page_view',
      {
        page,
        timestamp: new Date().toISOString(),
      },
      userId,
    );
  }

  trackFeatureUsage(feature: string, userId?: string): void {
    this.trackEvent(
      'feature_usage',
      {
        feature,
        timestamp: new Date().toISOString(),
      },
      userId,
    );
  }

  // Performance timing
  startTimer(name: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.trackPerformance(name, duration, 'ms');
    };
  }

  // Memory usage tracking
  trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (
        performance as {
          memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
        }
      ).memory;
      this.trackPerformance('memory_used', memory.usedJSHeapSize, 'bytes');
      this.trackPerformance('memory_total', memory.totalJSHeapSize, 'bytes');
      this.trackPerformance('memory_limit', memory.jsHeapSizeLimit, 'bytes');
    }
  }

  // Get monitoring data
  getEvents(): MonitoringEvent[] {
    return [...this.events];
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  getStats(): {
    totalEvents: number;
    totalMetrics: number;
    totalErrors: number;
    recentErrors: number;
  } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = this.errors.filter((error) => error.timestamp > oneHourAgo).length;

    return {
      totalEvents: this.events.length,
      totalMetrics: this.metrics.length,
      totalErrors: this.errors.length,
      recentErrors,
    };
  }

  // Private methods
  private sanitizeProperties(
    properties?: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (!properties) return undefined;

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(properties)) {
      // Remove sensitive data
      if (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('key')
      ) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private setupPerformanceMonitoring(): void {
    // Monitor page load performance
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType(
            'navigation',
          )[0] as PerformanceNavigationTiming;
          if (navigation) {
            this.trackPerformance(
              'page_load_time',
              navigation.loadEventEnd - navigation.fetchStart,
              'ms',
            );
            this.trackPerformance(
              'dom_content_loaded',
              navigation.domContentLoadedEventEnd - navigation.fetchStart,
              'ms',
            );
            this.trackPerformance(
              'first_paint',
              navigation.responseEnd - navigation.fetchStart,
              'ms',
            );
          }
        }, 0);
      });

      // Monitor memory usage periodically
      setInterval(() => {
        this.trackMemoryUsage();
      }, 60000); // Every minute
    }
  }

  private setupErrorHandling(): void {
    if (typeof window !== 'undefined') {
      // Global error handler
      window.addEventListener('error', (event) => {
        this.trackError(event.error || event.message, 'global_error', undefined, 'high');
      });

      // Unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError(event.reason, 'unhandled_promise_rejection', undefined, 'high');
      });
    }
  }

  private sendToAnalytics(event: MonitoringEvent): void {
    // Send to Google Analytics if available
    if (
      typeof (
        window as {
          gtag?: (command: string, eventName: string, parameters?: Record<string, unknown>) => void;
        }
      ).gtag !== 'undefined'
    ) {
      (
        window as unknown as {
          gtag: (command: string, eventName: string, parameters?: Record<string, unknown>) => void;
        }
      ).gtag('event', event.name, event.properties);
    }

    // Send to custom analytics endpoint
    void this.sendToEndpoint('/api/analytics', event);
  }

  private sendToErrorTracking(error: ErrorReport): void {
    // Send to error tracking service
    void this.sendToEndpoint('/api/errors', error);
  }

  private async sendToEndpoint(endpoint: string, data: unknown): Promise<void> {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send monitoring data', errorObj, { endpoint });
    }
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();

// Export convenience functions
export const trackEvent = (
  eventName: string,
  properties?: Record<string, unknown>,
  userId?: string,
) => {
  monitoringService.trackEvent(eventName, properties, userId);
};

export const trackError = (
  error: Error | string,
  context?: string,
  userId?: string,
  severity?: ErrorReport['severity'],
) => {
  monitoringService.trackError(error, context, userId, severity);
};

export const trackPerformance = (
  metricName: string,
  value: number,
  unit: string,
  userId?: string,
) => {
  monitoringService.trackPerformance(metricName, value, unit, userId);
};

export const trackUserAction = (action: string, target?: string, userId?: string) => {
  monitoringService.trackUserAction(action, target, userId);
};

export const trackPageView = (page: string, userId?: string) => {
  monitoringService.trackPageView(page, userId);
};

export const trackFeatureUsage = (feature: string, userId?: string) => {
  monitoringService.trackFeatureUsage(feature, userId);
};

export const startTimer = (name: string) => {
  return monitoringService.startTimer(name);
};

export default monitoringService;
