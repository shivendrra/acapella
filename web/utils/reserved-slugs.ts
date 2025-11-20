// This list prevents usernames from conflicting with application routes.
// It should be checked both on the client-side (for immediate feedback)
// and server-side (for security) during username creation/changes.

export const RESERVED_SLUGS: Set<string> = new Set([
  'login',
  'discover',
  'songs',
  'albums',
  'artists',
  'settings',
  'admin',
  'apply-for-admin',
  'profile',
  'search',
  'library',
  'api',
  'legal',
  'privacy',
  'terms',
  'contact',
  'about',
  'help',
  'new',
  'popular',
  'trending',
  'curator-program',
]);