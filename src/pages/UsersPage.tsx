import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import { UsersApi, type UserListQuery } from '../api/endpoints';
import type { User, UserWithPass } from '../api/types';
import { ActionDeck } from '../components/ActionDeck';
import { EntityForm, type FieldConfig } from '../components/EntityForm';
import { FilterBar } from '../components/FilterBar';
import { JsonPreview } from '../components/JsonPreview';
import { PageHero } from '../components/PageHero';
import { AdminTable, type Column } from '../ui/AdminTable';
import { IconEdit, IconPlus, IconTrash } from '../components/icons';

interface UserIdPayload {
  user_id?: number;
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const [listQuery, setListQuery] = useState<UserListQuery>({ page: 1, limit: 30 });
  const [detailId, setDetailId] = useState<number | undefined>();
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const listQueryResult = useQuery({
    queryKey: ['users', listQuery],
    queryFn: () => UsersApi.list(listQuery)
  });

  const detailQuery = useQuery({
    queryKey: ['users', 'detail', detailId],
    queryFn: () => (detailId ? UsersApi.get(detailId) : Promise.resolve(undefined)),
    enabled: detailId !== undefined
  });

  const insertMutation = useMutation({
    mutationFn: (payload: UserWithPass) => UsersApi.insert(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('User created');
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to create user', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<User>) => {
      const userId = payload.user_id;
      if (!userId) throw new Error('User ID is required');
      const requestPayload: User = { ...payload, user_id: userId };
      await UsersApi.update(userId, requestPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (detailId) {
        queryClient.invalidateQueries({ queryKey: ['users', 'detail', detailId] });
      }
      showToast('User updated');
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to update user', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ user_id }: UserIdPayload) => {
      if (!user_id) throw new Error('User ID is required');
      await UsersApi.remove(user_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('User deleted');
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to delete user', 'error');
    }
  });

  const tableColumns = useMemo<Column<User>[]>(
    () => [
      { key: 'user_id', label: 'ID', width: '80px' },
      { key: 'user_username', label: 'Username', sortable: true },
      { key: 'user_name', label: 'Name', sortable: true },
      { key: 'user_email', label: 'Email' }
    ],
    []
  );

  const createFields: FieldConfig<UserWithPass>[] = [
    { name: 'user_username', label: 'Username', type: 'text', required: true },
    { name: 'user_name', label: 'Name', type: 'text', required: true },
    { name: 'user_email', label: 'Email', type: 'text', required: true },
    { name: 'user_password', label: 'Password', type: 'text', required: true }
  ];

  const updateFields: FieldConfig<User>[] = [
    { name: 'user_id', label: 'User ID', type: 'number', required: true },
    { name: 'user_username', label: 'Username', type: 'text' },
    { name: 'user_name', label: 'Name', type: 'text' },
    { name: 'user_email', label: 'Email', type: 'text' }
  ];

  const deleteFields: FieldConfig<UserIdPayload>[] = [
    { name: 'user_id', label: 'User ID', type: 'number', required: true }
  ];

  const handleListQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setListQuery((prev: UserListQuery) => ({
      ...prev,
      [name]: value
        ? name === 'page' || name === 'limit'
          ? Number(value)
          : value
        : undefined
    }));
  };

  const totalCount = listQueryResult.data?.total_item_count ?? listQueryResult.data?.items?.length ?? 0;
  const currentPageCount = listQueryResult.data?.items?.length ?? 0;
  const searchActive = Boolean(listQuery.user || listQuery.username);

  return (
    <>
      <PageHero
        title="Crew manifest"
        subtitle="Manage explorers, administrators, and everyone in between."
        badge="Identity"
        metrics={[
          {
            label: 'Users',
            value: totalCount,
            hint: `Page ${listQuery.page ?? 1} • Limit ${listQuery.limit ?? 30}`,
            tone: totalCount > 0 ? 'positive' : 'default'
          },
          {
            label: 'On this page',
            value: currentPageCount,
            hint: 'Visible with current filters'
          },
          {
            label: 'Filters',
            value: searchActive ? 'Active' : 'Idle',
            hint: searchActive ? 'Search conditions applied' : 'No filters engaged',
            tone: searchActive ? 'warning' : 'default'
          }
        ]}
        actions={
          <button className="button ghost" type="button" onClick={() => listQueryResult.refetch()}>
            Refresh list
          </button>
        }
      >
        <span className="hero-chip">Keep the roster friendly with fast edits and instant visibility.</span>
      </PageHero>

      {toast && (
        <div className={`notice${toast.tone === 'error' ? ' notice-error' : ' notice-success'}`}>{toast.message}</div>
      )}

      <FilterBar
        title="Browse users"
        subtitle="Mix pagination tweaks with quick user searches to find anyone instantly."
        tone="highlight"
        actions={
          <button className="button ghost" type="button" onClick={() => setListQuery({ page: 1, limit: 30 })}>
            Reset filters
          </button>
        }
      >
        <div className="filter-chip">
          <label htmlFor="page">Page</label>
          <input id="page" name="page" type="number" value={listQuery.page ?? 1} onChange={handleListQueryChange} />
        </div>
        <div className="filter-chip">
          <label htmlFor="limit">Limit</label>
          <input id="limit" name="limit" type="number" value={listQuery.limit ?? 30} onChange={handleListQueryChange} />
        </div>
        <div className="filter-chip">
          <label htmlFor="user">Search username</label>
          <input id="user" name="user" value={listQuery.user ?? ''} onChange={handleListQueryChange} />
        </div>
        <div className="filter-chip">
          <label htmlFor="username">Search full name</label>
          <input id="username" name="username" value={listQuery.username ?? ''} onChange={handleListQueryChange} />
        </div>
      </FilterBar>

      <AdminTable<User>
        columns={tableColumns}
        data={listQueryResult.data?.items ?? []}
        keyField="user_id"
        loading={listQueryResult.isLoading}
        emptyMessage="No users matched those filters."
      />
      {listQueryResult.isError && (
        <div className="notice notice-error">
          {listQueryResult.error instanceof Error ? listQueryResult.error.message : 'Failed to load users'}
        </div>
      )}

      <ActionDeck
        title="User actions"
        subtitle="Create new explorers or fine tune existing credentials without leaving this view."
        items={[
          {
            id: 'create',
            title: 'Create',
            description: 'Invite a new member to the crew',
            tone: 'create',
            icon: <IconPlus />,
            content: (
              <EntityForm<UserWithPass>
                title="Create user"
                fields={createFields}
                submitLabel={insertMutation.isPending ? 'Creating…' : 'Create user'}
                onSubmit={async (values) => {
                  await insertMutation.mutateAsync(values);
                }}
                variant="inline"
              />
            )
          },
          {
            id: 'update',
            title: 'Update',
            description: 'Adjust usernames, names, or emails on demand',
            tone: 'update',
            icon: <IconEdit />,
            content: (
              <EntityForm<User>
                title="Update user"
                fields={updateFields}
                submitLabel={updateMutation.isPending ? 'Updating…' : 'Update user'}
                onSubmit={async (values) => {
                  await updateMutation.mutateAsync(values);
                }}
                variant="inline"
              />
            )
          },
          {
            id: 'delete',
            title: 'Delete',
            description: 'Archive a user that no longer needs access',
            tone: 'delete',
            icon: <IconTrash />,
            content: (
              <EntityForm<UserIdPayload>
                title="Delete user"
                fields={deleteFields}
                submitLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete user'}
                onSubmit={async (values) => {
                  await deleteMutation.mutateAsync(values);
                }}
                variant="inline"
              />
            )
          }
        ]}
      />

      <section className="section inspector-section">
        <div className="inspector-controls">
          <h3>JSON inspector</h3>
          <p>Enter a user ID to peek at the full API response for that profile.</p>
          <div className="form-grid" style={{ gridTemplateColumns: 'minmax(200px, 1fr)' }}>
            <div className="field">
              <label htmlFor="detailId">User ID</label>
              <input
                id="detailId"
                type="number"
                value={detailId ?? ''}
                onChange={(event) => setDetailId(event.target.value ? Number(event.target.value) : undefined)}
                placeholder="Enter ID"
              />
            </div>
          </div>
        </div>
        <JsonPreview
          title="User payload"
          data={detailQuery.data as User | undefined}
          isLoading={detailQuery.isFetching}
          emptyMessage="Choose a user ID to inspect the JSON payload."
        />
      </section>
    </>
  );
}
