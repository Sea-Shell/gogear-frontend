import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TokenType = 'Bearer' | 'Basic' | 'Custom';

export interface AuthUser {
  id?: number | string;
  email?: string;
  name?: string;
  isAdmin?: boolean;
}

export interface ConfigState {
  baseUrl: string;
  apiPrefix: string;
  apiKey?: string;
  accessToken?: string;
  tokenType: TokenType;
  tokenExpiresAt?: number;
  customHeaderName: string;
  googleClientId: string;
  user?: AuthUser;
  hydrated: boolean;
  gearListLimit: number;
  setBaseUrl: (baseUrl: string) => void;
  setApiPrefix: (prefix: string) => void;
  setApiKey: (apiKey?: string) => void;
  setToken: (token?: string, tokenType?: TokenType) => void;
  setCustomHeaderName: (name: string) => void;
  setGoogleClientId: (id: string) => void;
  setGearListLimit: (limit: number) => void;
  setAuthResult: (payload: { accessToken?: string; tokenType?: TokenType; user?: AuthUser; expiresAt?: number | null }) => void;
  logout: () => void;
  reset: () => void;
  setHydrated: (hydrated: boolean) => void;
}

const RAW_ENV_BASE_URL = (import.meta.env?.VITE_GOGEAR_API_BASE_URL ?? '').trim();
const RAW_ENV_API_PREFIX = (import.meta.env?.VITE_GOGEAR_API_PREFIX ?? '').trim();
const RAW_ENV_GOOGLE_CLIENT_ID = (import.meta.env?.VITE_GOOGLE_CLIENT_ID ?? '').trim();

const DEFAULT_BASE_URL = RAW_ENV_BASE_URL;
const DEFAULT_API_PREFIX = RAW_ENV_API_PREFIX || '/api/v1';
const DEFAULT_GOOGLE_CLIENT_ID = RAW_ENV_GOOGLE_CLIENT_ID;
const DEFAULT_GEAR_LIST_LIMIT = 50;

export const ENV_CONFIG_LOCKS = {
  baseUrl: RAW_ENV_BASE_URL.length > 0,
  apiPrefix: RAW_ENV_API_PREFIX.length > 0,
  googleClientId: RAW_ENV_GOOGLE_CLIENT_ID.length > 0
};

const sanitizePrefix = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  const withoutEdgeSlashes = trimmed.replace(/^\/+/, '').replace(/\/+$/, '');
  return withoutEdgeSlashes ? `/${withoutEdgeSlashes}` : '';
};

const extractBaseConfiguration = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { baseUrl: '', derivedPrefix: undefined };
  }

  const parsed = parseBaseUrl(trimmed);
  if (!parsed) {
    return { baseUrl: trimmed, derivedPrefix: undefined };
  }

  const derivedPrefix = sanitizePrefix(parsed.pathname);

  return {
    baseUrl: trimmed,
    derivedPrefix: derivedPrefix || undefined
  };
};

const parseBaseUrl = (value: string): URL | undefined => {
  const candidates = [value, withDefaultScheme(value)];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return new URL(candidate);
    } catch {
      continue;
    }
  }

  return undefined;
};

