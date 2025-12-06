import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';

// Cache for loaded images to avoid re-downloading
const imageCache = new Map<string, string>();

/**
 * Gets the base path for the application
 * Works for both localhost and GitHub Pages deployment
 */
function getBasePath(): string {
  // In Vite, import.meta.env.BASE_URL is set to the publicPath
  if (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) {
    return import.meta.env.BASE_URL;
  }

  // Fallback: detect from window location (for GitHub Pages)
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    // Check if we're on GitHub Pages (path starts with /ttg-quasar/)
    if (pathname.startsWith('/ttg-quasar/')) {
      return '/ttg-quasar/';
    }
  }

  // Default to root for local development
  return '/';
}

/**
 * Mapping of game titles to their local image filenames
 * Only includes games that actually have local image files
 */
const titleToImageMap: Record<string, string> = {
  Bananagrams: 'bananagrams.webp',
  'Bears vs Babies': 'bears_vs_babies.webp',
  Boggle: 'boggle.webp',
  Carcassonne: 'carcassonne.webp',
  'Cards Against Humanity': 'cards_against_humanity_bigger_blacker_box.webp',
  Catan: 'catan.webp',
  Chess: 'chess.webp',
  'Clue (Legend of Zelda)': 'clue_legend_of_zelda.webp',
  Codenames: 'codenames.webp',
  Concept: 'concept.webp',
  Coup: 'coup.webp',
  Cranium: 'cranium.webp',
  'Cthulhu Fluxx': 'cthulhu_fluxx.webp',
  Curios: 'curios.webp',
  Decrypto: 'decrypto.webp',
  Dominion: 'dominion.webp',
  'Dungeons & Dragons': 'dungeons_dragons.jpg',
  'Epic Spell Wars: Duel at Mt. Skullzfyre': 'epic_spell_wars.webp',
  'Exploding Kittens': 'exploding_kittens.webp',
  Fluxx: 'fluxx.webp',
  'Fluxx: The Board Game': 'fluxx_the_board_game.webp',
  'Forbidden Island': 'forbidden_island.webp',
  Gloom: 'gloom.webp',
  Hanabi: 'hanabi.webp',
  'In a Pickle': 'in_a_pickle.webp',
  'Joking Hazard': 'joking_hazard.webp',
  'Love Letter': 'love_letter.webp',
  'Magic: The Gathering': 'magic_the_gathering.webp',
  'Mancala (Solid Wood)': 'mancala.webp',
  Munchkin: 'munchkin.webp',
  'Munchkin Gloom': 'munchkin_gloom.webp',
  'My Little Pony CCG': 'my_little_pony_collectible_card_game.webp',
  'One Night Ultimate Werewolf': 'one_night_ultimate_werewolf.webp',
  Pandemic: 'pandemic.webp',
  PDQ: 'pdq.webp',
  'Phase 10': 'phase_10.webp',
  'Phase 10 Twist': 'phase_10_twist.webp',
  'Pictionary Card Game': 'pictionary_card_game.webp',
  'Play on Words': 'play_on_words.webp',
  Qwirkle: 'qwirkle.webp',
  'Rack-O': 'rack-o.webp',
  'Rick & Morty: Anatomy Park': 'rick_and_morty_anatomy_park.webp',
  'Rick & Morty: The Ricks Must Be Crazy': 'rick_and_morty_the_ricks_must_be_crazy.webp',
  'Rick & Morty: Total Rickall': 'rick_and_morty_total_rickall.webp',
  'Say Anything: Family Edition': 'say_anything_family_edition.webp',
  'Scattergories Junior': 'scattergories_junior.webp',
  Scrabble: 'scrabble.webp',
  'Scrabble Slam': 'scrabble_slam.webp',
  'Skip-Bo': 'skip-bo.webp',
  Spaceteam: 'spaceteam.webp',
  'Spot It (Dobble)': 'spot_it.webp',
  'Star Fluxx': 'star_fluxx.webp',
  'Star Trek Adventures': 'star_trek_adventures.jpg',
  'Star Trek CCG': 'star_trek_customizable_card_game.webp',
  'Star Wars CCG': 'star_wars_customizable_card_game.webp',
  'Superfight: The Loot Crate Deck': 'superfight.webp',
  'Sushi Go!': 'sushi_go.webp',
  'Telepathy: Magic Minds': 'telepathy_magic_minds.webp',
  'The Resistance': 'the_resistance.webp',
  'Ticket to Ride': 'ticket_to_ride.webp',
  Tokaido: 'tokaido.webp',
  'Tsuro of the Seas': 'tsuro_of_the_seas.webp',
  'UNO Ultimate (DC Edition)': 'uno_ultimate_dc.webp',
  'Unstable Unicorns': 'unstable_unicorns.webp',
  "We Didn't Playtest This At All": 'we_didnt_playtest_this_at_all.webp',
  'Wheel of Fortune: Card Game': 'wheel_of_fortune_card_game.webp',
  Yahtzee: 'yahtzee.webp',
  Zombicide: 'zombicide.webp',
  'Zombie Dice': 'zombie_dice.webp',
  'Zombie Dice Deluxe': 'zombie_dice_deluxe.webp',
};

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

    // If it starts with '/', treat as absolute path but prepend base path
    if (imageValue.value.startsWith('/')) {
      const basePath = getBasePath();
      // Remove leading slash from the path
      const pathWithoutLeadingSlash = imageValue.value.substring(1);
      // Ensure basePath ends with '/' and path doesn't start with '/'
      const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
      return `${normalizedBasePath}${pathWithoutLeadingSlash}`;
    }

    // Otherwise, assume it's a filename in the local games folder
    const basePath = getBasePath();
    const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
    return `${normalizedBasePath}images/games/${imageValue.value}`;
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
        const basePath = getBasePath();
        const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
        const fallbackUrl = `${normalizedBasePath}images/games/default.svg`;
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
export function getGameImageUrl(imageValue: string | undefined, gameTitle?: string): string {
  // If we have a valid image value, use it
  if (imageValue) {
    // Firebase Storage URL
    if (imageValue.startsWith('https://firebasestorage.googleapis.com/')) {
      return imageValue;
    }

    // Full HTTP URL
    if (imageValue.startsWith('http')) {
      return imageValue;
    }

    // Absolute path - prepend base path
    if (imageValue.startsWith('/')) {
      const basePath = getBasePath();
      // Remove leading slash from the path
      const pathWithoutLeadingSlash = imageValue.substring(1);
      // Ensure basePath ends with '/' and path doesn't start with '/'
      const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
      return `${normalizedBasePath}${pathWithoutLeadingSlash}`;
    }

    // Filename only - assume local games folder
    const basePath = getBasePath();
    const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
    return `${normalizedBasePath}images/games/${imageValue}`;
  }

  // If no image value but we have a game title, try to map it
  if (gameTitle && titleToImageMap[gameTitle]) {
    const basePath = getBasePath();
    const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
    return `${normalizedBasePath}images/games/${titleToImageMap[gameTitle]}`;
  }

  // Fallback to default image
  const basePath = getBasePath();
  const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return `${normalizedBasePath}images/games/default.svg`;
}
