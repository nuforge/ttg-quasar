import type { ValidationRule, ValidationResult, ValidationSchema } from 'src/types/validation';
import { SanitizationUtils } from 'src/utils/sanitization';

export class ValidationService {
  static validate<T extends Record<string, unknown>>(
    data: T,
    schema: ValidationSchema<T>,
  ): ValidationResult {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      if (!rules) continue;

      const value = data[field as keyof T];

      for (const rule of rules) {
        if (!rule.validate(value)) {
          errors.push(`${field}: ${rule.message}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static sanitizeAndValidate<T extends Record<string, unknown>>(
    data: T,
    schema: ValidationSchema<T>,
  ): { data: T; result: ValidationResult } {
    const sanitizedData = SanitizationUtils.sanitizeObject(data);
    const result = this.validate(sanitizedData, schema);

    return {
      data: sanitizedData,
      result,
    };
  }

  // Common validation rules
  static rules = {
    required: <T>(message = 'This field is required'): ValidationRule<T> => ({
      validate: (value: T) => value !== null && value !== undefined && value !== '',
      message,
    }),

    minLength: (min: number, message?: string): ValidationRule<string> => ({
      validate: (value: string) => value.length >= min,
      message: message || `Must be at least ${min} characters long`,
    }),

    maxLength: (max: number, message?: string): ValidationRule<string> => ({
      validate: (value: string) => value.length <= max,
      message: message || `Must be no more than ${max} characters long`,
    }),

    email: (message = 'Invalid email format'): ValidationRule<string> => ({
      validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message,
    }),

    url: (message = 'Invalid URL format'): ValidationRule<string> => ({
      validate: (value: string) => {
        try {
          const url = new URL(value);
          // Only allow http and https protocols
          return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
          return false;
        }
      },
      message,
    }),

    number: (message = 'Must be a valid number'): ValidationRule<unknown> => ({
      validate: (value: unknown) => typeof value === 'number' && !isNaN(value),
      message,
    }),

    positiveNumber: (message = 'Must be a positive number'): ValidationRule<number> => ({
      validate: (value: number) => value > 0,
      message,
    }),

    date: (message = 'Invalid date format'): ValidationRule<string> => ({
      validate: (value: string) => {
        const date = new Date(value);
        return !isNaN(date.getTime()) && date.toISOString().startsWith(value.substring(0, 10));
      },
      message,
    }),

    futureDate: (message = 'Date must be in the future'): ValidationRule<string> => ({
      validate: (value: string) => new Date(value) > new Date(),
      message,
    }),
  };

  // Model-specific validation schemas
  static schemas = {
    player: {
      name: [
        this.rules.required('Player name is required'),
        this.rules.minLength(2, 'Name must be at least 2 characters'),
        this.rules.maxLength(50, 'Name must be no more than 50 characters'),
      ],
      email: [this.rules.required('Email is required'), this.rules.email()],
      bio: [this.rules.maxLength(500, 'Bio must be no more than 500 characters')],
    },

    event: {
      title: [
        this.rules.required('Event title is required'),
        this.rules.minLength(3, 'Title must be at least 3 characters'),
        this.rules.maxLength(100, 'Title must be no more than 100 characters'),
      ],
      date: [this.rules.required('Event date is required'), this.rules.date()],
      time: [this.rules.required('Event time is required')],
      location: [
        this.rules.required('Event location is required'),
        this.rules.minLength(3, 'Location must be at least 3 characters'),
        this.rules.maxLength(200, 'Location must be no more than 200 characters'),
      ],
      minPlayers: [
        this.rules.required('Minimum players is required'),
        this.rules.positiveNumber('Minimum players must be positive'),
      ],
      maxPlayers: [
        this.rules.required('Maximum players is required'),
        this.rules.positiveNumber('Maximum players must be positive'),
      ],
      description: [this.rules.maxLength(1000, 'Description must be no more than 1000 characters')],
    },

    game: {
      title: [
        this.rules.required('Game title is required'),
        this.rules.minLength(3, 'Title must be at least 3 characters'),
        this.rules.maxLength(100, 'Title must be no more than 100 characters'),
      ],
      genre: [
        this.rules.required('Game genre is required'),
        this.rules.minLength(2, 'Genre must be at least 2 characters'),
        this.rules.maxLength(50, 'Genre must be no more than 50 characters'),
      ],
      description: [
        this.rules.required('Game description is required'),
        this.rules.minLength(10, 'Description must be at least 10 characters'),
        this.rules.maxLength(2000, 'Description must be no more than 2000 characters'),
      ],
      link: [this.rules.url('Invalid game link format')],
    },
  };
}
