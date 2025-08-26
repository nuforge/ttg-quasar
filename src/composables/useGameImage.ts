import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';

// Cache for loaded images to avoid re-downloading
const imageCache = new Map<string, string>();

export function useGameImage(imageValue: Ref<string | undefined>) {
  const isLoading = ref(false);
  const hasError = ref(false);
  const cachedUrl = ref<string>('');

  /**
   * Determines the correct image URL based on the image value
   * Handles both Firebase Storage URLs and local filenames
   */
  const imageUrl = computed(() => {
    if (!imageValue.value) return '';

    // If it's already a full Firebase Storage URL, use it directly
    if (imageValue.value.startsWith('https://firebasestorage.googleapis.com/')) {
      return imageValue.value;
    }

    // If it's a full HTTP URL, use it directly
    if (imageValue.value.startsWith('http')) {
      return imageValue.value;
    }

    // If it starts with '/', treat as absolute path
    if (imageValue.value.startsWith('/')) {
      return imageValue.value;
    }

    // Otherwise, assume it's a filename in the local games folder
    return `/images/games/${imageValue.value}`;
  });

  /**
   * Gets the cached or computed image URL
   */
  const finalImageUrl = computed(() => {
    if (cachedUrl.value) return cachedUrl.value;
    return imageUrl.value;
  });

  /**
   * Preloads and caches the image
   */
  const preloadImage = async (url: string): Promise<string> => {
    if (!url) return '';

    // Check cache first
    if (imageCache.has(url)) {
      return imageCache.get(url)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        imageCache.set(url, url);
        resolve(url);
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });
  };

  /**
   * Loads the image with caching and error handling
   */
  const loadImage = async () => {
    const url = imageUrl.value;
    if (!url) return;

    isLoading.value = true;
    hasError.value = false;

    try {
      const loadedUrl = await preloadImage(url);
      cachedUrl.value = loadedUrl;
    } catch (error) {
      console.warn('Failed to load game image:', url, error);
      hasError.value = true;

      // Try fallback to default image
      try {
        const fallbackUrl = '/images/games/default.svg';
        const loadedFallback = await preloadImage(fallbackUrl);
        cachedUrl.value = loadedFallback;
        hasError.value = false;
      } catch {
        // If even fallback fails, keep error state
      }
    } finally {
      isLoading.value = false;
    }
  };

  // Watch for changes in image value and reload
  watch(
    imageValue,
    () => {
      cachedUrl.value = '';
      if (imageValue.value) {
        void loadImage();
      }
    },
    { immediate: true },
  );

  return {
    imageUrl: finalImageUrl,
    isLoading,
    hasError,
    loadImage,
    preloadImage,
  };
}

/**
 * Simple helper function to get the correct image URL
 * without reactive behavior - useful for templates
 */
export function getGameImageUrl(imageValue: string | undefined): string {
  if (!imageValue) return '';

  // Firebase Storage URL
  if (imageValue.startsWith('https://firebasestorage.googleapis.com/')) {
    return imageValue;
  }

  // Full HTTP URL
  if (imageValue.startsWith('http')) {
    return imageValue;
  }

  // Absolute path
  if (imageValue.startsWith('/')) {
    return imageValue;
  }

  // Filename only - assume local games folder
  return `/images/games/${imageValue}`;
}
