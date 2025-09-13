export interface ValidationRule<T = unknown> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export type ValidationSchema<T = Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};
