import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import { UsersApi, type UserListQuery } from '../api/endpoints';
import type { User, UserWithPass } from '../api/types';
import { EntityForm, type FieldConfig } from '../components/EntityForm';
import { FilterBar } from '../components/FilterBar';
import { PageHero } from '../components/PageHero';
import { AdminTable, type Column } from '../ui/AdminTable';
import { SlideOver } from '../ui/SlideOver';
import { IconPlus } from '../components/icons';

interface UserIdPayload {
  user_id?: number;
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const [listQuery, setListQuery] = useState<UserListQuery>({ page: 1, limit: 30 });
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  // SlideOver states
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

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

  const insertMutation = useMutation({
    mutationFn: (payload: UserWithPass) => UsersApi.insert(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('User created');
      setCreateOpen(false);
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
      showToast('User updated');
      setEditUser(null);
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
      setDeleteUser(null);
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

  const handleEdit = (user: User) => {
    setEditUser(user);
  };

  const handleDelete = (user: User) => {
    setDeleteUser(user);
  };

  const handleCreateClick = () => {
    setCreateOpen(true);
  };

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
          <>
            <button className="button ghost" type="button" onClick={() => listQueryResult.refetch()}>
              Refresh list
            </button>
            <button className="button primary" type="button" onClick={handleCreateClick}>
              <IconPlus /> Add user
            </button>
          </>
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
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={listQueryResult.isLoading}
        emptyMessage="No users matched those filters."
      />
      {listQueryResult.isError && (
        <div className="notice notice-error">
          {listQueryResult.error instanceof Error ? listQueryResult.error.message : 'Failed to load users'}
        </div>
      )}

      {/* Create User SlideOver */}
      <SlideOver
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create user"
        width={480}
      >
        <EntityForm<UserWithPass>
          fields={createFields}
          submitLabel={insertMutation.isPending ? 'Creating…' : 'Create user'}
          onSubmit={async (values) => {
            await insertMutation.mutateAsync(values);
          }}
          variant="inline"
        />
      </SlideOver>

      {/* Edit User SlideOver */}
      <SlideOver
        open={editUser !== null}
        onClose={() => setEditUser(null)}
        title="Update user"
        width={480}
      >
        {editUser && (
          <EntityForm<User>
            initialValues={editUser}
            fields={updateFields}
            submitLabel={updateMutation.isPending ? 'Updating…' : 'Update user'}
            onSubmit={async (values) => {
              await updateMutation.mutateAsync(values);
            }}
            variant="inline"
          />
        )}
      </SlideOver>

      {/* Delete User SlideOver */}
      <SlideOver
        open={deleteUser !== null}
        onClose={() => setDeleteUser(null)}
        title="Delete user"
        width={480}
      >
        {deleteUser && (
          <EntityForm<UserIdPayload>
            initialValues={{ user_id: deleteUser.user_id }}
            fields={deleteFields}
            submitLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete user'}
            onSubmit={async (values) => {
              await deleteMutation.mutateAsync(values);
            }}
            variant="inline"
          />
        )}
      </SlideOver>
    </>
  );
}