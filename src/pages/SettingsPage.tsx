import { useMemo } from 'react';

import { PageHero } from '../components/PageHero';
import { ConfigPanel } from '../components/ConfigPanel';
import { useConfigStore } from '../store/configStore';

export function SettingsPage() {
  const baseUrl = useConfigStore((state) => state.baseUrl);
  const apiPrefix = useConfigStore((state) => state.apiPrefix);
  const tokenType = useConfigStore((state) => state.tokenType);
  const user = useConfigStore((state) => state.user);

  const metrics = useMemo(
    () => [
      {
        label: 'Base URL',
        value: baseUrl || '(same origin)',
        hint: 'Configured HTTP origin for the GoGear API'
      },
      {
        label: 'API prefix',
        value: apiPrefix || '(none)',
        hint: 'Path segment automatically prefixed to requests'
      },
      {
        label: 'Token type',
        value: tokenType,
        hint: user ? `Active session for ${user.email ?? user.name ?? 'current user'}` : 'Manual token mode'
      }
    ],
    [apiPrefix, baseUrl, tokenType, user]
  );

  return (
    <>
      <PageHero
        title="Console settings"
        subtitle="Manage how the console talks to the GoGear API and keep administrator tokens current."
        badge="Configuration"
        metrics={metrics}
      />

      <ConfigPanel />
    </>
  );
}
