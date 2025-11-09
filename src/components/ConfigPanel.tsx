import { ChangeEvent, useMemo, useState } from 'react';

import { useConfigStore, type ConfigState, type TokenType, ENV_CONFIG_LOCKS } from '../store/configStore';
import { apiRequest } from '../api/client';

type FetchState = 'idle' | 'loading' | 'success' | 'error';

const tokenTypes: TokenType[] = ['Bearer', 'Basic', 'Custom'];

export function ConfigPanel() {
  const { baseUrl, accessToken, tokenType, googleClientId, gearListLimit } = useConfigStore();
  const setBaseUrl = useConfigStore((state: ConfigState) => state.setBaseUrl);
  const apiPrefix = useConfigStore((state: ConfigState) => state.apiPrefix);
  const setApiPrefix = useConfigStore((state: ConfigState) => state.setApiPrefix);
  const setToken = useConfigStore((state: ConfigState) => state.setToken);
  const setGoogleClientId = useConfigStore((state: ConfigState) => state.setGoogleClientId);
  const setGearListLimit = useConfigStore((state: ConfigState) => state.setGearListLimit);
  const reset = useConfigStore((state: ConfigState) => state.reset);

  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [fetchError, setFetchError] = useState<string | null>(null);

  const baseLocked = ENV_CONFIG_LOCKS.baseUrl;
  const prefixLocked = ENV_CONFIG_LOCKS.apiPrefix;
  const googleLocked = ENV_CONFIG_LOCKS.googleClientId;

  const isCrossOriginBaseUrl = useMemo(() => {
    if (typeof window === 'undefined') return false;
    if (!baseUrl) return false;

    try {
      const absolutePattern = /^[a-zA-Z][a-zA-Z\d+-.]*:\/\//;
      if (!absolutePattern.test(baseUrl)) {
        return false;
      }

      const url = new URL(baseUrl, window.location.origin);
      return url.origin !== window.location.origin;
    } catch {
      return false;
    }
  }, [baseUrl]);

  const handleTestConnection = async () => {
    try {
      setFetchState('loading');
      await apiRequest({ method: 'GET', url: '/health' });
      setFetchState('success');
      setFetchError(null);
    } catch (error) {
      setFetchState('error');
      setFetchError(error instanceof Error ? error.message : 'Health check failed');
    }
  };

  const statusLabel =
    fetchState === 'loading'
      ? 'Working…'
      : fetchState === 'success'
        ? 'Looks healthy'
        : fetchState === 'error'
          ? 'Needs attention'
          : 'Idle';

  return (
    <section className="config-panel" aria-label="Connection settings">
      <header className="config-panel-header">
        <div>
          <h2>Connection cockpit</h2>
          <p>Review the GoGear API connection details and keep tokens current when needed.</p>
        </div>
        <div className={`config-panel-status status-${fetchState}`}>
          <span className="dot" aria-hidden="true" />
          {statusLabel}
        </div>
      </header>

      <div className="config-panel-row">
        <div className="config-field">
          <label htmlFor="base-url">API base URL</label>
          {baseLocked && <small style={{ color: '#475569' }}>Managed via VITE_GOGEAR_API_BASE_URL</small>}
          <input
            id="base-url"
            value={baseUrl}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setBaseUrl(event.target.value)}
            placeholder="https://api.example.com"
            disabled={baseLocked}
          />
        </div>
        <div className="config-field">
          <label htmlFor="api-prefix">API path prefix</label>
          {prefixLocked && <small style={{ color: '#475569' }}>Managed via VITE_GOGEAR_API_PREFIX</small>}
          <input
            id="api-prefix"
            value={apiPrefix}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setApiPrefix(event.target.value)}
            placeholder="/api/v1"
            disabled={prefixLocked}
          />
        </div>
        <div className="config-field">
          <label htmlFor="google-client-id">Google OAuth Client ID</label>
          {googleLocked && <small style={{ color: '#475569' }}>Managed via VITE_GOOGLE_CLIENT_ID</small>}
          <input
            id="google-client-id"
            value={googleClientId}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setGoogleClientId(event.target.value)}
            placeholder="1234567890-xyz.apps.googleusercontent.com"
            disabled={googleLocked}
          />
        </div>
      </div>

      <div className="config-panel-row">
        <div className="config-field">
          <label htmlFor="gear-list-limit">Gear page size</label>
          <input
            id="gear-list-limit"
            type="number"
            min={5}
            max={500}
            step={5}
            value={gearListLimit}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setGearListLimit(Number(event.target.value) || 0)
            }
          />
          <small style={{ color: '#475569' }}>Controls how many gear entries load per page.</small>
        </div>
      </div>

      <div className="config-panel-row">
        <div className="config-field">
          <label htmlFor="token-type">Token type</label>
          <select
            id="token-type"
            value={tokenType}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setToken(accessToken, event.target.value as TokenType)}
          >
            {tokenTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="config-field" style={{ gridColumn: 'span 2' }}>
          <label htmlFor="access-token">Access token</label>
          <textarea
            id="access-token"
            value={accessToken ?? ''}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              setToken(event.target.value || undefined, tokenType)
            }
            placeholder="Paste existing token"
            rows={3}
          />
        </div>
      </div>

      {isCrossOriginBaseUrl && (
        <div className="notice">
          Heads up: this base URL points to a different origin. Browsers will fire CORS preflight calls for mutating
          requests, but the GoGear API skips OPTIONS handlers. Keep things on the same origin or rely on the dev proxy
          (<code>{apiPrefix || '/api/v1'}</code> ➜ <code>http://localhost:8081</code>) to stay in the safe lane.
        </div>
      )}

      <div className="config-panel-row" style={{ justifyContent: 'flex-end', gap: '12px' }}>
        <button className="button secondary" type="button" onClick={handleTestConnection} disabled={fetchState === 'loading'}>
          {fetchState === 'loading' ? 'Testing…' : 'Test health'}
        </button>
        <button className="button secondary" type="button" onClick={reset}>
          Reset
        </button>
      </div>

      {fetchState === 'success' && <div className="notice">Connection looks good!</div>}
      {fetchState === 'error' && fetchError && <div className="notice notice-error">{fetchError}</div>}
    </section>
  );
}
