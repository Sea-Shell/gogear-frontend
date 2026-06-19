import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import { ManufactureApi, type PaginationQuery } from '../api/endpoints';
import type { Manufacture } from '../api/types';
import { ActionDeck } from '../components/ActionDeck';
import { EntityForm, type FieldConfig } from '../components/EntityForm';
import { FilterBar } from '../components/FilterBar';
import { JsonPreview } from '../components/JsonPreview';
import { PageHero } from '../components/PageHero';
import { AdminTable, type Column } from '../ui/AdminTable';
import { IconEdit, IconPlus, IconTrash } from '../components/icons';

interface ManufactureIdPayload {
  manufacture_id?: number;
}

export function ManufacturersPage() {
  const queryClient = useQueryClient();
  const [listQuery, setListQuery] = useState<(PaginationQuery & { manufacture?: string; manufacturename?: string })>({
    page: 1,
    limit: 30
  });
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
    queryKey: ['manufacturers', listQuery],
    queryFn: () => ManufactureApi.list(listQuery)
  });

  const detailQuery = useQuery({
    queryKey: ['manufacturers', 'detail', detailId],
    queryFn: () => (detailId ? ManufactureApi.get(detailId) : Promise.resolve(undefined)),
    enabled: detailId !== undefined
  });

  const insertMutation = useMutation({
    mutationFn: (payload: Manufacture) => ManufactureApi.insert(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      showToast('Manufacturer created');
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to create manufacturer', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<Manufacture>) => {
      const manufactureId = payload.manufacture_id;
      if (!manufactureId) throw new Error('Manufacturer ID is required');
      const requestPayload: Manufacture = { ...payload, manufacture_id: manufactureId };
      await ManufactureApi.update(manufactureId, requestPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      if (detailId) {
        queryClient.invalidateQueries({ queryKey: ['manufacturers', 'detail', detailId] });
      }
      showToast('Manufacturer updated');
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to update manufacturer', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ manufacture_id }: ManufactureIdPayload) => {
      if (!manufacture_id) throw new Error('Manufacturer ID is required');
      await ManufactureApi.remove(manufacture_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
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

  const createFields: FieldConfig<Manufacture>[] = [
    { name: 'manufacture_name', label: 'Name', type: 'text', required: true }
  ];

  const updateFields: FieldConfig<Manufacture>[] = [
    { name: 'manufacture_id', label: 'Manufacturer ID', type: 'number', required: true },
    { name: 'manufacture_name', label: 'Name', type: 'text' }
  ];

  const deleteFields: FieldConfig<ManufactureIdPayload>[] = [
    { name: 'manufacture_id', label: 'Manufacturer ID', type: 'number', required: true }
  ];

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

      <AdminTable<Manufacture>
        columns={tableColumns}
        data={listQueryResult.data?.items ?? []}
        keyField="manufacture_id"
        loading={listQueryResult.isLoading}
        emptyMessage="No manufacturers matched your filters."
      />
      {listQueryResult.isError && (
        <div className="notice notice-error">
          {listQueryResult.error instanceof Error ? listQueryResult.error.message : 'Failed to load manufacturers'}
        </div>
      )}

      <ActionDeck
        title="Manufacturer actions"
        subtitle="Invite new makers, adjust identities, or retire partners with ease."
        items={[
          {
            id: 'create',
            title: 'Create',
            description: 'Add a new partner to the roster',
            tone: 'create',
            icon: <IconPlus />,
            content: (
              <EntityForm<Manufacture>
                title="Create manufacturer"
                fields={createFields}
                submitLabel={insertMutation.isPending ? 'Creating…' : 'Create manufacturer'}
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
            description: 'Refresh names or identifiers when makers evolve',
            tone: 'update',
            icon: <IconEdit />,
            content: (
              <EntityForm<Manufacture>
                title="Update manufacturer"
                fields={updateFields}
                submitLabel={updateMutation.isPending ? 'Updating…' : 'Update manufacturer'}
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
            description: 'Archive makers that no longer produce gear',
            tone: 'delete',
            icon: <IconTrash />,
            content: (
              <EntityForm<ManufactureIdPayload>
                title="Delete manufacturer"
                fields={deleteFields}
                submitLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete manufacturer'}
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
          <p>Enter a manufacturer ID to examine the full payload returned by the API.</p>
          <div className="form-grid" style={{ gridTemplateColumns: 'minmax(200px, 1fr)' }}>
            <div className="field">
              <label htmlFor="detailId">Manufacturer ID</label>
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
          title="Manufacturer payload"
          data={detailQuery.data as Manufacture | undefined}
          isLoading={detailQuery.isFetching}
          emptyMessage="Choose an ID to reveal the manufacturer JSON here."
        />
      </section>
    </>
  );
}
