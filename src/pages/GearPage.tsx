import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChangeEvent,
  DragEvent,
  Fragment,
  MouseEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from 'react';
import type { ReactNode } from 'react';

import { CategoryApi, GearApi, TopCategoryApi, UserGearApi } from '../api/endpoints';
import type { FullGear, Gear, GearListItem, UserGear, UserGearLinkNoID } from '../api/types';
import { EntityForm, type FieldConfig } from '../components/EntityForm';
import { JsonPreview } from '../components/JsonPreview';
import { PageHero } from '../components/PageHero';
import { IconChevronDown, IconChevronRight, IconCube, IconPlus, IconSpark, IconTrash } from '../components/icons';
import { TopCategoryIcon } from '../components/topCategoryIcons';
import { useConfigStore, type AuthUser } from '../store/configStore';

import './GearPage.css';
import '../styles/gearCard.css';

type MyGearStatus = 'pending' | 'success' | 'error' | 'undoing';

interface MyGearEntry {
  identifier: string;
  gear: GearListItem;
  status: MyGearStatus;
  registrationId?: number;
  errorMessage?: string;
  isFading?: boolean;
}

type TopCategoryOption = {
  id?: number;
  name: string;
};

type CategoryOption = {
  id?: number;
  name: string;
};

const DRAG_DATA_TYPE = 'application/x-gogear-item';
const AUTOLOAD_PAGE_LIMIT = 4;
const MIN_SEARCH_LENGTH = 3;
const SEARCH_CHAR_STEP = 2;
const SEARCH_IDLE_DELAY_MS = 1000;

const CREATE_FIELDS: FieldConfig<Gear>[] = [
  { name: 'gear_name', label: 'Name', type: 'text', required: true },
  { name: 'gear_category_id', label: 'Category ID', type: 'number', required: true },
  { name: 'gear_top_category_id', label: 'Top category ID', type: 'number', required: true },
  { name: 'gear_manufacture_id', label: 'Manufacturer ID', type: 'number' },
  { name: 'gear_weight', label: 'Weight', type: 'number' },
  { name: 'gear_height', label: 'Height', type: 'number' },
  { name: 'gear_length', label: 'Length', type: 'number' },
  { name: 'gear_width', label: 'Width', type: 'number' },
  { name: 'gear_size_definition', label: 'Size definition', type: 'textarea' },
  { name: 'gear_status', label: 'Status', type: 'boolean', description: 'Mark as active when true' }
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatches(text: string, tokens: string[]): ReactNode {
  if (!text) return text;
  const uniqueTokens = Array.from(new Set(tokens.map((token) => token.trim()).filter(Boolean)));
  if (uniqueTokens.length === 0) return text;

  const pattern = uniqueTokens.map(escapeRegExp).join('|');
  if (!pattern) return text;

  const regex = new RegExp(`(${pattern})`, 'gi');
  const segments = text.split(regex);
  const lowerTokens = uniqueTokens.map((token) => token.toLowerCase());

  return segments.map((segment, index) => {
    if (!segment) return null;
    const isMatch = lowerTokens.includes(segment.toLowerCase());
    return isMatch ? (
      <mark key={`match-${index}`} className="gear-highlight">
        {segment}
      </mark>
    ) : (
      <Fragment key={`text-${index}`}>{segment}</Fragment>
    );
  });
}

function gearIdentifier(gear: GearListItem) {
  if (gear.gear_id !== undefined && gear.gear_id !== null) {
    return `id-${gear.gear_id}`;
  }
  const name = gear.gear_name ?? 'gear';
  const manufacture = gear.manufacture_name ?? 'manufacturer';
  return `name-${name.toLowerCase()}-${manufacture.toLowerCase()}`;
}

function resolveNumericUserId(user?: AuthUser) {
  const raw = user?.id;
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error occurred';
  }
}

