import { ref } from 'vue';
import type { LogLevel, LogEntry, LoggerConfig } from 'src/types/logging';

class Logger {
  private config: LoggerConfig;
  private sessionId: string;
  private userId = ref<string | null>(null);

  constructor(config: LoggerConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
  }

  setUserId(userId: string | null): void {
    this.userId.value = userId;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private sanitizeData(data: unknown): unknown {
    if (typeof data === 'string') {
      // Remove potential sensitive information
      return data
        .replace(/password[=:]\s*[^\s&]+/gi, 'password=***')
        .replace(/token[=:]\s*[^\s&]+/gi, 'token=***')
        .replace(/key[=:]\s*[^\s&]+/gi, 'key=***');
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    if (data && typeof data === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (
          key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('key')
        ) {
          sanitized[key] = '***';
        } else {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  private createLogEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      data: data ? (this.sanitizeData(data) as Record<string, unknown>) : undefined,
      timestamp: new Date(),
      userId: this.userId.value || undefined,
      sessionId: this.sessionId,
    };
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) {
      return;
    }

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Don't log remote logging errors to avoid infinite loops
      console.error('Failed to send log to remote endpoint:', error);
    }
  }

  debug(message: string, data?: unknown): void {
    if (!this.shouldLog('debug')) return;

    const entry = this.createLogEntry('debug', message, data);

    if (this.config.enableConsole) {
      console.debug(`[DEBUG] ${message}`, data);
    }

    void this.sendToRemote(entry);
  }

  info(message: string, data?: unknown): void {
    if (!this.shouldLog('info')) return;

    const entry = this.createLogEntry('info', message, data);

    if (this.config.enableConsole) {
      console.info(`[INFO] ${message}`, data);
    }

    void this.sendToRemote(entry);
  }

  warn(message: string, data?: unknown): void {
    if (!this.shouldLog('warn')) return;

    const entry = this.createLogEntry('warn', message, data);

    if (this.config.enableConsole) {
      console.warn(`[WARN] ${message}`, data);
    }

    void this.sendToRemote(entry);
  }

  error(message: string, error?: Error, data?: unknown): void {
    if (!this.shouldLog('error')) return;

    const errorData =
      error instanceof Error
        ? { message: error.message, stack: error.stack, name: error.name }
        : error;

    const errorPayload = data
      ? { error: errorData, ...(data as Record<string, unknown>) }
      : { error: errorData };
    const entry = this.createLogEntry('error', message, errorPayload);

    if (this.config.enableConsole) {
      console.error(`[ERROR] ${message}`, error, data);
    }

    void this.sendToRemote(entry);
  }
}

// Create logger instance with environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = new Logger({
  level: isDevelopment ? 'debug' : 'error',
  enableConsole: isDevelopment,
  enableRemote: !isDevelopment,
  remoteEndpoint: isDevelopment ? undefined : '/api/logs',
});

export default logger;
