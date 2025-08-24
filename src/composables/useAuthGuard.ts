import { useCurrentUser } from 'vuefire';
import { computed, watch } from 'vue';
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';

/**
 * Route guard that requires authentication
 * Use this directly in route definitions
 */
export const requireAuth = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const user = useCurrentUser();
  const isAuthenticated = computed(() => !!user.value);
  const isLoading = computed(() => user.value === undefined);

  // If still loading authentication state, wait for it
  if (isLoading.value) {
    const stopWatcher = watch(user, (newUser) => {
      stopWatcher();
      if (newUser) {
        next();
      } else {
        next({
          name: 'login',
          query: {
            redirect: to.fullPath,
            message: 'Please sign in to access this page',
          },
        });
      }
    });
    return;
  }

  if (isAuthenticated.value) {
    next();
  } else {
    next({
      name: 'login',
      query: {
        redirect: to.fullPath,
        message: 'Please sign in to access this page',
      },
    });
  }
};

/**
 * Route guard that redirects authenticated users (e.g., login page)
 * Use this directly in route definitions
 */
export const requireGuest = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const user = useCurrentUser();
  const isAuthenticated = computed(() => !!user.value);
  const isLoading = computed(() => user.value === undefined);

  // If still loading authentication state, wait for it
  if (isLoading.value) {
    const stopWatcher = watch(user, () => {
      stopWatcher();
      requireGuest(to, from, next);
    });
    return;
  }

  if (!isAuthenticated.value) {
    next();
  } else {
    // Redirect to the intended page or home
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/';
    next(redirect);
  }
};

/**
 * Route guard for admin-only routes
 * Use this directly in route definitions
 */
export const requireAdmin = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const user = useCurrentUser();
  const isAuthenticated = computed(() => !!user.value);
  const isLoading = computed(() => user.value === undefined);

  // First check authentication
  if (isLoading.value) {
    const stopWatcher = watch(user, () => {
      stopWatcher();
      requireAdmin(to, from, next);
    });
    return;
  }

  if (!isAuthenticated.value) {
    next({
      name: 'login',
      query: {
        redirect: to.fullPath,
        message: 'Admin access required',
      },
    });
    return;
  }

  // TODO: Implement admin checking logic
  // For now, allow all authenticated users
  // You could check user.value.email against admin emails
  // or check custom claims: user.value.getIdTokenResult().then(token => token.claims.admin)
  next();
};

/**
 * Composable for authentication-based route guards using VueFire
 * Use this in components, not at module level
 */
export function useAuthGuard() {
  const user = useCurrentUser();

  const isAuthenticated = computed(() => !!user.value);
  const isLoading = computed(() => user.value === undefined);

  return {
    user,
    isAuthenticated,
    isLoading,
    requireAuth,
    requireGuest,
    requireAdmin,
  };
}
