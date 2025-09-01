import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCurrentUser } from 'vuefire';
import { useUserPreferencesStore } from 'src/stores/user-preferences-store';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  'en-US': 'English',
  'en-ES': 'Español',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Language management composable
 * Handles browser language detection and user preference override
 */
export function useLanguage() {
  const { locale } = useI18n();
  const user = useCurrentUser();
  const userPreferencesStore = useUserPreferencesStore();

  const loading = ref(false);

  /**
   * Detect browser's preferred language
   * Falls back to 'en-US' if browser language is not supported
   */
  const detectBrowserLanguage = (): SupportedLanguage => {
    const browserLang = navigator.language;
    const browserLangShort = browserLang.split('-')[0];

    // Direct match with supported languages
    if (browserLang in SUPPORTED_LANGUAGES) {
      return browserLang as SupportedLanguage;
    }

    // Check for language variants (e.g., 'es-MX' -> 'en-ES')
    if (browserLangShort === 'es') {
      return 'en-ES';
    }

    // Default to English for unsupported languages
    return 'en-US';
  };

  /**
   * Get the user's preferred language
   * Returns user preference if logged in, otherwise browser language
   */
  const getPreferredLanguage = (): SupportedLanguage => {
    if (user.value && userPreferencesStore.preferences?.preferredLanguage) {
      return userPreferencesStore.preferences.preferredLanguage as SupportedLanguage;
    }
    return detectBrowserLanguage();
  };

  /**
   * Set the current language
   * Updates i18n locale and saves to user preferences if authenticated
   * Always saves to localStorage for development resilience
   */
  const setLanguage = async (language: SupportedLanguage) => {
    loading.value = true;

    try {
      // Update i18n locale immediately
      locale.value = language;

      // Always save to localStorage for development persistence and performance
      localStorage.setItem('ttg-preferred-language', language);

      // Save to user preferences if authenticated
      if (user.value) {
        await userPreferencesStore.updateLanguagePreference(language);
      }
    } catch (error) {
      console.error('Failed to set language:', error);
      // Even if Firebase fails, localStorage should still work
      localStorage.setItem('ttg-preferred-language', language);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Initialize language on app startup
   * Checks user preference > localStorage > browser language
   * Prioritizes localStorage during development to prevent hot-reload resets
   */
  const initializeLanguage = async () => {
    let targetLanguage: SupportedLanguage;

    // First, always check localStorage for saved preference to prevent dev resets
    const savedLanguage = localStorage.getItem('ttg-preferred-language') as SupportedLanguage;
    if (savedLanguage && savedLanguage in SUPPORTED_LANGUAGES) {
      targetLanguage = savedLanguage;
    } else if (user.value) {
      // User is authenticated - check their preferences
      await userPreferencesStore.loadPreferences();
      targetLanguage = getPreferredLanguage();
    } else {
      // Fall back to browser detection only if no saved preference
      targetLanguage = detectBrowserLanguage();
    }

    locale.value = targetLanguage;
  };

  // Current language information
  const currentLanguage = computed(() => locale.value as SupportedLanguage);
  const currentLanguageName = computed(() => SUPPORTED_LANGUAGES[currentLanguage.value]);
  const availableLanguages = computed(() =>
    Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
      value: code,
      label: name,
    })),
  );

  // Watch for user authentication changes
  watch(user, async (newUser) => {
    if (newUser) {
      // User just logged in - load their language preference
      await userPreferencesStore.loadPreferences();
      const userLanguage = userPreferencesStore.preferences?.preferredLanguage;
      if (userLanguage && userLanguage in SUPPORTED_LANGUAGES) {
        locale.value = userLanguage;
      }
    } else {
      // User logged out - revert to browser/localStorage language
      const savedLanguage = localStorage.getItem('ttg-preferred-language') as SupportedLanguage;
      if (savedLanguage && savedLanguage in SUPPORTED_LANGUAGES) {
        locale.value = savedLanguage;
      } else {
        locale.value = detectBrowserLanguage();
      }
    }
  });

  return {
    currentLanguage,
    currentLanguageName,
    availableLanguages,
    loading,
    setLanguage,
    initializeLanguage,
    detectBrowserLanguage,
    getPreferredLanguage,
    SUPPORTED_LANGUAGES,
  };
}
