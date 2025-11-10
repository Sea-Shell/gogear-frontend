import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useMemo, useState } from 'react';

import { TopCategoryApi, type PaginationQuery } from '../api/endpoints';
import type { GearTopCategory } from '../api/types';
import { ActionDeck } from '../components/ActionDeck';
import { DataTable, type Column } from '../components/DataTable';
import { EntityForm, type FieldConfig } from '../components/EntityForm';
import { FilterBar } from '../components/FilterBar';
import { JsonPreview } from '../components/JsonPreview';
import { PageHero } from '../components/PageHero';
import { IconEdit, IconPlus, IconSpark, IconTrash } from '../components/icons';
import { FALLBACK_ICON_KEY, TopCategoryIcon, topCategoryIconOptions } from '../components/topCategoryIcons';

interface IdPayload {
  top_category_id?: number;
}

export function TopCategoriesPage() {
  const queryClient = useQueryClient();
  const [listQuery, setListQuery] = useState<PaginationQuery>({ page: 1, limit: 30 });
  const [detailId, setDetailId] = useState<number | undefined>();

  const listQueryResult = useQuery({
    queryKey: ['topCategories', listQuery],
    queryFn: () => TopCategoryApi.list(listQuery)
  });

  const detailQuery = useQuery({
    queryKey: ['topCategories', 'detail', detailId],
    queryFn: () => (detailId ? TopCategoryApi.get(detailId) : Promise.resolve(undefined)),
    enabled: detailId !== undefined
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topCategories'] })
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<GearTopCategory>) => {
      const topCategoryId = payload.top_category_id;
      if (!topCategoryId) throw new Error('Top category ID is required');
      const requestPayload: GearTopCategory = { ...payload, top_category_id: topCategoryId };
      await TopCategoryApi.update(topCategoryId, requestPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topCategories'] });
      if (detailId) {
        queryClient.invalidateQueries({ queryKey: ['topCategories', 'detail', detailId] });
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ top_category_id }: IdPayload) => {
      if (!top_category_id) throw new Error('Top category ID is required');
      await TopCategoryApi.remove(top_category_id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topCategories'] })
  });

  const tableColumns = useMemo<Column<GearTopCategory>[]>(
    () => [
      { key: 'id', header: 'ID', render: (item: GearTopCategory) => item.top_category_id ?? '—' },
      {
        key: 'icon',
        header: 'Icon',
        render: (item: GearTopCategory) => (
          <span
            className="top-category-icon"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}
          >
            <TopCategoryIcon iconKey={item.top_category_icon} width={24} height={24} />
          </span>
        )
      },
      { key: 'name', header: 'Name', render: (item: GearTopCategory) => item.top_category_name ?? '—' }
    ],
    []
  );

  const createFields: FieldConfig<GearTopCategory>[] = [
    { name: 'top_category_name', label: 'Name', type: 'text', required: true },
    {
      name: 'top_category_icon',
      label: 'Icon',
      type: 'select',
      required: true,
      description: 'Controls which glyph appears on gear cards within this top category',
      options: iconSelectOptions
    }
  ];

  const updateFields: FieldConfig<GearTopCategory>[] = [
    { name: 'top_category_id', label: 'Top category ID', type: 'number', required: true },
    { name: 'top_category_name', label: 'Name', type: 'text' },
    {
      name: 'top_category_icon',
      label: 'Icon',
      type: 'select',
      description: 'Leave blank to keep the existing glyph',
      options: iconSelectOptions
    }
  ];

  const deleteFields: FieldConfig<IdPayload>[] = [
    { name: 'top_category_id', label: 'Top category ID', type: 'number', required: true }
  ];

  const handleListInput = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setListQuery((prev: PaginationQuery) => ({ ...prev, [name]: value ? Number(value) : undefined }));
  };

  const totalCount = listQueryResult.data?.total_item_count ?? listQueryResult.data?.items?.length ?? 0;

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

      {listQueryResult.isLoading && <div className="notice">Loading top categories…</div>}
      {listQueryResult.isError && (
        <div className="notice notice-error">
          {listQueryResult.error instanceof Error ? listQueryResult.error.message : 'Failed to load top categories'}
        </div>
      )}
      {listQueryResult.isSuccess && (
        <DataTable
          title="Top category list"
          subtitle={`Displaying ${listQueryResult.data.items?.length ?? 0} entries`}
          columns={tableColumns}
          data={listQueryResult.data.items ?? []}
          emptyMessage="No top categories found."
          actions={<IconSpark width={20} height={20} />}
        />
      )}

      <ActionDeck
        title="Top category actions"
        subtitle="Keep the macro taxonomy delightful for explorers and curators alike."
        items={[
          {
            id: 'create',
            title: 'Create',
            description: 'Launch a new top-level destination',
            tone: 'create',
            icon: <IconPlus />,
            content: (
              <EntityForm<GearTopCategory>
                title="Create top category"
                fields={createFields}
                initialValues={{ top_category_icon: FALLBACK_ICON_KEY }}
                submitLabel={insertMutation.isPending ? 'Creating…' : 'Create top category'}
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
            description: 'Rename or adjust an existing beacon',
            tone: 'update',
            icon: <IconEdit />,
            content: (
              <EntityForm<GearTopCategory>
                title="Update top category"
                fields={updateFields}
                submitLabel={updateMutation.isPending ? 'Updating…' : 'Update top category'}
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
            description: 'Retire a top category that has run its course',
            tone: 'delete',
            icon: <IconTrash />,
            content: (
              <EntityForm<IdPayload>
                title="Delete top category"
                fields={deleteFields}
                submitLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete top category'}
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
          <p>Spot check the raw response from the API for any top category ID.</p>
          <div className="form-grid" style={{ gridTemplateColumns: 'minmax(200px, 1fr)' }}>
            <div className="field">
              <label htmlFor="detailId">Top category ID</label>
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
          title="Top category payload"
          data={detailQuery.data}
          isLoading={detailQuery.isFetching}
          emptyMessage="Provide an ID to see the JSON response here."
        />
      </section>
    </>
  );
}
