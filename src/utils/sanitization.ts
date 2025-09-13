export class SanitizationUtils {
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  static sanitizeHtml(input: string): string {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  }

  static sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const sanitized = {} as T;

    for (const [key, value] of Object.entries(obj)) {
      // Check if key contains sensitive information
      if (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('key')
      ) {
        sanitized[key as keyof T] = '***' as T[keyof T];
      } else if (typeof value === 'string') {
        sanitized[key as keyof T] = this.sanitizeString(value) as T[keyof T];
      } else if (Array.isArray(value)) {
        sanitized[key as keyof T] = value.map((item) =>
          typeof item === 'string'
            ? this.sanitizeString(item)
            : item && typeof item === 'object'
              ? this.sanitizeObject(item as Record<string, unknown>)
              : item,
        ) as T[keyof T];
      } else if (value && typeof value === 'object') {
        sanitized[key as keyof T] = this.sanitizeObject(
          value as Record<string, unknown>,
        ) as T[keyof T];
      } else {
        sanitized[key as keyof T] = value as T[keyof T];
      }
    }

    return sanitized;
  }
}
