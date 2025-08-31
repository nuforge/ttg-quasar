/**
 * Generate URL-safe slug from title
 */
export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate full SEO-friendly URL for event
 */
export function createEventUrl(firebaseDocId: string, title: string): string {
  const slug = createSlug(title);
  return `/events/${firebaseDocId}/${slug}`;
}

/**
 * Generate full SEO-friendly URL for game
 */
export function createGameUrl(firebaseDocId: string, title: string): string {
  const slug = createSlug(title);
  return `/games/${firebaseDocId}/${slug}`;
}
