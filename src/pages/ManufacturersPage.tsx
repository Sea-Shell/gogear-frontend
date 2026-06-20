import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import { ManufactureApi, type PaginationQuery } from '../api/endpoints';
import type { Manufacture } from '../api/types';
import { EntityForm } from '../components/EntityForm';
import { FilterBar } from '../components/FilterBar';
import { PageHero } from '../components/PageHero';
import { AdminTable, type Column } from '../ui/AdminTable';
import { SlideOver } from '../ui/SlideOver';

export function ManufacturersPage() {
  const queryClient = useQueryClient();
  const [listQuery, setListQuery] = useState<(PaginationQuery & { manufacture?: string; manufacturename?: string })>({
    page: 1,
    limit: 30
  });
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [slideOver, setSlideOver] = useState<{
    mode: 'create' | 'edit' | 'delete';
    item?: Manufacture;
  } | null>(null);

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const listQueryResult = useQuery({
    queryKey: ['manufacturers', listQuery],
    queryFn: () => ManufactureApi.list(listQuery)
  });

  const insertMutation = useMutation({
    mutationFn: (payload: Manufacture) => ManufactureApi.insert(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      setSlideOver(null);
      showToast('Manufacturer created');
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to create manufacturer', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Manufacture) => {
      const manufactureId = payload.manufacture_id;
      if (!manufactureId) throw new Error('Manufacturer ID is required');
      await ManufactureApi.update(manufactureId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      setSlideOver(null);
      showToast('Manufacturer updated');
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to update manufacturer', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (payload: Manufacture) => {
      if (!payload.manufacture_id) throw new Error('Manufacturer ID is required');
      await ManufactureApi.remove(payload.manufacture_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      setSlideOver(null);
      showToast('Manufacturer deleted');
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to delete manufacturer', 'error');
    }
  });

  const tableColumns = useMemo<Column<Manufacture>[]>(
    () => [
      { key: 'manufacture_id', label: 'ID', width: '80px' },
      { key: 'manufacture_name', label: 'Name', sortable: true }
    ],
    []
  );

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setListQuery((prev: PaginationQuery & { manufacture?: string; manufacturename?: string }) => ({
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
  const searchActive = Boolean(listQuery.manufacture || listQuery.manufacturename);

  const slideTitle = slideOver?.mode === 'create'
    ? 'Create manufacturer'
    : slideOver?.mode === 'edit'
      ? 'Edit manufacturer'
      : 'Delete manufacturer';

  return (
    <>
      <PageHero
        title="Manufacturing guild"
        subtitle="Catalogue and refine the makers powering every gear drop."
        badge="Partners"
        metrics={[
          {
            label: 'Manufacturers',
            value: totalCount,
            hint: `Page ${listQuery.page ?? 1} • Limit ${listQuery.limit ?? 30}`,
            tone: totalCount > 0 ? 'positive' : 'default'
          },
          {
            label: 'On this page',
            value: currentPageCount,
            hint: 'Active within current query scope'
          },
          {
            label: 'Filters',
            value: searchActive ? 'Active' : 'Idle',
            hint: searchActive ? 'Search refinements applied' : 'No filters engaged',
            tone: searchActive ? 'warning' : 'default'
          }
        ]}
        actions={
          <button className="button ghost" type="button" onClick={() => listQueryResult.refetch()}>
            Refresh list
          </button>
        }
      >
        <span className="hero-chip">Spotlight trusted makers and keep the production line humming.</span>
      </PageHero>

      {toast && (
        <div className={`notice${toast.tone === 'error' ? ' notice-error' : ' notice-success'}`}>{toast.message}</div>
      )}

      <FilterBar
        title="Browse manufacturers"
        subtitle="Fine tune pagination or quickly zero in on a specific partner."
        tone="highlight"
        actions={
          <button className="button ghost" type="button" onClick={() => setListQuery({ page: 1, limit: 30 })}>
            Reset filters
          </button>
        }
      >
        <div className="filter-chip">
          <label htmlFor="page">Page</label>
          <input id="page" name="page" type="number" value={listQuery.page ?? 1} onChange={handleFilterChange} />
        </div>
        <div className="filter-chip">
          <label htmlFor="limit">Limit</label>
          <input id="limit" name="limit" type="number" value={listQuery.limit ?? 30} onChange={handleFilterChange} />
        </div>
        <div className="filter-chip">
          <label htmlFor="manufacture">Search by name</label>
          <input id="manufacture" name="manufacture" value={listQuery.manufacture ?? ''} onChange={handleFilterChange} />
        </div>
        <div className="filter-chip">
          <label htmlFor="manufacturename">Search by full name</label>
          <input
            id="manufacturename"
            name="manufacturename"
            value={listQuery.manufacturename ?? ''}
            onChange={handleFilterChange}
          />
        </div>
      </FilterBar>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-sm, 8px)' }}>
        <button className="button" type="button" onClick={() => setSlideOver({ mode: 'create' })}>
          + Create manufacturer
        </button>
      </div>

      <AdminTable<Manufacture>
        columns={tableColumns}
        data={listQueryResult.data?.items ?? []}
        keyField="manufacture_id"
        loading={listQueryResult.isLoading}
        emptyMessage="No manufacturers matched your filters."
        onEdit={(item) => setSlideOver({ mode: 'edit', item })}
        onDelete={(item) => setSlideOver({ mode: 'delete', item })}
      />
      {listQueryResult.isError && (
        <div className="notice notice-error">
          {listQueryResult.error instanceof Error ? listQueryResult.error.message : 'Failed to load manufacturers'}
        </div>
      )}

      <SlideOver
        open={slideOver !== null}
        onClose={() => setSlideOver(null)}
        title={slideTitle}
      >
        {slideOver?.mode === 'create' && (
          <EntityForm<Manufacture>
            title=""
            fields={[
              { name: 'manufacture_name', label: 'Name', type: 'text', required: true }
            ]}
            submitLabel={insertMutation.isPending ? 'Creating...' : 'Create manufacturer'}
            onSubmit={async (values) => { await insertMutation.mutateAsync(values as Manufacture); }}
            variant="inline"
          />
        )}
        {slideOver?.mode === 'edit' && slideOver.item && (
          <EntityForm<Manufacture>
            title=""
            fields={[
              { name: 'manufacture_id', label: 'ID', type: 'number', required: true },
              { name: 'manufacture_name', label: 'Name', type: 'text' }
            ]}
            initialValues={{
              manufacture_id: slideOver.item.manufacture_id,
              manufacture_name: slideOver.item.manufacture_name
            }}
            submitLabel={updateMutation.isPending ? 'Updating...' : 'Update manufacturer'}
            onSubmit={async (values) => { await updateMutation.mutateAsync(values as Manufacture); }}
            variant="inline"
          />
        )}
        {slideOver?.mode === 'delete' && slideOver.item && (
          <div>
            <p style={{ color: 'var(--ink-dim)', marginBottom: 'var(--space-md)' }}>
              Are you sure you want to delete <strong>{slideOver.item.manufacture_name}</strong> (ID: {slideOver.item.manufacture_id})?
            </p>
            <EntityForm<Manufacture>
              title=""
              fields={[
                { name: 'manufacture_id', label: 'Manufacturer ID to confirm', type: 'number', required: true }
              ]}
              initialValues={{ manufacture_id: slideOver.item.manufacture_id }}
              submitLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete manufacturer'}
              onSubmit={async (values) => { await deleteMutation.mutateAsync(values as Manufacture); }}
              variant="inline"
            />
          </div>
        )}
      </SlideOver>
    </>
  );
}
