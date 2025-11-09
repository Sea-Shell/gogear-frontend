import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './index.css';
import { router } from './router';
import { initRuntimeConfig } from './runtimeConfig';
import { initAuthTokenRefresh } from './auth/tokenRefresher';

const queryClient = new QueryClient();

async function bootstrap() {
  try {
    await initRuntimeConfig();
  } catch (error) {
    console.warn('Runtime config initialization failed. Proceeding with defaults.', error);
  }

  initAuthTokenRefresh();

  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Unable to locate root container element.');
  }

  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>
  );
}

void bootstrap();