export function GearPage() {
  const queryClient = useQueryClient();
  const gearListLimit = useConfigStore((state) => state.gearListLimit);
  const normalizedGearListLimit = gearListLimit > 0 ? gearListLimit : 50;

  const user = useConfigStore((state) => state.user);
  const numericUserId = resolveNumericUserId(user);
  const isAdmin = user?.isAdmin ?? false;

  const [searchTerm, setSearchTerm] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [detailId, setDetailId] = useState<number | undefined>();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [myGear, setMyGear] = useState<MyGearEntry[]>([]);
  const [isDropTargetActive, setDropTargetActive] = useState(false);
  const [expandedGearMap, setExpandedGearMap] = useState<Record<string, boolean>>({});

  const throttleTimeoutRef = useRef<number | undefined>();
  const lastCommittedRef = useRef('');
  const searchSentinelRef = useRef<HTMLDivElement | null>(null);
  const dragItemRegistryRef = useRef<Map<string, GearListItem>>(new Map());
  const [removalBusyMap, setRemovalBusyMap] = useState<Record<string, boolean>>({});
  const [gearActionFeedbackState, setGearActionFeedbackState] = useState<
    Record<string, { tone: 'info' | 'error'; message: string }>
  >({});
  const gearActionFeedbackTimers = useRef<Record<string, number>>({});

  const myGearRef = useRef<MyGearEntry[]>([]);
  useEffect(() => {
    myGearRef.current = myGear;
  }, [myGear]);

  const fadeTimers = useRef<Record<string, { fade?: number; remove?: number }>>({});
  useEffect(() => {
    return () => {
      Object.values(fadeTimers.current).forEach((handles) => {
        if (handles.fade) window.clearTimeout(handles.fade);
        if (handles.remove) window.clearTimeout(handles.remove);
      });
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(gearActionFeedbackTimers.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
    };
  }, []);

  const postGearActionFeedback = useCallback(
    (key: string, tone: 'info' | 'error', message: string, duration = 2600) => {
      setGearActionFeedbackState((prev) => ({ ...prev, [key]: { tone, message } }));
      const existingTimer = gearActionFeedbackTimers.current[key];
      if (existingTimer !== undefined) {
        window.clearTimeout(existingTimer);
      }
      gearActionFeedbackTimers.current[key] = window.setTimeout(() => {
        setGearActionFeedbackState((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        delete gearActionFeedbackTimers.current[key];
      }, duration);
    },
    []
  );

  const userGearQuery = useQuery({
    queryKey: ['user-gear', numericUserId],
    queryFn: async () => {
      if (numericUserId === undefined) {
        return { items: [] as UserGear[] };
      }
      return UserGearApi.listByUser(numericUserId, { limit: 200 });
    },
    enabled: numericUserId !== undefined,
    staleTime: 30_000
  });
  const userGearItems = (userGearQuery.data?.items ?? []) as UserGear[];

  const topCategoriesQuery = useQuery({
    queryKey: ['gear', 'top-categories'],
    queryFn: () => TopCategoryApi.list({ limit: 100 }),
    staleTime: 60_000
  });
  const totalGearQuery = useQuery({
    queryKey: ['gear', 'total-count'],
    queryFn: () => GearApi.list({ page: 1, limit: 1 }),
    staleTime: 60_000
  });
  const topCategories: TopCategoryOption[] = useMemo(
    () =>
      (topCategoriesQuery.data?.items ?? []).map((item) => ({
        id: item.top_category_id ?? undefined,
        name: item.top_category_name ?? 'Untitled top category'
      })),
    [topCategoriesQuery.data?.items]
  );

  const trimmedSearch = searchTerm.trim();
  useEffect(() => {
    const clearThrottle = () => {
      if (throttleTimeoutRef.current !== undefined) {
        window.clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = undefined;
      }
    };

    if (trimmedSearch.length < MIN_SEARCH_LENGTH) {
      clearThrottle();
      lastCommittedRef.current = '';
      if (committedSearch !== '') {
        setCommittedSearch('');
      }
      return;
    }

    if (trimmedSearch === lastCommittedRef.current) {
      clearThrottle();
      if (committedSearch !== trimmedSearch) {
        setCommittedSearch(trimmedSearch);
      }
      return;
    }

    const lengthDiff = Math.abs(trimmedSearch.length - lastCommittedRef.current.length);

    if (lengthDiff >= SEARCH_CHAR_STEP) {
      clearThrottle();
      lastCommittedRef.current = trimmedSearch;
      if (committedSearch !== trimmedSearch) {
        setCommittedSearch(trimmedSearch);
      }
      return;
    }

    clearThrottle();
    throttleTimeoutRef.current = window.setTimeout(() => {
      lastCommittedRef.current = trimmedSearch;
      setCommittedSearch((prev) => (prev === trimmedSearch ? prev : trimmedSearch));
      throttleTimeoutRef.current = undefined;
    }, SEARCH_IDLE_DELAY_MS);

    return () => {
      clearThrottle();
    };
  }, [trimmedSearch, committedSearch]);

  const isSearchEligible = trimmedSearch.length >= MIN_SEARCH_LENGTH;
  const isSearchActive = committedSearch.length >= MIN_SEARCH_LENGTH;

  const {
    data: searchData,
    error: searchError,
    fetchNextPage: fetchNextSearchPage,
    hasNextPage: hasSearchNextPage,
    isError: isSearchError,
    isFetching: isSearchFetching,
    isFetchingNextPage: isSearchFetchingNextPage,
    isLoading: isSearchLoading,
    refetch: refetchSearch
  } = useInfiniteQuery({
    queryKey: ['gear', 'search', committedSearch, normalizedGearListLimit],
    queryFn: ({ pageParam = 1 }) =>
      GearApi.search({
        page: pageParam,
        limit: normalizedGearListLimit,
        searchString: committedSearch,
        searchType: 'contains'
      }),
    enabled: isSearchActive,
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.current_page ?? 1;
      const totalPages = lastPage.total_pages ?? currentPage;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 15_000
  });

  const detailQuery = useQuery({
    queryKey: ['gear', 'detail', detailId],
    queryFn: () => (detailId ? GearApi.get(detailId) : Promise.resolve(undefined)),
    enabled: detailId !== undefined
  });

  const searchPages = searchData?.pages ?? [];
  const searchResults: GearListItem[] = isSearchActive
    ? searchPages.flatMap((page) => page.items ?? [])
    : [];

  const searchLoadedPages = searchPages.length;
  const searchHasMore = Boolean(hasSearchNextPage);
  const searchShouldAutoLoad = isSearchActive && searchHasMore && searchLoadedPages < AUTOLOAD_PAGE_LIMIT;
  const searchShowLoadMore = searchHasMore && searchLoadedPages >= AUTOLOAD_PAGE_LIMIT;

  useEffect(() => {
    if (!searchShouldAutoLoad) {
      return;
    }

    const sentinel = searchSentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting && !isSearchFetchingNextPage) {
        void fetchNextSearchPage();
      }
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextSearchPage, isSearchFetchingNextPage, searchShouldAutoLoad, searchResults.length]);

  const { userGearCounts, optimisticGearAdds } = useMemo(() => {
    const counts = new Map<number, number>();
    const optimistic = new Set<number>();

    userGearItems.forEach((entry) => {
      const gearId = entry.usergear_gear_id ?? entry.gear_id;
      if (typeof gearId === 'number') {
        counts.set(gearId, (counts.get(gearId) ?? 0) + 1);
      }
    });

    myGear.forEach((entry) => {
      const gearId = entry.gear.gear_id;
      if (typeof gearId !== 'number') return;
      if (entry.status === 'pending') {
        optimistic.add(gearId);
      }
    });

    return { userGearCounts: counts, optimisticGearAdds: optimistic };
  }, [myGear, userGearItems]);

  const userGearCount = userGearItems.length;
  const { userContainerCount, userNonContainerCount } = useMemo(() => {
    let containers = 0;
    let nonContainers = 0;
    userGearItems.forEach((entry) => {
      if (entry.gear_is_container === true) {
        containers += 1;
      } else if (entry.gear_is_container === false || entry.gear_is_container === undefined || entry.gear_is_container === null) {
        nonContainers += 1;
      }
    });
    return { userContainerCount: containers, userNonContainerCount: nonContainers };
  }, [userGearItems]);
  const userTopCoverage = useMemo(() => {
    const ids = new Set<number>();
    userGearItems.forEach((entry) => {
      const topId =
        entry.top_category_id ?? entry.category_top_category_id ?? entry.gear_top_category_id;
      if (typeof topId === 'number') ids.add(topId);
    });
    return ids.size;
  }, [userGearItems]);

  const userCategoryCoverage = useMemo(() => {
    const ids = new Set<number>();
    userGearItems.forEach((entry) => {
      const categoryId = entry.category_id ?? entry.gear_category_id;
      if (typeof categoryId === 'number') ids.add(categoryId);
    });
    return ids.size;
  }, [userGearItems]);

  const committedTokens = useMemo(
    () =>
      committedSearch
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean),
    [committedSearch]
  );

  const highlightTokens = useMemo(
    () => (isSearchActive ? [...committedTokens] : []),
    [isSearchActive, committedTokens]
  );

  const totalSearchCount = isSearchActive
    ? searchPages[0]?.total_item_count ?? searchResults.length
    : undefined;

  const viewScopeCount = isSearchActive ? totalSearchCount ?? searchResults.length : topCategories.length;
  const viewScopeHint = isSearchActive
    ? `Gear name matches${totalSearchCount !== undefined ? ` (total ${totalSearchCount})` : ''}`
    : 'Top categories available';

  const listTotalCount = totalSearchCount;

  const assignGearMutation = useMutation({
    mutationFn: (payload: UserGearLinkNoID) => UserGearApi.insert(payload)
  });

  const removeGearMutation = useMutation({
    mutationFn: (registrationId: number) => UserGearApi.remove(registrationId)
  });

  const insertMutation = useMutation({
    mutationFn: (payload: Gear) => GearApi.insert(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gear', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['gear', 'top-categories'] });
      queryClient.invalidateQueries({ queryKey: ['gear', 'categories'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (gearId: number) => GearApi.remove(gearId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gear', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['gear', 'top-categories'] });
      queryClient.invalidateQueries({ queryKey: ['gear', 'categories'] });
      const activeUserId = resolveNumericUserId(useConfigStore.getState().user);
      if (activeUserId !== undefined) {
        queryClient.invalidateQueries({ queryKey: ['user-gear', activeUserId] });
      }
    }
  });

  const clearFadeForEntry = useCallback((identifier: string) => {
    const timers = fadeTimers.current[identifier];
    if (timers?.fade) window.clearTimeout(timers.fade);
    if (timers?.remove) window.clearTimeout(timers.remove);
    delete fadeTimers.current[identifier];
  }, []);

  const scheduleFadeForEntry = useCallback(
    (identifier: string) => {
      clearFadeForEntry(identifier);

      const fadeHandle = window.setTimeout(() => {
        setMyGear((prev) =>
          prev.map((entry) =>
            entry.identifier === identifier ? { ...entry, isFading: true } : entry
          )
        );
      }, 2400);

      const removeHandle = window.setTimeout(() => {
        setMyGear((prev) => prev.filter((entry) => entry.identifier !== identifier));
        clearFadeForEntry(identifier);
      }, 5200);

      fadeTimers.current[identifier] = { fade: fadeHandle, remove: removeHandle };
    },
    [clearFadeForEntry]
  );

  const fetchRemovableRegistrationId = useCallback(async (gearId: number, userId: number) => {
    try {
      const response = await UserGearApi.listByUser(userId, { limit: 200 });
      const items = response.items ?? [];

      const candidate = [...items]
        .sort((a, b) => (b.usergear_registration_id ?? 0) - (a.usergear_registration_id ?? 0))
        .find((item) => {
          const candidateGearId = item.usergear_gear_id ?? item.gear_id;
          if (candidateGearId !== gearId) return false;
          const registrationId = item.usergear_registration_id;
          return registrationId !== undefined && registrationId !== null;
        });

      return candidate?.usergear_registration_id ?? undefined;
    } catch (error) {
      console.error('Failed to fetch registration ID for removal', error);
      return undefined;
    }
  }, []);

  const fetchRegistrationId = useCallback(
    async (gearId: number, userId: number) => {
      try {
        const response = await UserGearApi.listByUser(userId, { limit: 200 });
        const items = response.items ?? [];
        const usedIds = new Set(
          myGearRef.current
            .map((entry) => entry.registrationId)
            .filter((value): value is number => value !== undefined)
        );

        const candidate = [...items]
          .sort((a, b) => (b.usergear_registration_id ?? 0) - (a.usergear_registration_id ?? 0))
          .find((item) => {
            if (item.usergear_gear_id !== gearId) return false;
            const registrationId = item.usergear_registration_id;
            if (registrationId === undefined || registrationId === null) return false;
            return !usedIds.has(registrationId);
          });

        return candidate?.usergear_registration_id ?? undefined;
      } catch (error) {
        console.error('Failed to fetch registration ID for gear', error);
        return undefined;
      }
    },
    []
  );

  const runInsertFlow = useCallback(
    async (gear: GearListItem, identifier: string) => {
      const currentUser = useConfigStore.getState().user;
      const currentUserId = resolveNumericUserId(currentUser);

      if (!currentUserId) {
        setMyGear((prev) =>
          prev.map((entry) =>
            entry.identifier === identifier
              ? {
                ...entry,
                status: 'error',
                errorMessage: 'Login required to assign gear.'
              }
              : entry
          )
        );
        return;
      }

      if (gear.gear_id === undefined || gear.gear_id === null) {
        setMyGear((prev) =>
          prev.map((entry) =>
            entry.identifier === identifier
              ? {
                ...entry,
                status: 'error',
                errorMessage: 'Gear needs an ID before it can be assigned.'
              }
              : entry
          )
        );
        return;
      }

      try {
        await assignGearMutation.mutateAsync({
          usergear_user_id: currentUserId,
          usergear_gear_id: gear.gear_id
        });

        const registrationId = await fetchRegistrationId(gear.gear_id, currentUserId);

        setMyGear((prev) =>
          prev.map((entry) =>
            entry.identifier === identifier
              ? { ...entry, status: 'success', registrationId, errorMessage: undefined }
              : entry
          )
        );

        scheduleFadeForEntry(identifier);
        queryClient.invalidateQueries({ queryKey: ['user-gear', currentUserId] });
      } catch (error) {
        const message = toErrorMessage(error);
        setMyGear((prev) =>
          prev.map((entry) =>
            entry.identifier === identifier
              ? { ...entry, status: 'error', errorMessage: message }
              : entry
          )
        );
      }
    },
    [assignGearMutation, fetchRegistrationId, queryClient, scheduleFadeForEntry]
  );

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const queueGearAssign = useCallback(
    (gear: GearListItem) => {
      const uniqueIdentifier = `${gearIdentifier(gear)}::add::${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      setMyGear((prev) => [...prev, { identifier: uniqueIdentifier, gear, status: 'pending' }]);
      clearFadeForEntry(uniqueIdentifier);
      void runInsertFlow(gear, uniqueIdentifier);
    },
    [clearFadeForEntry, runInsertFlow]
  );

  const handleDirectRemoveFromUser = useCallback(
    async (gear: GearListItem) => {
      const gearId = gear.gear_id;
      const key = gearIdentifier(gear);

      if (typeof gearId !== 'number') {
        postGearActionFeedback(key, 'error', 'Gear needs an ID before removal.');
        return;
      }

      const currentUser = useConfigStore.getState().user;
      const currentUserId = resolveNumericUserId(currentUser);

      if (!currentUserId) {
        postGearActionFeedback(key, 'error', 'Login required to manage My gear.');
        return;
      }

      setRemovalBusyMap((prev) => ({ ...prev, [key]: true }));

      try {
        const registrationId = await fetchRemovableRegistrationId(gearId, currentUserId);

        if (!registrationId) {
          postGearActionFeedback(key, 'error', 'No registrations available to remove.');
          return;
        }

        await removeGearMutation.mutateAsync(registrationId);
        queryClient.invalidateQueries({ queryKey: ['user-gear', currentUserId] });
        postGearActionFeedback(key, 'info', 'Removed from My gear.');
      } catch (error) {
        const message = toErrorMessage(error);
        postGearActionFeedback(key, 'error', message);
      } finally {
        setRemovalBusyMap((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [fetchRemovableRegistrationId, postGearActionFeedback, queryClient, removeGearMutation]
  );

  const handleDragStart = (gear: GearListItem) => (event: DragEvent<HTMLLIElement>) => {
    const identifier = gearIdentifier(gear);
    dragItemRegistryRef.current.set(identifier, gear);
    event.dataTransfer.setData(DRAG_DATA_TYPE, identifier);
    event.dataTransfer.setData('text/plain', identifier);
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = (gear: GearListItem) => () => {
    const identifier = gearIdentifier(gear);
    dragItemRegistryRef.current.delete(identifier);
  };

  const handleDropZoneDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDropZoneEnter = () => {
    setDropTargetActive(true);
  };

  const handleDropZoneLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setDropTargetActive(false);
    }
  };

  const handleDropOnZone = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const identifier =
      event.dataTransfer.getData(DRAG_DATA_TYPE) || event.dataTransfer.getData('text/plain');

    setDropTargetActive(false);

    if (!identifier) {
      return;
    }

    const gearFromRegistry = dragItemRegistryRef.current.get(identifier);
    const gear = gearFromRegistry ?? searchResults.find((item) => gearIdentifier(item) === identifier);

    dragItemRegistryRef.current.delete(identifier);

    if (!gear) {
      return;
    }

    const existingEntry = myGearRef.current.find((entry) => entry.identifier === identifier);
    if (existingEntry) {
      if (existingEntry.status === 'error') {
        clearFadeForEntry(identifier);
        setMyGear((prev) =>
          prev.map((entry) =>
            entry.identifier === identifier
              ? { ...entry, status: 'pending', errorMessage: undefined, isFading: false }
              : entry
          )
        );
        void runInsertFlow(gear, identifier);
      }
      return;
    }

    setMyGear((prev) => [...prev, { identifier, gear, status: 'pending' }]);
    clearFadeForEntry(identifier);
    void runInsertFlow(gear, identifier);
  };

  const handleUndo = useCallback(
    (entry: MyGearEntry) => {
      const { identifier, registrationId } = entry;
      clearFadeForEntry(identifier);

      if (!registrationId) {
        setMyGear((prev) => prev.filter((item) => item.identifier !== identifier));
        return;
      }

      setMyGear((prev) =>
        prev.map((item) =>
          item.identifier === identifier
            ? { ...item, status: 'undoing', isFading: false, errorMessage: undefined }
            : item
        )
      );

      removeGearMutation.mutate(registrationId, {
        onSuccess: () => {
          setMyGear((prev) => prev.filter((item) => item.identifier !== identifier));
          const activeUserId = resolveNumericUserId(useConfigStore.getState().user);
          if (activeUserId !== undefined) {
            queryClient.invalidateQueries({ queryKey: ['user-gear', activeUserId] });
          }
        },
        onError: (error) => {
          const message = toErrorMessage(error);
          setMyGear((prev) =>
            prev.map((item) =>
              item.identifier === identifier
                ? { ...item, status: 'error', errorMessage: message, isFading: false }
                : item
            )
          );
        }
      });
    },
    [clearFadeForEntry, removeGearMutation, queryClient]
  );

  const handleRetryAssignment = useCallback(
    (entry: MyGearEntry) => {
      const identifier = entry.identifier;
      clearFadeForEntry(identifier);
      setMyGear((prev) =>
        prev.map((item) =>
          item.identifier === identifier
            ? { ...item, status: 'pending', errorMessage: undefined, isFading: false }
            : item
        )
      );
      void runInsertFlow(entry.gear, identifier);
    },
    [clearFadeForEntry, runInsertFlow]
  );

  const handleMyGearDismiss = (identifier: string) => {
    clearFadeForEntry(identifier);
    setMyGear((prev) => prev.filter((entry) => entry.identifier !== identifier));
  };

  const handleDeleteGear = useCallback(
    async (event: MouseEvent<HTMLButtonElement>, gear: GearListItem) => {
      event.preventDefault();
      event.stopPropagation();
      if (!gear.gear_id) return;
      try {
        await deleteMutation.mutateAsync(gear.gear_id);
      } catch (error) {
        console.error('Failed to delete gear', error);
      }
    },
    [deleteMutation]
  );

  const renderGearItems = useCallback(
    (
      items: GearListItem[],
      options?: { highlightTokens?: string[]; showTaxonomy?: boolean }
    ) => {
      const highlightTokens =
        options?.highlightTokens?.map((token) => token.trim()).filter(Boolean) ?? [];
      const showTaxonomy = options?.showTaxonomy ?? false;

      const highlight = (value: string | number | undefined): ReactNode => {
        if (value === undefined || value === null) return '';
        const text = String(value);
        return highlightTokens.length > 0 ? highlightMatches(text, highlightTokens) : text;
      };

      return (
        <ul className="gear-items-list">
          {items.map((gear, index) => {
            const itemKey = gear.gear_id ?? `${gearIdentifier(gear)}-${index}`;
            const hasDimensions = [gear.gear_length, gear.gear_width, gear.gear_height].some(
              (value) => value !== undefined && value !== null
            );
            const hasWeight = gear.gear_weight !== undefined && gear.gear_weight !== null;
            const existingCount = gear.gear_id ? userGearCounts.get(gear.gear_id) ?? 0 : 0;
            const alreadyAssigned = existingCount > 0;
            const hasGearId = typeof gear.gear_id === 'number';
            const hasPendingAddition = hasGearId && optimisticGearAdds.has(gear.gear_id as number);
            const classes = [
              'gear-card',
              'gear-item',
              'gear-item-draggable',
              alreadyAssigned ? 'gear-item-assigned' : undefined,
              hasPendingAddition ? 'gear-item-assigning' : undefined
            ]
              .filter(Boolean)
              .join(' ');
            const gearActionKey = gearIdentifier(gear);
            const disableAdd = !hasGearId;
            const isRemoving = removalBusyMap[gearActionKey] ?? false;
            const disableRemove = !hasGearId || existingCount === 0 || isRemoving;
            const actionFeedback = gearActionFeedbackState[gearActionKey];
            const isLoggedIn = numericUserId !== undefined;
            const panelHidden = !isLoggedIn || (existingCount === 0 && !isRemoving);
            const helperText = panelHidden
              ? 'Drag gear to add it into My gear.'
              : 'Drag or use the buttons to adjust My gear.';
            const assignPanelClass = ['gear-item-assign-panel', panelHidden ? 'is-hidden' : undefined]
              .filter(Boolean)
              .join(' ');

            const manufacturerText =
              gear.manufacture_name !== undefined && gear.manufacture_name !== null
                ? gear.manufacture_name
                : undefined;
            const taxonomyDetails = (() => {
              const top = gear.top_category_name ?? undefined;
              const category = gear.category_name ?? undefined;
              if (showTaxonomy) {
                if (top && category) return `${top} › ${category}`;
                return category ?? top ?? undefined;
              }
              return category ?? undefined;
            })();
            const dimensionText = hasDimensions
              ? `${gear.gear_length ?? '--'} × ${gear.gear_width ?? '--'} × ${gear.gear_height ?? '--'}`
              : undefined;
            const weightText = hasWeight ? `${gear.gear_weight}` : undefined;
            const statusDisplay = `ID #${gear.gear_id ?? '--'} • ${gear.gear_status ? 'Active' : 'Archived'}`;
            const isContainer =
              'gear_is_container' in gear
                ? Boolean((gear as { gear_is_container?: boolean }).gear_is_container)
                : false;
            const cardGlyph = gear.top_category_icon
              ? <TopCategoryIcon iconKey={gear.top_category_icon} />
              : isContainer
                ? <IconCube />
                : <IconSpark />;
            const highlightedName = highlight(gear.gear_name ?? 'Unnamed gear');
            const highlightedTaxonomy = taxonomyDetails ? highlight(taxonomyDetails) : null;
            const highlightedManufacturer = manufacturerText ? highlight(manufacturerText) : null;
            const weightMetric = weightText ? highlight(`Weight: ${weightText} g`) : null;
            const stateKey = itemKey;
            const isDetailsExpanded = Boolean(expandedGearMap[stateKey]);
            const toggleDetails = (event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              setExpandedGearMap((prev) => ({
                ...prev,
                [stateKey]: !prev[stateKey]
              }));
            };
            const moreInfoEntries: Array<{ label: string; value: ReactNode }> = [];
            moreInfoEntries.push({ label: 'Gear ID', value: highlight(`#${gear.gear_id ?? '--'}`) });
            moreInfoEntries.push({ label: 'Status', value: highlight(gear.gear_status ? 'Active' : 'Archived') });
            if (manufacturerText) {
              moreInfoEntries.push({ label: 'Manufacturer', value: highlight(manufacturerText) });
            }
            if (taxonomyDetails) {
              moreInfoEntries.push({ label: 'Taxonomy', value: highlight(taxonomyDetails) });
            }
            if (dimensionText) {
              moreInfoEntries.push({ label: 'Dimensions', value: highlight(dimensionText) });
            }
            if (weightText) {
              moreInfoEntries.push({ label: 'Weight', value: highlight(`${weightText} g`) });
            }
            if (gear.gear_size_definition) {
              moreInfoEntries.push({ label: 'Size definition', value: highlight(gear.gear_size_definition) });
            }
            const hasMoreInfo = moreInfoEntries.length > 0;
            const moreInfoToggleLabel = isDetailsExpanded ? 'Hide info' : 'More info';
            const feedbackToneClass = actionFeedback?.tone === 'error' ? 'error' : 'notice';
            const topActions =
              isAdmin && gear.gear_id ? (
                <div className="gear-card-top-actions">
                  <button
                    className="gear-card-remove"
                    type="button"
                    title="Delete gear"
                    onClick={(event) => handleDeleteGear(event, gear)}
                  >
                    <IconTrash />
                  </button>
                </div>
              ) : null;

            return (
              <li
                key={itemKey}
                className={classes}
                draggable
                onDragStart={handleDragStart(gear)}
                onDragEnd={handleDragEnd(gear)}
              >
                <div className="gear-card-topbar">
                  <span className="gear-card-glyph">{cardGlyph}</span>
                  <div className="gear-card-topline">
                    <div className="gear-card-heading">
                      <strong className="gear-card-title">{highlightedName}</strong>
                      {highlightedTaxonomy && <span className="gear-card-chip">{highlightedTaxonomy}</span>}
                    </div>
                    <span className="gear-card-assist">{highlight(statusDisplay)}</span>
                  </div>
                  {topActions}
                </div>
                <div className="gear-card-body">
                  {highlightedManufacturer && <span className="gear-card-pill">{highlightedManufacturer}</span>}
                  {weightMetric && <div className="gear-card-metric">{weightMetric}</div>}
                  {isLoggedIn ? (
                    <div className={assignPanelClass} aria-hidden={panelHidden}>
                      <span className="gear-item-count-label">In My gear</span>
                      <div className="gear-item-assign-controls">
                        <button
                          type="button"
                          className="gear-item-adjust"
                          data-variant="remove"
                          onClick={() => handleDirectRemoveFromUser(gear)}
                          disabled={panelHidden || disableRemove}
                          aria-label="Remove one from My gear"
                          tabIndex={panelHidden ? -1 : undefined}
                        >
                          <span aria-hidden="true">-</span>
                        </button>
                        <span
                          className="gear-item-count"
                          aria-live="polite"
                          aria-busy={isRemoving}
                        >
                          {existingCount}
                        </span>
                        <button
                          type="button"
                          className="gear-item-adjust"
                          data-variant="add"
                          onClick={() => queueGearAssign(gear)}
                          disabled={panelHidden || disableAdd}
                          aria-label="Add one to My gear"
                          tabIndex={panelHidden ? -1 : undefined}
                        >
                          <span aria-hidden="true">+</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    alreadyAssigned && (
                      <small className="gear-item-assigned-indicator">
                        Already in My gear{existingCount > 1 ? ` x${existingCount}` : ''}
                      </small>
                    )
                  )}
                  {actionFeedback && (
                    <div
                      className={`gear-card-feedback ${feedbackToneClass}`}
                      role="status"
                      aria-live="polite"
                    >
                      {actionFeedback.message}
                    </div>
                  )}
                  <div className="gear-card-actions">
                    {hasMoreInfo && (
                      <button
                        type="button"
                        className={`gear-card-toggle${isDetailsExpanded ? ' is-active' : ''}`}
                        onClick={toggleDetails}
                        aria-expanded={isDetailsExpanded}
                      >
                        <span className="gear-card-toggle-icon">{isDetailsExpanded ? '-' : '+'}</span>
                        {moreInfoToggleLabel}
                      </button>
                    )}
                  </div>
                  {hasMoreInfo && isDetailsExpanded && (
                    <dl className="gear-card-details">
                      {moreInfoEntries.map((entry, entryIndex) => (
                        <div key={`${itemKey}-info-${entryIndex}`}>
                          <dt>{entry.label}</dt>
                          <dd>{entry.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <span className="gear-card-helper">{helperText}</span>
                </div>
              </li>
            );
          })}
        </ul>
      );
    },
    [
      gearActionFeedbackState,
      handleDeleteGear,
      handleDirectRemoveFromUser,
      handleDragEnd,
      handleDragStart,
      isAdmin,
      expandedGearMap,
      numericUserId,
      queueGearAssign,
      removalBusyMap,
      setExpandedGearMap,
      userGearCounts
    ]
  );

  const totalGearMetricValue = isSearchActive ? listTotalCount ?? '--' : '--';
  const totalGearMetricHint = isSearchActive
    ? 'Total gear name matches returned by the search'
    : totalGearQuery.data?.total_item_count !== undefined
      ? 'Total gear registered in the catalog'
      : 'Expand the tree to browse by category';
  const catalogGearTotal = totalGearQuery.data?.total_item_count ?? null;

  const pendingCommit = isSearchEligible && committedSearch !== trimmedSearch;
  const totalMatchesForDisplay = totalSearchCount ?? searchResults.length;

  const searchMetaMessage = (() => {
    if (!trimmedSearch) {
      return 'Expand a top category, then a category to browse gear or search by name.';
    }

    if (!isSearchEligible) {
      const remaining = MIN_SEARCH_LENGTH - trimmedSearch.length;
      return `Type ${remaining} more character${remaining === 1 ? '' : 's'} to search by name.`;
    }

    if (pendingCommit) {
      return 'Waiting briefly before searching…';
    }

    if (!isSearchActive) {
      return 'Type to search by gear name.';
    }

    if (isSearchLoading && !pendingCommit) {
      return 'Searching gear names...';
    }

    if (!isSearchLoading && isSearchFetching) {
      return 'Updating search results...';
    }

    if (totalMatchesForDisplay === 0 && !isSearchFetching) {
      return 'No gear names match the current search.';
    }

    const showedAll = searchResults.length >= totalMatchesForDisplay;
    const totalLabel = `${totalMatchesForDisplay} total gear name ${totalMatchesForDisplay === 1 ? 'match' : 'matches'}`;
    return showedAll ? totalLabel : `${totalLabel} • showing first ${searchResults.length}`;
  })();

  return (
    <>
      <PageHero
        title="Gear hangar"
        subtitle="Browse by taxonomy, pin favorites, and manage the catalog."
        badge="Inventory"
        metrics={[
          {
            label: 'Total gear',
            value:
              catalogGearTotal !== null
                ? catalogGearTotal.toLocaleString()
                : totalGearMetricValue,
            hint: totalGearMetricHint,
            tone:
              catalogGearTotal !== null
                ? catalogGearTotal > 0 ? 'positive' : 'default'
                : totalGearMetricValue && totalGearMetricValue !== '--' ? 'positive' : 'default'
          },
          {
            label: 'My gear',
            value: numericUserId !== undefined ? userNonContainerCount : '—',
            hint:
              numericUserId !== undefined
                ? `Excludes storage containers • ${userGearCount} total registrations`
                : 'Sign in to build your personal manifest',
            tone: numericUserId !== undefined && userNonContainerCount > 0 ? 'positive' : 'default'
          },
          {
            label: 'Containers',
            value: numericUserId !== undefined ? userContainerCount : '—',
            hint:
              numericUserId !== undefined
                ? 'Storage-ready gear linked to your account'
                : 'Pending user sign-in',
            tone: numericUserId !== undefined && userContainerCount > 0 ? 'positive' : 'default'
          },
          {
            label: 'Top categories',
            value: numericUserId !== undefined ? userTopCoverage : '—',
            hint:
              numericUserId !== undefined
                ? `${userCategoryCoverage} categories represented`
                : 'Sign in to reveal coverage',
            tone: numericUserId !== undefined && userTopCoverage > 0 ? 'positive' : 'default'
          },
          {
            label: 'View scope',
            value: viewScopeCount,
            hint: viewScopeHint,
            tone: viewScopeCount > 0 ? 'positive' : 'default'
          }
        ]}
        actions={
          <button
            className="button ghost"
            type="button"
            onClick={() => {
              void topCategoriesQuery.refetch();
              void totalGearQuery.refetch();
              if (isSearchActive) {
                void refetchSearch();
              }
              if (numericUserId !== undefined) {
                void userGearQuery.refetch();
              }
            }}
          >
            Refresh view
          </button>
        }
      >
        <span className="hero-chip">Choose a top category or search to begin exploring gear.</span>
      </PageHero>

      <section className="gear-search-panel" aria-label="Gear name search">
        <div className="gear-search-control">
          <label htmlFor="gearSearch">Search gear</label>
          <div className="gear-search-input">
            <input
              id="gearSearch"
              type="search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by gear name (min 3 characters)"
              autoComplete="off"
            />
            {searchTerm && (
              <button className="button ghost" type="button" onClick={() => setSearchTerm('')}>
                Clear
              </button>
            )}
          </div>
          <div className="gear-search-options">
            <span>Matches gear names only • throttled to 2 chars or 1s idle</span>
          </div>
          {isAdmin && (
            <div className="gear-search-actions">
              <button className="button" type="button" onClick={() => setCreateModalOpen(true)}>
                <IconPlus style={{ width: 16, height: 16 }} /> Add gear
              </button>
            </div>
          )}
        </div>
        <p className="gear-search-meta">{searchMetaMessage}</p>
      </section>

      <section className="gear-explorer" aria-label="Gear workspace">
        <aside
          className={`gear-my-zone${isDropTargetActive ? ' is-active' : ''}`}
          onDragOver={handleDropZoneDragOver}
          onDragEnter={handleDropZoneEnter}
          onDragLeave={handleDropZoneLeave}
          onDrop={handleDropOnZone}
        >
          <header className="gear-my-zone-header">
            <IconSpark className="gear-my-zone-icon" />
            <div>
              <h3>My gear</h3>
              <p>
                {numericUserId !== undefined
                  ? 'Drag gear here to register it to your profile. Items fade after a few seconds.'
                  : 'Login required to persist selections.'}
              </p>
            </div>
          </header>
          <div
            className="gear-my-zone-body"
            onDragOver={(event) => {
              handleDropZoneDragOver(event);
            }}
            onDrop={(event) => {
              handleDropOnZone(event);
            }}
          >
            {myGear.length > 0 ? (
              <ul className="gear-my-list">
                {myGear.map((entry) => {
                  const { identifier, gear, status, registrationId, errorMessage, isFading } = entry;
                  const classes = [
                    'gear-my-item',
                    `status-${status}`,
                    isFading ? 'is-fading' : undefined,
                    registrationId ? 'has-registration' : undefined
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <li
                      key={identifier}
                      className={classes}
                      onDragEnd={handleDragEnd(gear)}
                    >
                      <div>
                        <strong>{gear.gear_name ?? 'Unnamed gear'}</strong>
                        <small>ID #{gear.gear_id ?? '--'}</small>
                        {registrationId && <small>Registration #{registrationId}</small>}
                        {errorMessage && <small className="gear-my-error">{errorMessage}</small>}
                      </div>
                      <div className="gear-my-actions">
                        {status === 'pending' && <span className="gear-my-chip">Saving...</span>}
                        {status === 'undoing' && <span className="gear-my-chip">Undoing...</span>}
                        {status === 'success' && (
                          <button className="button ghost" type="button" onClick={() => handleUndo(entry)}>
                            Undo
                          </button>
                        )}
                        {status === 'error' && (
                          <>
                            <button className="button ghost" type="button" onClick={() => handleRetryAssignment(entry)}>
                              Retry
                            </button>
                            <button className="button ghost" type="button" onClick={() => handleMyGearDismiss(identifier)}>
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="gear-my-empty">Drop gear from the list or search results to pin it here.</div>
            )}
          </div>
        </aside>

        <div className="gear-results" aria-live="polite">
          {topCategoriesQuery.isError && (
            <div className="notice notice-error">
              {topCategoriesQuery.error instanceof Error
                ? topCategoriesQuery.error.message
                : 'Failed to load top categories'}
            </div>
          )}

          {isSearchActive && isSearchError && (
            <div className="notice notice-error">
              {searchError instanceof Error
                ? searchError.message
                : 'Failed to load gear'}
            </div>
          )}

          {isSearchActive || isSearchEligible ? (
            <>
              {pendingCommit && (
                <div className="notice">Waiting briefly before searching…</div>
              )}
              {isSearchActive && isSearchLoading && (
                <div className="notice">Searching gear...</div>
              )}
              {isSearchActive && !isSearchLoading && isSearchFetching && (
                <div className="notice">Updating search results...</div>
              )}
              {isSearchActive && !isSearchLoading && totalMatchesForDisplay === 0 && !isSearchFetching && (
                <div className="gear-empty-state">No gear names match the current search.</div>
              )}
              {isSearchActive && searchResults.length > 0 && (
                <>
                  {renderGearItems(searchResults, {
                    highlightTokens,
                    showTaxonomy: true
                  })}
                  <div
                    ref={searchSentinelRef}
                    className="gear-infinite-sentinel"
                    aria-hidden="true"
                    style={{ height: 1 }}
                  />
                  {isSearchFetchingNextPage && (
                    <div className="gear-tree-status">Loading more gear...</div>
                  )}
                  {searchShowLoadMore && searchHasMore && (
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => {
                        void fetchNextSearchPage();
                      }}
                      disabled={isSearchFetchingNextPage}
                    >
                      {isSearchFetchingNextPage ? 'Loading...' : 'Load more'}
                    </button>
                  )}
                  {!searchHasMore && !isSearchFetchingNextPage && (
                    <div className="gear-tree-status">
                      {typeof totalSearchCount === 'number'
                        ? `Showing ${searchResults.length} of ${totalSearchCount} gear items.`
                        : 'No more gear to load.'}
                    </div>
                  )}
                </>
              )}
              {!isSearchActive && isSearchEligible && (
                <div className="gear-empty-state">Waiting to run the next search…</div>
              )}
            </>
          ) : (
            <div className="gear-tree">
              {topCategoriesQuery.isLoading && (
                <div className="gear-tree-status">Loading top categories...</div>
              )}
              {!topCategoriesQuery.isLoading && topCategories.length === 0 && (
                <div className="gear-empty-state">No top categories found.</div>
              )}
              {topCategories.map((topCategory) => (
                <TopCategoryNode
                  key={topCategory.id ?? topCategory.name}
                  topCategory={topCategory}
                  normalizedGearListLimit={normalizedGearListLimit}
                  renderGearItems={renderGearItems}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {isCreateModalOpen && (
        <div
          className="gear-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setCreateModalOpen(false)}
        >
          <div className="gear-modal" onClick={(event) => event.stopPropagation()}>
            <header className="gear-modal-header">
              <h3>Add new gear</h3>
              <button className="button ghost" type="button" onClick={() => setCreateModalOpen(false)}>
                Close
              </button>
            </header>
            <EntityForm<Gear>
              title="Create gear"
              fields={CREATE_FIELDS}
              submitLabel={insertMutation.isPending ? 'Creating...' : 'Create gear'}
              onSubmit={async (values) => {
                await insertMutation.mutateAsync(values);
                setCreateModalOpen(false);
              }}
              variant="inline"
            />
          </div>
        </div>
      )}

      {isAdmin && (
        <section className="section inspector-section">
          <div className="inspector-controls">
            <h3>JSON inspector</h3>
            <p>Provide a gear ID to inspect the full payload returned by the API.</p>
            <div className="form-grid" style={{ gridTemplateColumns: 'minmax(200px, 1fr)' }}>
              <div className="field">
                <label htmlFor="detailId">Gear ID</label>
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
            title="Gear payload"
            data={detailQuery.data as FullGear | undefined}
            isLoading={detailQuery.isFetching}
            emptyMessage="Choose an ID to reveal the full JSON gear profile."
          />
        </section>
      )}
    </>
  );
}

interface TopCategoryNodeProps {
  topCategory: TopCategoryOption;
  normalizedGearListLimit: number;
  renderGearItems: (
    items: GearListItem[],
    options?: { highlightTokens?: string[]; showTaxonomy?: boolean }
  ) => JSX.Element;
}

function TopCategoryNode({ topCategory, normalizedGearListLimit, renderGearItems }: TopCategoryNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const hasId = typeof topCategory.id === 'number';
  const panelId = useId();
  const topCategoryId = hasId ? topCategory.id! : undefined;

  const categoriesQuery = useQuery({
    queryKey: ['gear', 'categories', topCategoryId],
    queryFn: () =>
      CategoryApi.list({
        topCategory: topCategoryId,
        limit: 200
      }),
    enabled: expanded && hasId,
    staleTime: 60_000
  });

  const categories: CategoryOption[] = useMemo(
    () =>
      (categoriesQuery.data?.items ?? []).map((item) => ({
        id: item.category_id ?? undefined,
        name: item.category_name ?? 'Untitled category'
      })),
    [categoriesQuery.data?.items]
  );

  const categoriesCount = categories.length;
  const categoriesCountLabel =
    categoriesCount === 0
      ? 'No categories linked yet'
      : `${categoriesCount} ${categoriesCount === 1 ? 'category' : 'categories'}`;
  const headerHint = !hasId
    ? 'Missing identifier'
    : expanded && categoriesQuery.isLoading
      ? 'Loading categories...'
      : categoriesQuery.isSuccess
        ? categoriesCountLabel
        : 'Expand to view categories';
  const toggleLabel = hasId
    ? `${expanded ? 'Collapse' : 'Expand'} ${topCategory.name}`
    : 'Identifier missing for this top category';

  return (
    <div className="gear-tree-node gear-tree-top">
      <button
        className={`gear-tree-toggle${expanded ? ' is-expanded' : ''}`}
        onClick={() => setExpanded((prev) => !prev)}
        disabled={!hasId}
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={toggleLabel}
      >
        {expanded ? <IconChevronDown /> : <IconChevronRight />}
      </button>
      <div className="gear-tree-content">
        <div className="gear-tree-header">
          <strong>{topCategory.name}</strong>
          <span>{headerHint}</span>
        </div>
        {expanded && (
          <div
            className="gear-tree-children"
            role="group"
            aria-label={`${topCategory.name} categories`}
            id={panelId}
          >
            {categoriesQuery.isLoading && (
              <div className="gear-tree-status">Loading categories...</div>
            )}
            {categoriesQuery.isError && (
              <div className="gear-tree-error">Failed to load categories for this top category.</div>
            )}
            {!categoriesQuery.isLoading && !categoriesQuery.isError && categories.length === 0 && (
              <div className="gear-tree-status">No categories linked yet.</div>
            )}
            {categories.map((category) => (
              <CategoryNode
                key={category.id ?? category.name}
                category={category}
                normalizedGearListLimit={normalizedGearListLimit}
                renderGearItems={renderGearItems}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CategoryNodeProps {
  category: CategoryOption;
  normalizedGearListLimit: number;
  renderGearItems: (
    items: GearListItem[],
    options?: { highlightTokens?: string[]; showTaxonomy?: boolean }
  ) => JSX.Element;
}

function CategoryNode({ category, normalizedGearListLimit, renderGearItems }: CategoryNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const hasId = typeof category.id === 'number';
  const panelId = useId();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const {
    data: gearData,
    error: gearError,
    fetchNextPage,
    hasNextPage,
    isError: isGearError,
    isFetchingNextPage,
    isLoading: isGearLoading
  } = useInfiniteQuery({
    queryKey: ['gear', 'list', 'category', category.id, normalizedGearListLimit],
    queryFn: ({ pageParam = 1 }) =>
      GearApi.list({
        page: pageParam,
        limit: normalizedGearListLimit,
        category: category.id !== undefined ? String(category.id) : undefined
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.current_page ?? 1;
      const totalPages = lastPage.total_pages ?? currentPage;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: expanded && hasId,
    staleTime: 15_000
  });

  const combinedItems = useMemo(
    () => gearData?.pages.flatMap((page) => page.items ?? []) ?? [],
    [gearData?.pages]
  );

  const loadedPages = gearData?.pages.length ?? 0;
  const hasMore = Boolean(hasNextPage);
  const shouldAutoLoad = expanded && hasId && hasMore && loadedPages < AUTOLOAD_PAGE_LIMIT;
  const showLoadMoreButton = hasMore && loadedPages >= AUTOLOAD_PAGE_LIMIT;

  useEffect(() => {
    if (!shouldAutoLoad) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting && !isFetchingNextPage) {
        void fetchNextPage();
      }
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [shouldAutoLoad, fetchNextPage, isFetchingNextPage, combinedItems.length]);

  const gearCount = combinedItems.length;
  const totalAvailable = gearData?.pages?.[0]?.total_item_count;
  const gearCountLabel = (() => {
    if (typeof totalAvailable === 'number') {
      if (totalAvailable === 0) {
        return 'No gear items yet';
      }
      const suffix = hasMore ? ' (more available)' : '';
      return `${gearCount} loaded • ${totalAvailable} total${suffix}`;
    }
    return gearCount === 0
      ? 'No gear items yet'
      : `${gearCount} item${gearCount === 1 ? '' : 's'} loaded${hasMore ? ' (more available)' : ''}`;
  })();
  const headerHint = !hasId
    ? 'Missing identifier'
    : expanded && (isGearLoading || (isFetchingNextPage && gearCount === 0))
      ? 'Loading gear...'
      : expanded && !isGearError && gearCount === 0
        ? 'No gear items yet'
        : gearCount > 0
          ? gearCountLabel
          : 'Expand to view gear';
  const toggleLabel = hasId
    ? `${expanded ? 'Collapse' : 'Expand'} ${category.name}`
    : 'Identifier missing for this category';

  return (
    <div className="gear-tree-node gear-tree-category">
      <button
        type="button"
        className={`gear-tree-toggle${expanded ? ' is-expanded' : ''}`}
        onClick={() => setExpanded((prev) => !prev)}
        disabled={!hasId}
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={toggleLabel}
      >
        {expanded ? <IconChevronDown /> : <IconChevronRight />}
      </button>
      <div className="gear-tree-content">
        <div className="gear-tree-header">
          <strong>{category.name}</strong>
          <span>{headerHint}</span>
        </div>
        {expanded && (
          <div
            className="gear-tree-children"
            role="group"
            aria-label={`${category.name} gear`}
            id={panelId}
          >
            {isGearLoading && <div className="gear-tree-status">Loading gear...</div>}
            {isGearError && (
              <div className="gear-tree-error">
                {gearError instanceof Error ? gearError.message : 'Failed to load gear for this category.'}
              </div>
            )}
            {!isGearLoading && !isGearError && gearCount === 0 && (
              <div className="gear-tree-status">No gear in this category yet.</div>
            )}
            {gearCount > 0 && !isGearError && (
              <>
                {renderGearItems(combinedItems)}
                <div
                  ref={sentinelRef}
                  className="gear-infinite-sentinel"
                  aria-hidden="true"
                  style={{ height: 1 }}
                />
                {isFetchingNextPage && (
                  <div className="gear-tree-status">Loading more gear...</div>
                )}
                {showLoadMoreButton && hasMore && (
                  <button
                    className="button ghost"
                    type="button"
                    onClick={() => {
                      void fetchNextPage();
                    }}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load more'}
                  </button>
                )}
                {typeof totalAvailable === 'number' && (
                  <div className="gear-tree-status">
                    Showing {gearCount} of {totalAvailable} gear items.
                  </div>
                )}
                {!hasMore && !isFetchingNextPage && (
                  <div className="gear-tree-status">No more gear to load.</div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
