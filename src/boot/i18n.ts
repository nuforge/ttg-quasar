import { defineBoot } from '#q-app/wrappers';
import { createI18n } from 'vue-i18n';

import messages from 'src/i18n';

export type MessageLanguages = keyof typeof messages;
// Type-define 'en-US' as the master schema for the resource
export type MessageSchema = (typeof messages)['en-US'];

// See https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  // define the locale messages schema
  export interface DefineLocaleMessage extends MessageSchema {}

  // define the datetime format schema
  export interface DefineDateTimeFormat {}

  // define the number format schema
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

/**
 * Detect browser's preferred language
 * Falls back to 'en-US' if browser language is not supported
 */
function detectBrowserLanguage(): MessageLanguages {
  const browserLang = navigator.language;
  const browserLangShort = browserLang.split('-')[0];

  // Direct match with supported languages
  if (browserLang in messages) {
    return browserLang as MessageLanguages;
  }

  // Check for language variants (e.g., 'es-MX' -> 'en-ES')
  if (browserLangShort === 'es') {
    return 'en-ES';
  }

  // Default to English for unsupported languages
  return 'en-US';
}

/**
 * Get initial locale considering localStorage and browser preferences
 * Prioritizes saved preferences over browser detection
 */
function getInitialLocale(): MessageLanguages {
  // Always check localStorage first for previously saved preference
  try {
    const savedLanguage = localStorage.getItem('ttg-preferred-language') as MessageLanguages;
    if (savedLanguage && savedLanguage in messages) {
      console.debug('Using saved language preference:', savedLanguage);
      return savedLanguage;
    }
  } catch (error) {
    console.warn('Failed to read from localStorage:', error);
  }

  // Only fall back to browser language detection if no saved preference
  const browserLanguage = detectBrowserLanguage();
  console.debug('Using browser detected language:', browserLanguage);
  return browserLanguage;
}

export default defineBoot(({ app }) => {
  const i18n = createI18n<{ message: MessageSchema }, MessageLanguages>({
    locale: getInitialLocale(),
    legacy: false,
    messages,
    modifiers: {
      //snakeCase: (str) => str.split(' ').join('_').toLowerCase(),
    },
    pluralRules: {},
  });

  // Set i18n instance on app
  app.use(i18n);
});