const withDefaultScheme = (value: string) => {
  const absolutePattern = /^[a-zA-Z][a-zA-Z\d+-.]*:\/\//;
  if (!value || absolutePattern.test(value)) {
    return value;
  }

  if (value.startsWith('//')) {
    return `http:${value}`;
  }

  const hostLikePattern = /^[\w.-]+(?::\d+)?(?:\/.*)?$/;
  if (hostLikePattern.test(value)) {
    return `http://${value}`;
  }

  return value;
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      baseUrl: DEFAULT_BASE_URL,
      apiPrefix: sanitizePrefix(DEFAULT_API_PREFIX),
      apiKey: undefined,
      accessToken: undefined,
      tokenType: 'Bearer',
      tokenExpiresAt: undefined,
      customHeaderName: 'X-API-Key',
      googleClientId: DEFAULT_GOOGLE_CLIENT_ID,
      user: undefined,
      hydrated: false,
      gearListLimit: DEFAULT_GEAR_LIST_LIMIT,
      setBaseUrl: (baseUrl: string) =>
        set(() => {
          const { baseUrl: nextBase, derivedPrefix } = extractBaseConfiguration(baseUrl);
          const updates: Partial<ConfigState> = { baseUrl: nextBase };
          if (derivedPrefix !== undefined) {
            updates.apiPrefix = derivedPrefix;
          }
          return updates;
        }),
      setApiPrefix: (apiPrefix: string) => set({ apiPrefix: sanitizePrefix(apiPrefix) }),
      setApiKey: (apiKey?: string) => set({ apiKey }),
      setToken: (accessToken?: string, tokenType: TokenType = 'Bearer') =>
        set({ accessToken: accessToken || undefined, tokenType, user: undefined, tokenExpiresAt: undefined }),
      setCustomHeaderName: (customHeaderName: string) => set({ customHeaderName }),
      setGoogleClientId: (googleClientId: string) => set({ googleClientId }),
      setGearListLimit: (limit: number) =>
        set({ gearListLimit: Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : DEFAULT_GEAR_LIST_LIMIT }),
      setAuthResult: ({ accessToken, tokenType = 'Bearer', user, expiresAt }) =>
        set({
          accessToken: accessToken || undefined,
          tokenType,
          user,
          tokenExpiresAt: expiresAt ?? undefined
        }),
      logout: () =>
        set({
          accessToken: undefined,
          tokenType: 'Bearer',
          user: undefined,
          tokenExpiresAt: undefined
        }),
      reset: () =>
        set({
          baseUrl: DEFAULT_BASE_URL,
          apiPrefix: sanitizePrefix(DEFAULT_API_PREFIX),
          apiKey: undefined,
          accessToken: undefined,
          tokenType: 'Bearer',
          tokenExpiresAt: undefined,
          customHeaderName: 'X-API-Key',
          googleClientId: DEFAULT_GOOGLE_CLIENT_ID,
          user: undefined,
          gearListLimit: DEFAULT_GEAR_LIST_LIMIT
        }),
      setHydrated: (hydrated: boolean) => set({ hydrated })
    }),
    {
      name: 'gogear-console-config',
      partialize: (state) => ({
        baseUrl: state.baseUrl,
        apiPrefix: state.apiPrefix,
        apiKey: state.apiKey,
        accessToken: state.accessToken,
        tokenType: state.tokenType,
        tokenExpiresAt: state.tokenExpiresAt,
        customHeaderName: state.customHeaderName,
        googleClientId: state.googleClientId,
        user: state.user,
        gearListLimit: state.gearListLimit
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate GoGear config store', error);
        }
        try {
          if (state) {
            if (state.baseUrl) {
              state.setBaseUrl(state.baseUrl);
            }
            if (state.apiPrefix) {
              state.setApiPrefix(state.apiPrefix);
            }
            state.setHydrated(true);
            return;
          }
        } catch (rehydrationError) {
          console.error('Error normalizing rehydrated config state', rehydrationError);
        }

        scheduleHydrationFallback();
      }
    }
  )
);

ensureHydrationGuards();

const scheduleHydrationFallback = () => {
  const markHydrated = () => {
    const current = useConfigStore.getState();
    if (!current.hydrated) {
      current.setHydrated(true);
    }
  };

  if (typeof queueMicrotask === 'function') {
    queueMicrotask(markHydrated);
    return;
  }

  void Promise.resolve()
    .then(markHydrated)
    .catch((error) => {
      console.error('Failed to finalize hydration fallback', error);
    });
};

function ensureHydrationGuards() {
  const persistApi = (useConfigStore as typeof useConfigStore & {
    persist?: {
      hasHydrated?: () => boolean;
      onFinishHydration?: (callback: () => void) => void;
    };
  }).persist;

  const markHydrated = () => {
    const current = useConfigStore.getState();
    if (!current.hydrated) {
      current.setHydrated(true);
    }
  };

  if (persistApi?.hasHydrated?.()) {
    markHydrated();
    return;
  }

  persistApi?.onFinishHydration?.(() => {
    markHydrated();
  });

  scheduleHydrationFallback();
}
