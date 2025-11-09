import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Location, useLocation, useNavigate } from 'react-router-dom';

import './LoginPage.css';
import { AuthApi } from '../api/endpoints';
import { useConfigStore, type TokenType } from '../store/configStore';

interface CredentialResponse {
  credential?: string;
  clientId?: string;
  select_by?: string;
}

function normalizeTokenType(value?: string): TokenType {
  const token = value?.toLowerCase() ?? '';
  if (token === 'basic') return 'Basic';
  if (token === 'custom') return 'Custom';
  return 'Bearer';
}

function toMillis(epochSeconds?: number): number | undefined {
  if (!epochSeconds || Number.isNaN(epochSeconds)) {
    return undefined;
  }
  return epochSeconds * 1000;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = useMemo(() => {
    const fromState = (location.state as { from?: Location } | null)?.from;
    if (fromState && fromState.pathname && fromState.pathname !== '/login') {
      return `${fromState.pathname}${fromState.search ?? ''}`;
    }
    const fromQuery = new URLSearchParams(location.search).get('redirect');
    if (fromQuery && fromQuery.startsWith('/') && fromQuery !== '/login') {
      return fromQuery;
    }
    return '/';
  }, [location.state, location.search]);

  const baseUrl = useConfigStore((state) => state.baseUrl);
  const apiPrefix = useConfigStore((state) => state.apiPrefix);
  const googleClientId = useConfigStore((state) => state.googleClientId);
  const accessToken = useConfigStore((state) => state.accessToken);
  const hydrated = useConfigStore((state) => state.hydrated);
  const setBaseUrl = useConfigStore((state) => state.setBaseUrl);
  const setApiPrefix = useConfigStore((state) => state.setApiPrefix);
  const setGoogleClientId = useConfigStore((state) => state.setGoogleClientId);
  const setAuthResult = useConfigStore((state) => state.setAuthResult);
  const resetConfig = useConfigStore((state) => state.reset);

  const [manualToken, setManualToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(() => typeof window !== 'undefined' && !!window.google?.accounts?.id);

  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (hydrated && accessToken) {
      navigate(redirectPath, { replace: true });
    }
  }, [accessToken, hydrated, navigate, redirectPath]);

  useEffect(() => {
    if (scriptReady) return;
    if (typeof window === 'undefined') return;

    const interval = window.setInterval(() => {
      if (window.google?.accounts?.id) {
        setScriptReady(true);
        window.clearInterval(interval);
      }
    }, 200);

    return () => {
      window.clearInterval(interval);
    };
  }, [scriptReady]);

  const handleCredential = useCallback(
    async (response: CredentialResponse) => {
      if (!response?.credential) {
        setError('Google authentication did not return a credential. Please try again.');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const authResponse = await AuthApi.login({ credential: response.credential });
        const tokenType = normalizeTokenType(authResponse.token_type);
        const userPayload = authResponse.user
          ? {
            id: authResponse.user.id,
            email: authResponse.user.email,
            name: authResponse.user.name,
            isAdmin: Boolean(authResponse.user.is_admin)
          }
          : undefined;

        const expiresAtFromResponse = toMillis(authResponse.expires_at);
        const expiresAtFallback = authResponse.expires_in ? Date.now() + authResponse.expires_in * 1000 : undefined;

        setAuthResult({
          accessToken: authResponse.access_token,
          tokenType,
          user: userPayload,
          expiresAt: expiresAtFromResponse ?? expiresAtFallback
        });

        navigate(redirectPath, { replace: true });
      } catch (loginError) {
        const message = loginError instanceof Error ? loginError.message : 'Unable to complete sign-in.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [navigate, redirectPath, setAuthResult]
  );

  useEffect(() => {
    if (!scriptReady || !googleClientId || !googleButtonRef.current || typeof window === 'undefined') {
      return;
    }

    const googleClient = window.google?.accounts?.id;
    if (!googleClient) {
      return;
    }

    googleClient.initialize({
      client_id: googleClientId,
      callback: (response) => {
        void handleCredential(response as CredentialResponse);
      },
      cancel_on_tap_outside: false
    });

    googleButtonRef.current.innerHTML = '';
    googleClient.renderButton(googleButtonRef.current, {
      theme: 'filled_blue',
      size: 'large',
      type: 'standard',
      shape: 'pill',
      width: 280
    });
    googleClient.prompt();
  }, [googleClientId, handleCredential, scriptReady]);

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = manualToken.trim();
    if (!token) {
      setError('Paste a valid access token or use Google Sign-In.');
      return;
    }

    setError(null);
    setAuthResult({ accessToken: token, tokenType: 'Bearer', user: undefined, expiresAt: undefined });
    setManualToken('');
    navigate(redirectPath, { replace: true });
  };

  const googleReady = scriptReady && Boolean(googleClientId);

  return (
    <div className="login-page">
      <div className="login-card" aria-live="polite">
        <div className="login-brand">
          <span className="login-logo">GoGear Console</span>
          <p>Pilot the gear library from a single cockpit. Sign in to continue.</p>
        </div>

        {error && <div className="login-alert">{error}</div>}

        <section className="login-section">
          <h2>Quick sign-in</h2>
          {!googleClientId && <p className="login-hint">Add your Google OAuth Client ID below to enable one-click sign-in.</p>}
          <div className="login-google">
            <div ref={googleButtonRef} className="google-button-slot" aria-hidden={!googleReady} />
            {!googleReady && <p className="login-status">Waiting for Google Identity Services…</p>}
            {loading && <p className="login-status">Finishing sign-in…</p>}
          </div>
        </section>

        <div className="login-divider" role="separator">
          <span>or</span>
        </div>

        <section className="login-section">
          <h2>Use an existing token</h2>
          <form className="login-manual" onSubmit={handleManualSubmit}>
            <label htmlFor="manual-token">Paste an access token issued by the GoGear API</label>
            <textarea
              id="manual-token"
              value={manualToken}
              onChange={(event) => setManualToken(event.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
              rows={4}
              spellCheck={false}
            />
            <button className="login-primary-button" type="submit" disabled={loading}>
              Continue with token
            </button>
          </form>
        </section>

        <section className="login-section">
          <h2>Connection setup</h2>
          <p className="login-hint">Adjust the backend target and Google client ID before signing in.</p>
          <div className="login-settings-grid">
            <label htmlFor="login-base-url">
              API base URL
              <input
                id="login-base-url"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://api.example.com"
                autoComplete="off"
              />
            </label>
            <label htmlFor="login-api-prefix">
              API prefix
              <input
                id="login-api-prefix"
                value={apiPrefix}
                onChange={(event) => setApiPrefix(event.target.value)}
                placeholder="/api/v1"
                autoComplete="off"
              />
            </label>
            <label htmlFor="login-google-client-id">
              Google OAuth Client ID
              <input
                id="login-google-client-id"
                value={googleClientId}
                onChange={(event) => setGoogleClientId(event.target.value)}
                placeholder="1234567890-abc.apps.googleusercontent.com"
                autoComplete="off"
              />
            </label>
          </div>
          <button className="login-secondary-button" type="button" onClick={resetConfig} disabled={loading}>
            Reset connection settings
          </button>
        </section>
      </div>
    </div>
  );
}
