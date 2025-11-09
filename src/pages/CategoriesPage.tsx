import { useMutation, useQueries, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { ChangeEvent, FormEvent, useMemo, useState } from 'react';

import { CategoryApi, GearApi, TopCategoryApi, type CategoryListQuery } from '../api/endpoints';
import type { GearCategory, GearTopCategory } from '../api/types';
import { ActionDeck } from '../components/ActionDeck';
import { EntityForm, type FieldConfig } from '../components/EntityForm';
import { FilterBar } from '../components/FilterBar';
import { JsonPreview } from '../components/JsonPreview';
import { PageHero } from '../components/PageHero';
import { IconEdit, IconMinus, IconPlus, IconTrash } from '../components/icons';
import { useConfigStore } from '../store/configStore';

import './CategoriesPage.css';

interface DeleteCategoryPayload {
  category_id?: number;
}

interface CategoryCountDescriptor {
  categoryId: number;
  topCategoryId?: number | null;
}

const GEAR_COUNT_STALE_TIME = 60_000;

const formatGearCount = (count: number) => `${count} ${count === 1 ? 'gear item' : 'gear items'}`;

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [listQuery, setListQuery] = useState<CategoryListQuery>({ page: 1, limit: 200 });
  const [detailId, setDetailId] = useState<number | undefined>();
  const [activeComposer, setActiveComposer] = useState<number | 'unassigned' | null>(null);
  const [composerDrafts, setComposerDrafts] = useState<Record<string, string>>({});
  const [composerErrors, setComposerErrors] = useState<Record<string, string | undefined>>({});
  const [categoryBusyMap, setCategoryBusyMap] = useState<Record<number, boolean>>({});
  const [categoryEditingMap, setCategoryEditingMap] = useState<Record<number, boolean>>({});
  const [categoryEditDrafts, setCategoryEditDrafts] = useState<Record<number, string>>({});
  const [categoryEditErrors, setCategoryEditErrors] = useState<Record<number, string | undefined>>({});
  const [categorySavingMap, setCategorySavingMap] = useState<Record<number, boolean>>({});
  const [topCategoryEditingMap, setTopCategoryEditingMap] = useState<Record<number, boolean>>({});
  const [topCategoryEditDrafts, setTopCategoryEditDrafts] = useState<Record<number, string>>({});
  const [topCategoryEditErrors, setTopCategoryEditErrors] = useState<Record<number, string | undefined>>({});
  const [topCategorySavingMap, setTopCategorySavingMap] = useState<Record<number, boolean>>({});
  const [topCategoryBusyMap, setTopCategoryBusyMap] = useState<Record<number, boolean>>({});

  const authUser = useConfigStore((state) => state.user);
  const isAdmin = Boolean(authUser?.isAdmin);

  const listQueryResult = useQuery({
    queryKey: ['categories', listQuery],
    queryFn: () => CategoryApi.list(listQuery)
  });

  const topCategoryQuery = useQuery({
    queryKey: ['topCategories', 'categories-page'],
    queryFn: () => TopCategoryApi.list({ limit: 500 })
  });

  const detailQuery = useQuery({
    queryKey: ['categories', 'detail', detailId],
    queryFn: () => (detailId ? CategoryApi.get(detailId) : Promise.resolve(undefined)),
    enabled: detailId !== undefined
  });

  const insertMutation = useMutation({
    mutationFn: (payload: GearCategory) => CategoryApi.insert(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });

  const insertTopMutation = useMutation({
    mutationFn: async (payload: Partial<GearTopCategory>) => {
      const name = payload.top_category_name?.trim();
      if (!name) throw new Error('Top category name is required');
      await TopCategoryApi.insert({ top_category_name: name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topCategories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const updateTopMutation = useMutation({
    mutationFn: async (payload: Partial<GearTopCategory>) => {
      const topCategoryId = payload.top_category_id;
      if (!topCategoryId) throw new Error('Top category ID is required');
      const requestPayload: GearTopCategory = { ...payload, top_category_id: topCategoryId } as GearTopCategory;
      await TopCategoryApi.update(topCategoryId, requestPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topCategories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<GearCategory>) => {
      const categoryId = payload.category_id;
      if (!categoryId) throw new Error('Category ID is required');
      const requestPayload: GearCategory = { ...payload, category_id: categoryId };
      await CategoryApi.update(categoryId, requestPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (detailId) {
        queryClient.invalidateQueries({ queryKey: ['categories', 'detail', detailId] });
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ category_id }: DeleteCategoryPayload) => {
      if (!category_id) throw new Error('Category ID is required');
      await CategoryApi.remove(category_id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });

  const deleteTopMutation = useMutation({
    mutationFn: async ({ top_category_id }: Partial<GearTopCategory>) => {
      if (!top_category_id) throw new Error('Top category ID is required');
      await TopCategoryApi.remove(top_category_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topCategories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const insertFields: FieldConfig<GearCategory>[] = [
    { name: 'category_name', label: 'Category name', type: 'text', required: true },
    {
      name: 'category_top_category_id',
      label: 'Top category ID',
      type: 'number',
      description: 'Optional link to an existing top category'
    }
  ];

  const updateFields: FieldConfig<GearCategory>[] = [
    { name: 'category_id', label: 'Category ID', type: 'number', required: true },
    { name: 'category_name', label: 'Category name', type: 'text' },
    {
      name: 'category_top_category_id',
      label: 'Top category ID',
      type: 'number',
      description: 'Leave blank to keep existing value'
    }
  ];

  const deleteFields: FieldConfig<DeleteCategoryPayload>[] = [
    { name: 'category_id', label: 'Category ID', type: 'number', required: true }
  ];

  const insertTopFields: FieldConfig<GearTopCategory>[] = [
    { name: 'top_category_name', label: 'Top category name', type: 'text', required: true }
  ];

  const deleteTopFields: FieldConfig<GearTopCategory>[] = [
    { name: 'top_category_id', label: 'Top category ID', type: 'number', required: true }
  ];

  const handleListInput = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setListQuery((prev: CategoryListQuery) => {
      if (!value) {
        return { ...prev, [name]: undefined };
      }

      if (name === 'page' || name === 'limit') {
        return { ...prev, [name]: Number(value) };
      }

      const parsed = value
        .split(',')
        .map((token: string) => Number(token.trim()))
        .filter((token: number) => !Number.isNaN(token));
      return { ...prev, [name]: parsed.length ? parsed : undefined };
    });
  };

  const totalCount = listQueryResult.data?.total_item_count ?? listQueryResult.data?.items?.length ?? 0;

  const taxonomy = useMemo(() => {
    const topCategories = topCategoryQuery.data?.items ?? [];
    const categories = listQueryResult.data?.items ?? [];

    const groupMap = new Map<number, { topCategory: GearTopCategory; categories: GearCategory[] }>();

    topCategories.forEach((topCategory) => {
      if (topCategory.top_category_id === undefined || topCategory.top_category_id === null) return;
      groupMap.set(topCategory.top_category_id, { topCategory, categories: [] });
    });

    const fallbackGroup = (topCategoryId: number) => {
      if (!groupMap.has(topCategoryId)) {
        groupMap.set(topCategoryId, {
          topCategory: {
            top_category_id: topCategoryId,
            top_category_name: `Top category #${topCategoryId}`
          },
          categories: []
        });
      }
      return groupMap.get(topCategoryId)!;
    };

    const unassigned: GearCategory[] = [];

    categories.forEach((category) => {
      const topCategoryId = category.category_top_category_id;
      if (topCategoryId === undefined || topCategoryId === null) {
        unassigned.push(category);
        return;
      }
      const bucket = fallbackGroup(topCategoryId);
      bucket.categories.push(category);
    });

    const groups = Array.from(groupMap.values())
      .map((entry) => ({
        ...entry,
        categories: [...entry.categories].sort((a, b) => (a.category_name ?? '').localeCompare(b.category_name ?? ''))
      }))
      .sort((a, b) => (a.topCategory.top_category_name ?? '').localeCompare(b.topCategory.top_category_name ?? ''));

    unassigned.sort((a, b) => (a.category_name ?? '').localeCompare(b.category_name ?? ''));

    return { groups, unassigned };
  }, [listQueryResult.data?.items, topCategoryQuery.data?.items]);

  const categoriesForCounts = useMemo<CategoryCountDescriptor[]>(() => {
    const descriptors: CategoryCountDescriptor[] = [];

    taxonomy.groups.forEach((group) => {
      const groupTopCategoryId = group.topCategory.top_category_id;
      group.categories.forEach((category) => {
        if (typeof category.category_id !== 'number') return;
        descriptors.push({
          categoryId: category.category_id,
          topCategoryId: groupTopCategoryId ?? category.category_top_category_id ?? null
        });
      });
    });

    taxonomy.unassigned.forEach((category) => {
      if (typeof category.category_id !== 'number') return;
      descriptors.push({
        categoryId: category.category_id,
        topCategoryId: category.category_top_category_id ?? null
      });
    });

    return descriptors;
  }, [taxonomy.groups, taxonomy.unassigned]);

  const categoryCountQueries = useQueries({
    queries: categoriesForCounts.map(({ categoryId, topCategoryId }) => ({
      queryKey: ['gear', 'count', categoryId, topCategoryId ?? null],
      queryFn: async () => {
        const response = await GearApi.list({
          page: 1,
          limit: 1,
          category: String(categoryId),
          topCategory: topCategoryId !== undefined && topCategoryId !== null ? String(topCategoryId) : undefined
        });
        return response.total_item_count ?? response.items?.length ?? 0;
      },
      enabled: Number.isFinite(categoryId),
      staleTime: GEAR_COUNT_STALE_TIME,
      keepPreviousData: true
    }))
  }) as UseQueryResult<number>[];

  const categoryGearCountMap = useMemo(() => {
    const map = new Map<number, { count?: number; isLoading: boolean; isError: boolean }>();
    categoriesForCounts.forEach(({ categoryId }, index) => {
      const query = categoryCountQueries[index];
      if (!query) return;
      map.set(categoryId, {
        count: query.data,
        isLoading: query.isLoading,
        isError: query.isError
      });
    });
    return map;
  }, [categoriesForCounts, categoryCountQueries]);

  const topCategoryCount = topCategoryQuery.data?.items?.length ?? taxonomy.groups.length;
  const unassignedCount = taxonomy.unassigned.length;

  const getComposerKey = (id: number | 'unassigned') => (id === 'unassigned' ? 'unassigned' : String(id));

  const handleComposerChange = (id: number | 'unassigned', value: string) => {
    const key = getComposerKey(id);
    setComposerDrafts((prev) => ({ ...prev, [key]: value }));
  };

  const handleComposerSubmit = async (event: FormEvent<HTMLFormElement>, id: number | 'unassigned') => {
    event.preventDefault();
    const key = getComposerKey(id);
    const name = composerDrafts[key]?.trim();

    if (!name) {
      setComposerErrors((prev) => ({ ...prev, [key]: 'Please provide a category name' }));
      return;
    }

    setComposerErrors((prev) => ({ ...prev, [key]: undefined }));

    try {
      await insertMutation.mutateAsync({
        category_name: name,
        category_top_category_id: id === 'unassigned' ? undefined : id
      });
      setComposerDrafts((prev) => ({ ...prev, [key]: '' }));
      setActiveComposer(null);
    } catch (error) {
      setComposerErrors((prev) => ({
        ...prev,
        [key]: error instanceof Error ? error.message : 'Failed to create category'
      }));
    }
  };

  const handleRemoveCategory = async (categoryId: number) => {
    setCategoryBusyMap((prev) => ({ ...prev, [categoryId]: true }));
    try {
      await deleteMutation.mutateAsync({ category_id: categoryId });
    } catch (error) {
      console.error('Failed to delete category', error);
    } finally {
      setCategoryBusyMap((prev) => {
        const next = { ...prev };
        delete next[categoryId];
        return next;
      });
    }
  };

  const handleStartCategoryEdit = (categoryId: number, currentName: string) => {
    setCategoryEditingMap((prev) => ({ ...prev, [categoryId]: true }));
    setCategoryEditDrafts((prev) => ({ ...prev, [categoryId]: currentName }));
    setCategoryEditErrors((prev) => ({ ...prev, [categoryId]: undefined }));
  };

  const handleCategoryEditInput = (categoryId: number, value: string) => {
    setCategoryEditDrafts((prev) => ({ ...prev, [categoryId]: value }));
    setCategoryEditErrors((prev) => ({ ...prev, [categoryId]: undefined }));
  };

  const handleCancelCategoryEdit = (categoryId: number) => {
    setCategoryEditingMap((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
    setCategoryEditDrafts((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
    setCategoryEditErrors((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  };

  const handleSaveCategoryName = async (categoryId: number) => {
    const draft = categoryEditDrafts[categoryId]?.trim();
    if (!draft) {
      setCategoryEditErrors((prev) => ({ ...prev, [categoryId]: 'Please provide a category name' }));
      return;
    }

    setCategoryEditErrors((prev) => ({ ...prev, [categoryId]: undefined }));
    setCategorySavingMap((prev) => ({ ...prev, [categoryId]: true }));

    try {
      await updateMutation.mutateAsync({ category_id: categoryId, category_name: draft });
      handleCancelCategoryEdit(categoryId);
    } catch (error) {
      setCategoryEditErrors((prev) => ({
        ...prev,
        [categoryId]: error instanceof Error ? error.message : 'Failed to update category'
      }));
    } finally {
      setCategorySavingMap((prev) => {
        const next = { ...prev };
        delete next[categoryId];
        return next;
      });
    }
  };

  const handleStartTopCategoryEdit = (topCategoryId: number, currentName: string) => {
    setTopCategoryEditingMap((prev) => ({ ...prev, [topCategoryId]: true }));
    setTopCategoryEditDrafts((prev) => ({ ...prev, [topCategoryId]: currentName }));
    setTopCategoryEditErrors((prev) => ({ ...prev, [topCategoryId]: undefined }));
  };

  const handleTopCategoryEditInput = (topCategoryId: number, value: string) => {
    setTopCategoryEditDrafts((prev) => ({ ...prev, [topCategoryId]: value }));
    setTopCategoryEditErrors((prev) => ({ ...prev, [topCategoryId]: undefined }));
  };

  const handleCancelTopCategoryEdit = (topCategoryId: number) => {
    setTopCategoryEditingMap((prev) => {
      const next = { ...prev };
      delete next[topCategoryId];
      return next;
    });
    setTopCategoryEditDrafts((prev) => {
      const next = { ...prev };
      delete next[topCategoryId];
      return next;
    });
    setTopCategoryEditErrors((prev) => {
      const next = { ...prev };
      delete next[topCategoryId];
      return next;
    });
  };

  const handleSaveTopCategoryName = async (topCategoryId: number) => {
    const draft = topCategoryEditDrafts[topCategoryId]?.trim();
    if (!draft) {
      setTopCategoryEditErrors((prev) => ({ ...prev, [topCategoryId]: 'Please provide a top category name' }));
      return;
    }

    setTopCategoryEditErrors((prev) => ({ ...prev, [topCategoryId]: undefined }));
    setTopCategorySavingMap((prev) => ({ ...prev, [topCategoryId]: true }));

    try {
      await updateTopMutation.mutateAsync({ top_category_id: topCategoryId, top_category_name: draft });
      handleCancelTopCategoryEdit(topCategoryId);
    } catch (error) {
      setTopCategoryEditErrors((prev) => ({
        ...prev,
        [topCategoryId]: error instanceof Error ? error.message : 'Failed to update top category'
      }));
    } finally {
      setTopCategorySavingMap((prev) => {
        const next = { ...prev };
        delete next[topCategoryId];
        return next;
      });
    }
  };

  const handleRemoveTopCategory = async (topCategoryId: number) => {
    setTopCategoryBusyMap((prev) => ({ ...prev, [topCategoryId]: true }));
    try {
      await deleteTopMutation.mutateAsync({ top_category_id: topCategoryId });
    } catch (error) {
      console.error('Failed to delete top category', error);
    } finally {
      setTopCategoryBusyMap((prev) => {
        const next = { ...prev };
        delete next[topCategoryId];
        return next;
      });
    }
  };

  const categoryInputValue = Array.isArray(listQuery.category)
    ? listQuery.category.join(', ')
    : listQuery.category ?? '';
  const topCategoryInputValue = Array.isArray(listQuery.topCategory)
    ? listQuery.topCategory.join(', ')
    : listQuery.topCategory ?? '';

  return (
    <>
      <PageHero
        title="Category atlas"
        subtitle="Label and group gear so explorers can browse collections without friction."
        badge="Taxonomy"
        metrics={[
          {
            label: 'Visible categories',
            value: totalCount,
            hint: `Page ${listQuery.page ?? 1} • Limit ${listQuery.limit ?? 200}`,
            tone: totalCount > 0 ? 'positive' : 'default'
          },
          {
            label: 'Top categories',
            value: topCategoryCount,
            hint: `${taxonomy.groups.length} with visible categories`,
            tone: topCategoryCount > 0 ? 'positive' : 'default'
          },
          {
            label: 'Unassigned categories',
            value: unassignedCount,
            hint: unassignedCount > 0 ? 'Assign these soon' : 'All categories linked',
            tone: unassignedCount > 0 ? 'warning' : 'positive'
          }
        ]}
        actions={
          <button
            className="button ghost"
            type="button"
            onClick={() => {
              void listQueryResult.refetch();
              void topCategoryQuery.refetch();
            }}
          >
            Refresh taxonomy
          </button>
        }
      />

      <FilterBar
        title="Browse categories"
        subtitle="Adjust filters and page through the hierarchy without losing your spot."
        tone="highlight"
        actions={
          <button className="button ghost" type="button" onClick={() => setListQuery({ page: 1, limit: 200 })}>
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
          <input id="limit" name="limit" type="number" value={listQuery.limit ?? 200} onChange={handleListInput} />
        </div>
        <div className="filter-chip">
          <label htmlFor="category">Category IDs</label>
          <input
            id="category"
            name="category"
            placeholder="1, 2, 3"
            value={categoryInputValue}
            onChange={handleListInput}
          />
        </div>
        <div className="filter-chip">
          <label htmlFor="topCategory">Top category IDs</label>
          <input
            id="topCategory"
            name="topCategory"
            placeholder="10, 11"
            value={topCategoryInputValue}
            onChange={handleListInput}
          />
        </div>
      </FilterBar>

      {(listQueryResult.isLoading || topCategoryQuery.isLoading) && <div className="notice">Loading taxonomy…</div>}
      {(listQueryResult.isError || topCategoryQuery.isError) && (
        <div className="notice notice-error">
          {listQueryResult.isError &&
            (listQueryResult.error instanceof Error
              ? listQueryResult.error.message
              : 'Failed to load categories')}
          {topCategoryQuery.isError &&
            (topCategoryQuery.error instanceof Error
              ? ` Top categories: ${topCategoryQuery.error.message}`
              : ' Top categories failed to load')}
        </div>
      )}

      {(taxonomy.groups.length > 0 || taxonomy.unassigned.length > 0 || topCategoryQuery.data) && (
        <section className="taxonomy-grid" aria-label="Category taxonomy">
          {taxonomy.groups.map((group) => {
            const topCategoryId = group.topCategory.top_category_id;
            const composerId = typeof topCategoryId === 'number' ? topCategoryId : 'unassigned';
            const composerKey = getComposerKey(composerId);
            const totalInGroup = group.categories.length;
            const topCategoryName = group.topCategory.top_category_name ?? `Top category #${composerKey}`;
            const isTopCategoryEditable = isAdmin && typeof topCategoryId === 'number';
            const isTopEditing = isTopCategoryEditable ? Boolean(topCategoryEditingMap[topCategoryId]) : false;
            const topDraftValue = isTopCategoryEditable
              ? topCategoryEditDrafts[topCategoryId] ?? group.topCategory.top_category_name ?? ''
              : topCategoryName;
            const topSaving = isTopCategoryEditable ? Boolean(topCategorySavingMap[topCategoryId]) : false;
            const topEditError = isTopCategoryEditable ? topCategoryEditErrors[topCategoryId] : undefined;
            const isTopRemoving = isTopCategoryEditable ? Boolean(topCategoryBusyMap[topCategoryId]) : false;
            const disableTopRemove = !isTopCategoryEditable || isTopRemoving || deleteTopMutation.isPending;

            return (
              <article className="taxonomy-card" key={`top-${composerKey}`}>
                <header>
                  <div className="taxonomy-header-content">
                    {isTopEditing ? (
                      <form
                        className="taxonomy-edit-form"
                        onSubmit={(event) => {
                          event.preventDefault();
                          if (typeof topCategoryId === 'number') {
                            void handleSaveTopCategoryName(topCategoryId);
                          }
                        }}
                      >
                        <input
                          value={topDraftValue}
                          onChange={(event) => {
                            if (typeof topCategoryId === 'number') {
                              handleTopCategoryEditInput(topCategoryId, event.target.value);
                            }
                          }}
                          placeholder="Top category name"
                          autoFocus
                        />
                        <div className="taxonomy-edit-actions">
                          <button
                            className="button ghost"
                            type="submit"
                            disabled={topSaving || updateTopMutation.isPending}
                          >
                            {topSaving || updateTopMutation.isPending ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            className="button ghost"
                            type="button"
                            disabled={topSaving}
                            onClick={() => {
                              if (typeof topCategoryId === 'number') {
                                handleCancelTopCategoryEdit(topCategoryId);
                              }
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                        {typeof topCategoryId === 'number' && topEditError && (
                          <p className="taxonomy-error">{topEditError}</p>
                        )}
                      </form>
                    ) : (
                      <h3>{topCategoryName}</h3>
                    )}
                    <span>{totalInGroup} {totalInGroup === 1 ? 'sub category' : 'sub categories'}</span>
                  </div>
                  <div className="taxonomy-actions">
                    {isTopCategoryEditable && !isTopEditing && typeof topCategoryId === 'number' && (
                      <>
                        <button
                          className="taxonomy-action-button taxonomy-edit"
                          type="button"
                          onClick={() => handleStartTopCategoryEdit(topCategoryId, group.topCategory.top_category_name ?? '')}
                          aria-label="Edit top category name"
                          title="Edit top category"
                        >
                          <IconEdit width={18} height={18} />
                        </button>
                        <button
                          className="taxonomy-action-button taxonomy-remove"
                          type="button"
                          aria-label="Remove top category"
                          title="Remove top category"
                          disabled={disableTopRemove}
                          onClick={() => {
                            if (typeof topCategoryId === 'number') {
                              void handleRemoveTopCategory(topCategoryId);
                            }
                          }}
                        >
                          {isTopRemoving ? '…' : <IconMinus width={18} height={18} />}
                        </button>
                      </>
                    )}
                    {typeof topCategoryId === 'number' && (
                      <button
                        className="button ghost icon"
                        type="button"
                        onClick={() => setActiveComposer((prev) => (prev === composerId ? null : composerId))}
                        aria-label="Create category under this top category"
                        title="Create category"
                      >
                        <IconPlus width={18} height={18} />
                      </button>
                    )}
                  </div>
                </header>

                {group.categories.length > 0 ? (
                  <ul className="taxonomy-list">
                    {group.categories.map((category) => {
                      const categoryId = category.category_id;
                      const isRemoving = categoryId !== undefined ? Boolean(categoryBusyMap[categoryId]) : false;
                      const disableRemove = categoryId === undefined || isRemoving || deleteMutation.isPending;
                      const removeLabel = `Remove ${category.category_name ?? 'category'}`;
                      const isEditable = isAdmin && categoryId !== undefined;
                      const isEditing = isEditable ? Boolean(categoryEditingMap[categoryId]) : false;
                      const saveInFlight = isEditable ? Boolean(categorySavingMap[categoryId]) : false;
                      const editDraftValue = isEditable
                        ? categoryEditDrafts[categoryId] ?? category.category_name ?? ''
                        : category.category_name ?? '';
                      const editError = isEditable ? categoryEditErrors[categoryId] : undefined;
                      const gearCountInfo = categoryId !== undefined ? categoryGearCountMap.get(categoryId) : undefined;
                      const gearCountLabel = gearCountInfo?.isLoading
                        ? 'Counting gear…'
                        : gearCountInfo?.isError
                          ? 'Count unavailable'
                          : formatGearCount(gearCountInfo?.count ?? 0);
                      return (
                        <li
                          className="taxonomy-item"
                          key={categoryId ?? `${composerKey}-${category.category_name}`}
                        >
                          <div className="taxonomy-item-content">
                            {isEditing ? (
                              <form
                                className="taxonomy-edit-form"
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  if (categoryId !== undefined) {
                                    void handleSaveCategoryName(categoryId);
                                  }
                                }}
                              >
                                <input
                                  value={editDraftValue}
                                  onChange={(event) => {
                                    if (categoryId !== undefined) {
                                      handleCategoryEditInput(categoryId, event.target.value);
                                    }
                                  }}
                                  placeholder="Category name"
                                  autoFocus
                                />
                                <div className="taxonomy-edit-actions">
                                  <button
                                    className="button ghost"
                                    type="submit"
                                    disabled={saveInFlight || updateMutation.isPending}
                                  >
                                    {saveInFlight || updateMutation.isPending ? 'Saving…' : 'Save'}
                                  </button>
                                  <button
                                    className="button ghost"
                                    type="button"
                                    disabled={saveInFlight}
                                    onClick={() => {
                                      if (categoryId !== undefined) {
                                        handleCancelCategoryEdit(categoryId);
                                      }
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                                {categoryId !== undefined && editError && (
                                  <p className="taxonomy-error">{editError}</p>
                                )}
                              </form>
                            ) : (
                              <>
                                <strong>{category.category_name ?? 'Unnamed category'}</strong>
                                <div className="taxonomy-meta">
                                  <span>ID #{categoryId ?? '—'}</span>
                                  {categoryId !== undefined && <span>{gearCountLabel}</span>}
                                </div>
                              </>
                            )}
                          </div>
                          {isEditable && (
                            <div className="taxonomy-item-actions">
                              {!isEditing && (
                                <button
                                  type="button"
                                  className="taxonomy-action-button taxonomy-edit"
                                  aria-label={`Edit ${category.category_name ?? 'category'}`}
                                  title="Edit category name"
                                  onClick={() => {
                                    if (categoryId !== undefined) {
                                      handleStartCategoryEdit(categoryId, category.category_name ?? '');
                                    }
                                  }}
                                >
                                  <IconEdit width={18} height={18} />
                                </button>
                              )}
                              {!isEditing && (
                                <button
                                  type="button"
                                  className="taxonomy-action-button taxonomy-remove"
                                  aria-label={removeLabel}
                                  title={removeLabel}
                                  disabled={disableRemove}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (categoryId !== undefined) {
                                      void handleRemoveCategory(categoryId);
                                    }
                                  }}
                                >
                                  {isRemoving ? '…' : <IconMinus width={18} height={18} />}
                                </button>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="taxonomy-empty">No categories yet. Use the + button to add one.</div>
                )}

                {activeComposer === composerId && (
                  <form className="taxonomy-composer" onSubmit={(event) => handleComposerSubmit(event, composerId)}>
                    <input
                      id={`composer-${composerKey}`}
                      value={composerDrafts[composerKey] ?? ''}
                      onChange={(event) => handleComposerChange(composerId, event.target.value)}
                      placeholder="New category name"
                      autoFocus
                    />
                    <button className="button" type="submit" disabled={insertMutation.isPending}>
                      {insertMutation.isPending ? 'Creating…' : 'Create'}
                    </button>
                  </form>
                )}
                {composerErrors[composerKey] && <p className="taxonomy-error">{composerErrors[composerKey]}</p>}
              </article>
            );
          })}

          <article className="taxonomy-card" key="top-unassigned">
            <header>
              <div>
                <h3>Unassigned sub   categories</h3>
                <span>{taxonomy.unassigned.length} sub categories</span>
              </div>
              <div className="taxonomy-actions">
                <button
                  className="button ghost icon"
                  type="button"
                  onClick={() => setActiveComposer((prev) => (prev === 'unassigned' ? null : 'unassigned'))}
                  aria-label="Create unassigned category"
                  title="Create category"
                >
                  <IconPlus width={18} height={18} />
                </button>
              </div>
            </header>

            {taxonomy.unassigned.length > 0 ? (
              <ul className="taxonomy-list">
                {taxonomy.unassigned.map((category) => {
                  const categoryId = category.category_id;
                  const isRemoving = categoryId !== undefined ? Boolean(categoryBusyMap[categoryId]) : false;
                  const disableRemove = categoryId === undefined || isRemoving || deleteMutation.isPending;
                  const removeLabel = `Remove ${category.category_name ?? 'category'}`;
                  const isEditable = isAdmin && categoryId !== undefined;
                  const isEditing = isEditable ? Boolean(categoryEditingMap[categoryId]) : false;
                  const saveInFlight = isEditable ? Boolean(categorySavingMap[categoryId]) : false;
                  const editDraftValue = isEditable
                    ? categoryEditDrafts[categoryId] ?? category.category_name ?? ''
                    : category.category_name ?? '';
                  const editError = isEditable ? categoryEditErrors[categoryId] : undefined;
                  const gearCountInfo = categoryId !== undefined ? categoryGearCountMap.get(categoryId) : undefined;
                  const gearCountLabel = gearCountInfo?.isLoading
                    ? 'Counting gear…'
                    : gearCountInfo?.isError
                      ? 'Count unavailable'
                      : formatGearCount(gearCountInfo?.count ?? 0);
                  return (
                    <li
                      className="taxonomy-item"
                      key={`unassigned-${categoryId ?? category.category_name}`}
                    >
                      <div className="taxonomy-item-content">
                        {isEditing ? (
                          <form
                            className="taxonomy-edit-form"
                            onSubmit={(event) => {
                              event.preventDefault();
                              if (categoryId !== undefined) {
                                void handleSaveCategoryName(categoryId);
                              }
                            }}
                          >
                            <input
                              value={editDraftValue}
                              onChange={(event) => {
                                if (categoryId !== undefined) {
                                  handleCategoryEditInput(categoryId, event.target.value);
                                }
                              }}
                              placeholder="Category name"
                              autoFocus
                            />
                            <div className="taxonomy-edit-actions">
                              <button
                                className="button ghost"
                                type="submit"
                                disabled={saveInFlight || updateMutation.isPending}
                              >
                                {saveInFlight || updateMutation.isPending ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                className="button ghost"
                                type="button"
                                disabled={saveInFlight}
                                onClick={() => {
                                  if (categoryId !== undefined) {
                                    handleCancelCategoryEdit(categoryId);
                                  }
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                            {categoryId !== undefined && editError && (
                              <p className="taxonomy-error">{editError}</p>
                            )}
                          </form>
                        ) : (
                          <>
                            <strong>{category.category_name ?? 'Unnamed category'}</strong>
                            <div className="taxonomy-meta">
                              <span>ID #{categoryId ?? '—'}</span>
                              {categoryId !== undefined && <span>{gearCountLabel}</span>}
                            </div>
                          </>
                        )}
                      </div>
                      {isEditable && (
                        <div className="taxonomy-item-actions">
                          {!isEditing && (
                            <button
                              type="button"
                              className="taxonomy-action-button taxonomy-edit"
                              aria-label={`Edit ${category.category_name ?? 'category'}`}
                              title="Edit category name"
                              onClick={() => {
                                if (categoryId !== undefined) {
                                  handleStartCategoryEdit(categoryId, category.category_name ?? '');
                                }
                              }}
                            >
                              <IconEdit width={18} height={18} />
                            </button>
                          )}
                          {!isEditing && (
                            <button
                              type="button"
                              className="taxonomy-action-button taxonomy-remove"
                              aria-label={removeLabel}
                              title={removeLabel}
                              disabled={disableRemove}
                              onClick={(event) => {
                                event.stopPropagation();
                                if (categoryId !== undefined) {
                                  void handleRemoveCategory(categoryId);
                                }
                              }}
                            >
                              {isRemoving ? '…' : <IconMinus width={18} height={18} />}
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="taxonomy-empty">Everything is linked to a top category. Nice work!</div>
            )}

            {activeComposer === 'unassigned' && (
              <form className="taxonomy-composer" onSubmit={(event) => handleComposerSubmit(event, 'unassigned')}>
                <input
                  id="composer-unassigned"
                  value={composerDrafts.unassigned ?? ''}
                  onChange={(event) => handleComposerChange('unassigned', event.target.value)}
                  placeholder="New category name"
                  autoFocus
                />
                <button className="button" type="submit" disabled={insertMutation.isPending}>
                  {insertMutation.isPending ? 'Creating…' : 'Create'}
                </button>
              </form>
            )}
            {composerErrors.unassigned && <p className="taxonomy-error">{composerErrors.unassigned}</p>}
          </article>
        </section>
      )}

      <ActionDeck
        title="Taxonomy actions"
        subtitle="Create, edit, or retire top categories and their sub categories without leaving the explorer. Use the cards above for quick adds under a specific top category."
        items={[
          {
            id: 'top-create',
            title: 'Create top category',
            description: 'Start a new branch at the top of the taxonomy',
            tone: 'create',
            icon: <IconPlus />,
            content: (
              <EntityForm<GearTopCategory>
                title="New top category"
                fields={insertTopFields}
                submitLabel={insertTopMutation.isPending ? 'Creating…' : 'Create top category'}
                onSubmit={async (values) => {
                  await insertTopMutation.mutateAsync(values);
                }}
                variant="inline"
              />
            )
          },
          {
            id: 'top-delete',
            title: 'Delete top category',
            description: 'Retire a top-level group you no longer need',
            tone: 'delete',
            icon: <IconTrash />,
            content: (
              <EntityForm<GearTopCategory>
                title="Delete top category"
                fields={deleteTopFields}
                submitLabel={deleteTopMutation.isPending ? 'Deleting…' : 'Delete top category'}
                onSubmit={async (values) => {
                  await deleteTopMutation.mutateAsync(values);
                }}
                variant="inline"
              />
            )
          },
          {
            id: 'create',
            title: 'Create',
            description: 'Add a fresh category to the taxonomy',
            tone: 'create',
            icon: <IconPlus />,
            content: (
              <EntityForm<GearCategory>
                title="New category"
                fields={insertFields}
                submitLabel={insertMutation.isPending ? 'Creating…' : 'Create category'}
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
            description: 'Adjust name or relationships',
            tone: 'update',
            icon: <IconEdit />,
            content: (
              <EntityForm<GearCategory>
                title="Update category"
                fields={updateFields}
                submitLabel={updateMutation.isPending ? 'Updating…' : 'Update category'}
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
            description: 'Retire a category that is no longer needed',
            tone: 'delete',
            icon: <IconTrash />,
            content: (
              <EntityForm<DeleteCategoryPayload>
                title="Delete category"
                fields={deleteFields}
                submitLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete category'}
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
          <p>Type an ID to instantly view the raw payload exactly as the API returns it.</p>
          <div className="form-grid" style={{ gridTemplateColumns: 'minmax(200px, 1fr)' }}>
            <div className="field">
              <label htmlFor="detailId">Category ID</label>
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
          title="Category payload"
          data={detailQuery.data}
          isLoading={detailQuery.isFetching}
          emptyMessage="Pick an ID to preview the data structure."
        />
      </section>
    </>
  );
}
