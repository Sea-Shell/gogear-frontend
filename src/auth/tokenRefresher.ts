import { AuthApi } from '../api/endpoints';
import { ApiClientError } from '../api/client';
import { useConfigStore, type TokenType } from '../store/configStore';

const REFRESH_SKEW_MS = 60_000;
const MIN_REFRESH_DELAY_MS = 5_000;
const RETRY_DELAY_MS = 30_000;

let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
let unsubscribeStore: (() => void) | null = null;
let inFlight: Promise<void> | null = null;

export function initAuthTokenRefresh() {
  if (unsubscribeStore) {
    return;
  }

  const state = useConfigStore.getState();
  scheduleRefresh({ accessToken: state.accessToken, expiresAt: state.tokenExpiresAt });

  let lastState = { accessToken: state.accessToken, expiresAt: state.tokenExpiresAt };

  unsubscribeStore = useConfigStore.subscribe((storeState) => {
    const nextState = { accessToken: storeState.accessToken, expiresAt: storeState.tokenExpiresAt };

    if (nextState.accessToken !== lastState.accessToken || nextState.expiresAt !== lastState.expiresAt) {
      scheduleRefresh(nextState);
      lastState = nextState;
    }
  });
}

function scheduleRefresh(state: { accessToken?: string; expiresAt?: number }) {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }

  const { accessToken, expiresAt } = state;
  if (!accessToken || !expiresAt) {
    return;
  }

  const now = Date.now();
  const idealRefreshAt = expiresAt - REFRESH_SKEW_MS;

  if (idealRefreshAt <= now) {
    void triggerRefresh();
    return;
  }

  const refreshAt = Math.max(idealRefreshAt, now + MIN_REFRESH_DELAY_MS);
  const delay = refreshAt - now;

  refreshTimeout = setTimeout(() => {
    void triggerRefresh();
  }, delay);
}

async function triggerRefresh() {
  if (inFlight) {
    return inFlight;
  }

  const state = useConfigStore.getState();
  if (!state.accessToken) {
    return;
  }

  const setAuthResult = state.setAuthResult;
  const logout = state.logout;

  inFlight = AuthApi.refresh()
    .then((response) => {
      const expiresAt = response.expires_at ? response.expires_at * 1000 : undefined;
      const expiresFallback = response.expires_in ? Date.now() + response.expires_in * 1000 : undefined;

      setAuthResult({
        accessToken: response.access_token,
        tokenType: normalizeTokenType(response.token_type),
        user: response.user
          ? {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            isAdmin: Boolean(response.user.is_admin)
          }
          : undefined,
        expiresAt: expiresAt ?? expiresFallback ?? null
      });
    })
    .catch((error) => {
      if (error instanceof ApiClientError && error.status === 401) {
        console.warn('Refresh token expired, signing out.');
        logout();
        return;
      }

      console.warn('Failed to refresh access token, retrying shortly.', error);
      scheduleRetry();
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

function normalizeTokenType(value?: string | null): TokenType {
  const normalized = value?.toLowerCase() ?? '';
  if (normalized === 'basic') return 'Basic';
  if (normalized === 'custom') return 'Custom';
  return 'Bearer';
}

function scheduleRetry() {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  refreshTimeout = setTimeout(() => {
    void triggerRefresh();
  }, RETRY_DELAY_MS);
}

export function stopAuthTokenRefresh() {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }
  if (unsubscribeStore) {
    unsubscribeStore();
    unsubscribeStore = null;
  }
  inFlight = null;
}
