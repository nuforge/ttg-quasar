export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown> | undefined;
  timestamp: Date;
  userId?: string | undefined;
  sessionId?: string | undefined;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string | undefined;
}
