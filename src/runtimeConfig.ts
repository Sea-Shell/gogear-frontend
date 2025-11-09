import { useConfigStore } from './store/configStore';

export interface RuntimeConfig {
  baseUrl?: string;
  apiPrefix?: string;
  googleClientId?: string;
}

const CONFIG_ENDPOINT = '/console-config.json';

export async function initRuntimeConfig(): Promise<RuntimeConfig> {
  const config = await fetchRuntimeConfig();
  const applyConfig = () => {
    const state = useConfigStore.getState();

    if (config.baseUrl && !state.baseUrl) {
      state.setBaseUrl(config.baseUrl);
    }

    if (config.apiPrefix && (!state.apiPrefix || state.apiPrefix === '/api/v1')) {
      state.setApiPrefix(config.apiPrefix);
    }

    if (config.googleClientId && !state.googleClientId) {
      state.setGoogleClientId(config.googleClientId);
    }
  };

  if (useConfigStore.getState().hydrated) {
    applyConfig();
  } else {
    const unsubscribe = useConfigStore.subscribe((state, previousState) => {
      if (!previousState?.hydrated && state.hydrated) {
        applyConfig();
        unsubscribe();
      }
    });
  }

  return config;
}

async function fetchRuntimeConfig(): Promise<RuntimeConfig> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const response = await fetch(CONFIG_ENDPOINT, { cache: 'no-store' });
    if (!response.ok) {
      console.warn(`Runtime config request failed with status ${response.status}`);
      return {};
    }

    const data = (await response.json()) as RuntimeConfig | null;
    return data ?? {};
  } catch (error) {
    console.warn('Unable to load runtime config.', error);
    return {};
  }
}
