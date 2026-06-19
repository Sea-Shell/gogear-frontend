import { createBrowserRouter } from 'react-router-dom';

import { AppLayout } from './ui/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { GearPage } from './pages/GearPage';
import { ManufacturersPage } from './pages/ManufacturersPage';
import { UsersPage } from './pages/UsersPage';
import { LoadoutListPage } from './pages/LoadoutListPage';
import { LoadoutDetailPage } from './pages/LoadoutDetailPage';
import { LoadoutFormPage } from './pages/LoadoutFormPage';
import { MobileChecklistPage } from './pages/MobileChecklistPage';
import { PublicLoadoutPage } from './pages/PublicLoadoutPage';
import { UserGearPage } from './pages/UserGearPage';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';
import { RequireAuth } from './components/RequireAuth';
import { RequireAdmin } from './components/RequireAdmin';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'categories',
        element: (
          <RequireAdmin>
            <CategoriesPage />
          </RequireAdmin>
        )
      },
      { path: 'gear', element: <GearPage /> },
      { path: 'manufacturers', element: <ManufacturersPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'user-gear', element: <UserGearPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'loadouts', element: <LoadoutListPage /> },
      { path: 'loadouts/new', element: <LoadoutFormPage /> },
      { path: 'loadouts/:loadoutId', element: <LoadoutDetailPage /> },
      { path: 'loadouts/:loadoutId/edit', element: <LoadoutFormPage /> },
      { path: 'loadouts/:loadoutId/checklist', element: <MobileChecklistPage /> }
    ]
  },
  // Public loadout route (no auth required)
  { path: 'public/loadouts/:slug', element: <PublicLoadoutPage /> },
  {
    path: '/login',
    element: <LoginPage />
  }
]);
