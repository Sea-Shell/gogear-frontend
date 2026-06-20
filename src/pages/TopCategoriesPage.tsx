import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import { TopCategoryApi, type PaginationQuery } from '../api/endpoints';
import type { GearTopCategory } from '../api/types';
import { EntityForm } from '../components/EntityForm';
import { FilterBar } from '../components/FilterBar';
import { PageHero } from '../components/PageHero';
import { AdminTable, type Column } from '../ui/AdminTable';
import { SlideOver } from '../ui/SlideOver';
import { FALLBACK_ICON_KEY, TopCategoryIcon, topCategoryIconOptions } from '../components/topCategoryIcons';

export function TopCategoriesPage() {
  const queryClient = useQueryClient();
  const [listQuery, setListQuery] = useState<PaginationQuery>({ page: 1, limit: 30 });
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [slideOver, setSlideOver] = useState<{
    mode: 'create' | 'edit' | 'delete';
    item?: GearTopCategory;
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
    queryKey: ['topCategories', listQuery],
    queryFn: () => TopCategoryApi.list(listQuery)
  });

  const iconSelectOptions = useMemo(
    () =>
      topCategoryIconOptions.map(({ value, label, hint }) => ({
        value,
        label: hint ? `${label} — ${hint}` : label
      })),
    []
  );

  const insertMutation = useMutation({
    mutationFn: (payload: GearTopCategory) => TopCategoryApi.insert(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topCategories'] });
      setSlideOver(null);
      showToast('Top category created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: GearTopCategory) => {
      const topCategoryId = payload.top_category_id;
      if (!topCategoryId) throw new Error('Top category ID is required');
      await TopCategoryApi.update(topCategoryId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topCategories'] });
      setSlideOver(null);
      showToast('Top category updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (payload: GearTopCategory) => {
      if (!payload.top_category_id) throw new Error('Top category ID is required');
      await TopCategoryApi.remove(payload.top_category_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topCategories'] });
      setSlideOver(null);
      showToast('Top category deleted');
    }
  });

  const tableColumns = useMemo<Column<GearTopCategory>[]>(
    () => [
      { key: 'top_category_id', label: 'ID', width: '80px' },
      {
        key: 'top_category_icon',
        label: 'Icon',
        width: '60px',
        render: (item: GearTopCategory) => (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}>
            <TopCategoryIcon iconKey={item.top_category_icon} width={24} height={24} />
          </span>
        )
      },
      { key: 'top_category_name', label: 'Name', sortable: true }
    ],
    []
  );

  const handleListInput = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setListQuery((prev: PaginationQuery) => ({ ...prev, [name]: value ? Number(value) : undefined }));
  };

  const totalCount = listQueryResult.data?.total_item_count ?? listQueryResult.data?.items?.length ?? 0;

  const slideTitle = slideOver?.mode === 'create'
    ? 'Create top category'
    : slideOver?.mode === 'edit'
      ? 'Edit top category'
      : 'Delete top category';

  return (
    <>
      <PageHero
        title="Top category constellation"
        subtitle="Shine a spotlight on the macro-collections that give GoGear its structure."
        badge="Curation"
        metrics={[
          {
            label: 'Top categories',
            value: totalCount,
            hint: `Page ${listQuery.page ?? 1} • Limit ${listQuery.limit ?? 30}`,
            tone: totalCount > 0 ? 'positive' : 'default'
          }
        ]}
        actions={
          <button className="button ghost" type="button" onClick={() => listQueryResult.refetch()}>
            Refresh list
          </button>
        }
      >
        <span className="hero-chip">Every top category powers multiple gear branches.</span>
      </PageHero>

      {toast && (
        <div className={`notice${toast.tone === 'error' ? ' notice-error' : ' notice-success'}`}>{toast.message}</div>
      )}

      <FilterBar
        title="Browse top categories"
        subtitle="Tweak pagination when you're mapping the galaxy of collections."
        actions={
          <button className="button ghost" type="button" onClick={() => setListQuery({ page: 1, limit: 30 })}>
            Reset filters
          </button>
        }
      >
        <div className="filter-chip">
          <label htmlFor="page">Page</label>
          <input id="page" name="page" type="number" value={listQuery.page ?? 1} onChange={handleListInput} />
        </div>
        <div className="filter-chip">
          <label htmlFor="limit">Limit</label>
          <input id="limit" name="limit" type="number" value={listQuery.limit ?? 30} onChange={handleListInput} />
        </div>
      </FilterBar>

      {listQueryResult.isError && (
        <div className="notice notice-error">
          {listQueryResult.error instanceof Error ? listQueryResult.error.message : 'Failed to load top categories'}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-sm, 8px)' }}>
        <button className="button" type="button" onClick={() => setSlideOver({ mode: 'create' })}>
          + Create top category
        </button>
      </div>

      <AdminTable<GearTopCategory>
        columns={tableColumns}
        data={listQueryResult.data?.items ?? []}
        keyField="top_category_id"
        loading={listQueryResult.isLoading}
        emptyMessage="No top categories found."
        onEdit={(item) => setSlideOver({ mode: 'edit', item })}
        onDelete={(item) => setSlideOver({ mode: 'delete', item })}
      />

      <SlideOver
        open={slideOver !== null}
        onClose={() => setSlideOver(null)}
        title={slideTitle}
      >
        {slideOver?.mode === 'create' && (
          <EntityForm<GearTopCategory>
            title=""
            fields={[
              { name: 'top_category_name', label: 'Name', type: 'text', required: true },
              {
                name: 'top_category_icon',
                label: 'Icon',
                type: 'select',
                required: true,
                description: 'Controls which glyph appears on gear cards',
                options: iconSelectOptions
              }
            ]}
            initialValues={{ top_category_icon: FALLBACK_ICON_KEY }}
            submitLabel={insertMutation.isPending ? 'Creating...' : 'Create top category'}
            onSubmit={async (values) => { await insertMutation.mutateAsync(values as GearTopCategory); }}
            variant="inline"
          />
        )}
        {slideOver?.mode === 'edit' && slideOver.item && (
          <EntityForm<GearTopCategory>
            title=""
            fields={[
              { name: 'top_category_id', label: 'ID', type: 'number', required: true },
              { name: 'top_category_name', label: 'Name', type: 'text' },
              {
                name: 'top_category_icon',
                label: 'Icon',
                type: 'select',
                description: 'Leave blank to keep the existing glyph',
                options: iconSelectOptions
              }
            ]}
            initialValues={{
              top_category_id: slideOver.item.top_category_id,
              top_category_name: slideOver.item.top_category_name,
              top_category_icon: slideOver.item.top_category_icon
            }}
            submitLabel={updateMutation.isPending ? 'Updating...' : 'Update top category'}
            onSubmit={async (values) => { await updateMutation.mutateAsync(values as GearTopCategory); }}
            variant="inline"
          />
        )}
        {slideOver?.mode === 'delete' && slideOver.item && (
          <div>
            <p style={{ color: 'var(--ink-dim)', marginBottom: 'var(--space-md)' }}>
              Are you sure you want to delete <strong>{slideOver.item.top_category_name}</strong> (ID: {slideOver.item.top_category_id})?
            </p>
            <EntityForm<GearTopCategory>
              title=""
              fields={[
                { name: 'top_category_id', label: 'Top category ID to confirm', type: 'number', required: true }
              ]}
              initialValues={{ top_category_id: slideOver.item.top_category_id }}
              submitLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete top category'}
              onSubmit={async (values) => { await deleteMutation.mutateAsync(values as GearTopCategory); }}
              variant="inline"
            />
          </div>
        )}
      </SlideOver>
    </>
  );
}
