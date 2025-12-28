import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, DragEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react';

import { ContainerApi, UserGearApi, UsersApi, type UserGearListQuery } from '../api/endpoints';
import type { User, UserContainerLinkNoID, UserGear } from '../api/types';
import { FilterBar } from '../components/FilterBar';
import { PageHero } from '../components/PageHero';
import { IconCube, IconInfo, IconMinus, IconSpark } from '../components/icons';
import { TopCategoryIcon } from '../components/topCategoryIcons';
import { useConfigStore, type AuthUser } from '../store/configStore';

import './UserGearPage.css';
import '../styles/gearCard.css';

const DRAG_DATA_TYPE = 'application/x-gogear-user-gear';

const ensureWeight = (value?: number | null) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const formatWeight = (value: number) => `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} g`;

const useDebouncedValue = (value: string, delay = 250) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

export function UserGearPage() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<number | undefined>();
  const [listQuery, setListQuery] = useState<UserGearListQuery>({ page: 1, limit: 30 });
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [userSearchInput, setUserSearchInput] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [selectedUserLabel, setSelectedUserLabel] = useState('');
  const dragItemRegistryRef = useRef<Map<string, UserGear>>(new Map());
  const [activeContainerId, setActiveContainerId] = useState<number | null>(null);
  const [containerBusyMap, setContainerBusyMap] = useState<Record<number, boolean>>({});
  const [expandedDetailsMap, setExpandedDetailsMap] = useState<Record<string, boolean>>({});
  const [otherGearFilter, setOtherGearFilter] = useState('');
  const [gearRemovalBusyMap, setGearRemovalBusyMap] = useState<Record<number, boolean>>({});

  const authUser = useConfigStore((state) => state.user);
  const isAdmin = Boolean(authUser?.isAdmin);

  const authUserId = useMemo(() => {
    if (!authUser?.id) return undefined;
    const numeric = typeof authUser.id === 'string' ? Number(authUser.id) : authUser.id;
    return Number.isFinite(numeric) ? Number(numeric) : undefined;
  }, [authUser?.id]);

  useEffect(() => {
    if (authUserId === undefined) return;
    setUserId((current) => (current === undefined ? authUserId : current));
    if (!isAdmin) {
      setSelectedUserLabel(formatAuthUserLabel(authUser));
    }
  }, [authUser, authUserId, isAdmin]);

  useEffect(() => {
    if (!isAdmin && authUserId !== undefined) {
      setUserId(authUserId);
    }
  }, [authUserId, isAdmin]);

  const debouncedSearch = useDebouncedValue(userSearchInput);
  const normalizedSearchTerm = useMemo(() => {
    const stripped = debouncedSearch.replace(/\([^)]*\)/g, ' ').replace(/[#]/g, ' ');
    return stripped.trim();
  }, [debouncedSearch]);
  const debouncedOtherGearFilter = useDebouncedValue(otherGearFilter);
  const normalizedOtherGearFilter = useMemo(
    () => debouncedOtherGearFilter.trim().toLowerCase(),
    [debouncedOtherGearFilter]
  );
  const otherGearFilterTokens = useMemo(
    () => (normalizedOtherGearFilter ? normalizedOtherGearFilter.split(/\s+/).filter(Boolean) : []),
    [normalizedOtherGearFilter]
  );

  const userSearchQuery = useQuery({
    queryKey: ['user-search', normalizedSearchTerm],
    queryFn: () =>
      UsersApi.list({
        user: normalizedSearchTerm,
        username: normalizedSearchTerm,
        limit: 8
      }),
    enabled: isAdmin && suggestionsOpen && normalizedSearchTerm.length >= 2
  });

  const userSuggestions = userSearchQuery.data?.items ?? [];

  useEffect(() => {
    if (!isAdmin) {
      setUserSearchInput('');
      setSuggestionsOpen(false);
      return;
    }

    if (isAdmin && userId === authUserId) {
      const label = formatAuthUserLabel(authUser);
      setSelectedUserLabel(label);
      setUserSearchInput(label ?? '');
    }
  }, [authUser, authUserId, isAdmin, userId]);

  useEffect(() => {
    if (!isAdmin) return;
    if (userId === undefined) {
      setSelectedUserLabel('');
      setUserSearchInput('');
      setSuggestionsOpen(false);
      return;
    }

    if (!selectedUserLabel) {
      const suggestion = userSuggestions.find((user) => user.user_id === userId);
      if (suggestion) {
        const label = formatUserOptionLabel(suggestion);
        setSelectedUserLabel(label);
        setUserSearchInput(label);
      }
    }
  }, [isAdmin, selectedUserLabel, userId, userSuggestions]);

  useEffect(() => {
    setOtherGearFilter('');
    setGearRemovalBusyMap({});
  }, [userId]);

  const handleSelectUser = (user: User) => {
    if (!isAdmin) return;
    if (!user.user_id) return;
    setUserId(user.user_id);
    const label = formatUserOptionLabel(user);
    setSelectedUserLabel(label);
    setUserSearchInput(label);
    setSuggestionsOpen(false);
  };

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const listQueryResult = useQuery({
    queryKey: ['userGear', userId, listQuery],
    queryFn: () => (userId ? UserGearApi.listByUser(userId, listQuery) : Promise.resolve(undefined)),
    enabled: userId !== undefined
  });

  const containerInsertMutation = useMutation({
    mutationFn: (payload: UserContainerLinkNoID) => ContainerApi.insert(payload)
  });

  const containerRemoveMutation = useMutation({
    mutationFn: (containerLinkId: number) => ContainerApi.remove(containerLinkId)
  });

  const userGearRemoveMutation = useMutation({
    mutationFn: (registrationId: number) => UserGearApi.remove(registrationId)
  });

  const handleListQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setListQuery((prev: UserGearListQuery) => {
      if (!value) {
        return { ...prev, [name]: undefined };
      }

      if (name === 'page' || name === 'limit') {
        return { ...prev, [name]: Number(value) };
      }

      if (name === 'topCategory' || name === 'category' || name === 'manufacture') {
        const parsed = value
          .split(',')
          .map((token: string) => Number(token.trim()))
          .filter((token: number) => !Number.isNaN(token));
        return { ...prev, [name]: parsed.length ? parsed : undefined };
      }

      return { ...prev, [name]: value };
    });
  };

  const userGearItems = listQueryResult.data?.items ?? [];
  const totalCount = listQueryResult.data?.total_item_count ?? userGearItems.length;
  const currentPageCount = userGearItems.length;
  const filtersActive = Boolean(
    (listQuery.topCategory && listQuery.topCategory.length) ||
    (listQuery.category && listQuery.category.length) ||
    (listQuery.manufacture && listQuery.manufacture.length)
  );

  const containerContentMap = useMemo(() => {
    const map = new Map<number, UserGear[]>();
    userGearItems.forEach((gear) => {
      const containerId = gear.container_registration_id;
      if (containerId === undefined || containerId === null) return;
      const bucket = map.get(containerId) ?? [];
      bucket.push(gear);
      map.set(containerId, bucket);
    });
    return map;
  }, [userGearItems]);

  const userGearByRegistration = useMemo(() => {
    const map = new Map<number, UserGear>();
    userGearItems.forEach((gear) => {
      const registrationId = gear.usergear_registration_id;
      if (registrationId === undefined || registrationId === null) return;
      map.set(registrationId, gear);
    });
    return map;
  }, [userGearItems]);

  const containerWeightMap = useMemo(() => {
    const cache = new Map<number, number>();
    const visiting = new Set<number>();

    const computeTotalWeight = (registrationId: number): number => {
      if (cache.has(registrationId)) {
        return cache.get(registrationId)!;
      }

      if (visiting.has(registrationId)) {
        return 0;
      }

      visiting.add(registrationId);

      const gear = userGearByRegistration.get(registrationId);
      const ownWeight = ensureWeight(gear?.gear_weight);
      const children = containerContentMap.get(registrationId) ?? [];
      const childrenWeight = children.reduce((sum, child) => {
        const childRegistrationId = child.usergear_registration_id;
        if (childRegistrationId !== undefined && childRegistrationId !== null) {
          return sum + computeTotalWeight(childRegistrationId);
        }
        return sum + ensureWeight(child.gear_weight);
      }, 0);

      const total = ownWeight + childrenWeight;
      cache.set(registrationId, total);
      visiting.delete(registrationId);
      return total;
    };

    const totals = new Map<number, number>();
    userGearItems.forEach((gear) => {
      const registrationId = gear.usergear_registration_id;
      if (registrationId === undefined || registrationId === null) return;
      if (!gear.gear_is_container) {
        cache.set(registrationId, ensureWeight(gear.gear_weight));
        return;
      }
      totals.set(registrationId, computeTotalWeight(registrationId));
    });

    return totals;
  }, [containerContentMap, userGearByRegistration, userGearItems]);

  const containerHasDescendant = (
    rootRegistrationId: number,
    searchRegistrationId: number,
    visited: Set<number> = new Set()
  ): boolean => {
    if (visited.has(rootRegistrationId)) {
      return false;
    }
    visited.add(rootRegistrationId);

    const children = containerContentMap.get(rootRegistrationId) ?? [];
    for (const child of children) {
      const childRegistrationId = child.usergear_registration_id;
      if (childRegistrationId === undefined || childRegistrationId === null) continue;
      if (childRegistrationId === searchRegistrationId) {
        return true;
      }
      if (containerHasDescendant(childRegistrationId, searchRegistrationId, visited)) {
        return true;
      }
    }

    return false;
  };

  const displayGearItems = useMemo(
    () =>
      userGearItems.filter(
        (gear) => gear.container_registration_id === undefined || gear.container_registration_id === null
      ),
    [userGearItems]
  );

  const containerItems = useMemo(
    () => displayGearItems.filter((gear) => Boolean(gear.gear_is_container)),
    [displayGearItems]
  );

  const standaloneItems = useMemo(
    () => displayGearItems.filter((gear) => !gear.gear_is_container),
    [displayGearItems]
  );
  const filteredStandaloneItems = useMemo(() => {
    if (!otherGearFilterTokens.length) {
      return standaloneItems;
    }

    return standaloneItems.filter((gear) => {
      const dataPieces: string[] = [];
      if (gear.gear_name) dataPieces.push(gear.gear_name);
      if (gear.category_name) dataPieces.push(gear.category_name);
      if (gear.top_category_name) dataPieces.push(gear.top_category_name);
      if (gear.manufacture_name) dataPieces.push(gear.manufacture_name);
      if (gear.gear_id !== undefined && gear.gear_id !== null) dataPieces.push(String(gear.gear_id));
      if (gear.usergear_registration_id !== undefined && gear.usergear_registration_id !== null) {
        dataPieces.push(String(gear.usergear_registration_id));
      }

      if (!dataPieces.length) {
        return false;
      }

      const haystack = dataPieces.join(' ').toLowerCase();
      return otherGearFilterTokens.every((token) => haystack.includes(token));
    });
  }, [standaloneItems, otherGearFilterTokens]);

  const trackedUserLabel = userId ? selectedUserLabel || `#${userId}` : 'None';
  const trackedUserHint = userId
    ? isAdmin
      ? 'Use the search box to pivot to another explorer.'
      : 'Showing your registered inventory.'
    : isAdmin
      ? 'Choose a user to inspect their gear.'
      : 'Waiting for authentication info.';

  const handleContainerItemRemove = async (
    containerRegistrationId: number,
    containerLinkId: number | undefined,
    itemLabel: string
  ) => {
    if (!containerLinkId) {
      showToast('Unable to identify stored gear link', 'error');
      return;
    }

    setContainerBusyMap((prev) => ({ ...prev, [containerRegistrationId]: true }));

    try {
      await containerRemoveMutation.mutateAsync(containerLinkId);
      showToast(`${itemLabel} removed from container`);
      if (userId !== undefined) {
        queryClient.invalidateQueries({ queryKey: ['userGear', userId] });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to remove gear from container';
      showToast(message, 'error');
    } finally {
      setContainerBusyMap((prev) => {
        const next = { ...prev };
        delete next[containerRegistrationId];
        return next;
      });
    }
  };

  const handleRemoveUserGear = async (registrationId: number | undefined, gearLabel?: string) => {
    if (registrationId === undefined) {
      showToast('Unable to identify registration', 'error');
      return;
    }

    setGearRemovalBusyMap((prev) => ({ ...prev, [registrationId]: true }));

    try {
      await userGearRemoveMutation.mutateAsync(registrationId);
      const label = gearLabel?.trim() ? gearLabel : `Registration #${registrationId}`;
      showToast(`${label} removed from user inventory`);
      if (userId !== undefined) {
        queryClient.invalidateQueries({ queryKey: ['userGear', userId] });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove registered gear';
      showToast(message, 'error');
    } finally {
      setGearRemovalBusyMap((prev) => {
        const next = { ...prev };
        delete next[registrationId];
        return next;
      });
    }
  };

  const renderGearList = (
    items: UserGear[],
    options: {
      depth?: number;
      parentContainerId?: number;
      parentContainerLabel?: string;
      ancestors?: number[];
    } = {}
  ) => {
    const depth = options.depth ?? 0;
    const parentContainerId = options.parentContainerId;
    const parentContainerLabel = options.parentContainerLabel;
    const ancestors = options.ancestors ?? [];
    const isNestedList = depth > 0;

    const listClasses = ['user-gear-list'];
    if (isNestedList) {
      listClasses.push('is-nested');
    }

    const parentIsBusy =
      parentContainerId !== undefined ? Boolean(containerBusyMap[parentContainerId]) : false;

    const listElement = (
      <ul className={listClasses.join(' ')}>
        {items.map((item, index) => {
          const registrationId = item.usergear_registration_id ?? undefined;
          const gearId = item.gear_id ?? item.usergear_gear_id;
          const dragIdentifier = registrationId !== undefined ? `user-gear-${registrationId}` : undefined;
          const isContainer = Boolean(item.gear_is_container);
          const isActiveContainer =
            isContainer && registrationId !== undefined && activeContainerId === registrationId;
          const isBusyContainer = registrationId !== undefined && Boolean(containerBusyMap[registrationId]);
          const isRemovingGear = registrationId !== undefined && Boolean(gearRemovalBusyMap[registrationId]);
          const cardClasses = [
            'gear-card',
            'user-gear-card',
            isContainer ? 'is-container' : undefined,
            isActiveContainer ? 'is-active' : undefined,
            isBusyContainer ? 'is-busy' : undefined,
            isRemovingGear ? 'is-busy' : undefined,
            isNestedList ? 'is-nested' : undefined
          ]
            .filter(Boolean)
            .join(' ');
          const slotClasses = [
            'user-gear-container-slot',
            isActiveContainer ? 'is-active' : undefined,
            isBusyContainer ? 'is-busy' : undefined
          ]
            .filter(Boolean)
            .join(' ');
          const containerLabel =
            isContainer && registrationId !== undefined
              ? `Drop gear here to store in ${item.gear_name ?? 'this container'}.`
              : undefined;
          const manufacturerSuffix =
            item.manufacture_name && item.manufacture_id ? ` (#${item.manufacture_id})` : '';
          const manufacturerLabel = item.manufacture_name
            ? `${item.manufacture_name}${manufacturerSuffix}`
            : undefined;
          const categoryLabel = (() => {
            const top = item.top_category_name?.trim();
            const category = item.category_name?.trim();
            if (top && category) return `${top} › ${category}`;
            return category ?? top ?? undefined;
          })();
          const totalContainerWeight =
            isContainer && registrationId !== undefined
              ? containerWeightMap.get(registrationId) ?? ensureWeight(item.gear_weight)
              : undefined;
          const infoDetailsParts = [
            registrationId !== undefined ? `Registration #${registrationId}` : undefined,
            gearId !== undefined ? `Gear ID #${gearId}` : undefined
          ].filter(Boolean) as string[];
          const infoDetails = infoDetailsParts.join(' • ');
          const stateKey = `${depth}-${registrationId ?? gearId ?? index}`;
          const isDetailsExpanded = Boolean(expandedDetailsMap[stateKey]);
          const toggleDetails = (event: MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            setExpandedDetailsMap((prev) => ({
              ...prev,
              [stateKey]: !prev[stateKey]
            }));
          };
          const statusLabel =
            typeof item.gear_status === 'boolean'
              ? item.gear_status
                ? 'Active'
                : 'Archived'
              : undefined;
          const moreInfoEntries: Array<{ label: string; value: string }> = [];
          if (registrationId !== undefined) {
            moreInfoEntries.push({ label: 'Registration', value: `#${registrationId}` });
          }
          if (gearId !== undefined) {
            moreInfoEntries.push({ label: 'Gear ID', value: `#${gearId}` });
          }
          if (statusLabel) {
            moreInfoEntries.push({ label: 'Status', value: statusLabel });
          }
          if (item.gear_weight !== undefined && item.gear_weight !== null) {
            moreInfoEntries.push({ label: 'Weight', value: formatWeight(ensureWeight(item.gear_weight)) });
          }
          if (item.gear_length !== undefined && item.gear_length !== null) {
            moreInfoEntries.push({ label: 'Length', value: String(item.gear_length) });
          }
          if (item.gear_width !== undefined && item.gear_width !== null) {
            moreInfoEntries.push({ label: 'Width', value: String(item.gear_width) });
          }
          if (item.gear_height !== undefined && item.gear_height !== null) {
            moreInfoEntries.push({ label: 'Height', value: String(item.gear_height) });
          }
          if (isContainer && totalContainerWeight !== undefined) {
            moreInfoEntries.push({ label: 'Total weight', value: formatWeight(totalContainerWeight) });
          }
          const hasMoreInfo = moreInfoEntries.length > 0;
          const cardGlyph = item.top_category_icon
            ? <TopCategoryIcon iconKey={item.top_category_icon} />
            : isContainer
              ? <IconCube />
              : <IconSpark />;
          const infoIcon = infoDetails ? (
            <span className="gear-card-info" role="img" aria-label={infoDetails} title={infoDetails}>
              <IconInfo />
            </span>
          ) : null;
          const totalWeightDisplay =
            isContainer && totalContainerWeight !== undefined ? formatWeight(totalContainerWeight) : undefined;
          const moreInfoToggleLabel = isDetailsExpanded ? 'Hide info' : 'More info';
          const listKey = registrationId ?? `${gearId ?? 'gear'}-${index}`;
          const containerContents =
            registrationId !== undefined ? containerContentMap.get(registrationId) ?? [] : [];
          const childContainers = containerContents.filter((content) => Boolean(content.gear_is_container));
          const childGear = containerContents.filter((content) => !content.gear_is_container);
          const childGearGroups =
            isContainer && registrationId !== undefined && childGear.length > 0
              ? (() => {
                const groupMap = new Map<
                  string,
                  {
                    key: string;
                    name: string;
                    count: number;
                    registrationIds: number[];
                    linkIds: number[];
                  }
                >();
                childGear.forEach((content, contentIndex) => {
                  const gearKeySource = content.gear_id ?? content.usergear_gear_id ?? undefined;
                  const mapKey =
                    gearKeySource !== undefined && gearKeySource !== null
                      ? `gear-${gearKeySource}`
                      : `registration-${content.usergear_registration_id ?? `${registrationId}-${contentIndex}`
                      }`;
                  const displayName =
                    content.gear_name ??
                    `Registration #${content.usergear_registration_id ?? '—'}`;
                  const registrationValue = content.usergear_registration_id;
                  const linkValue = content.container_link_id;
                  const existing = groupMap.get(mapKey);
                  if (existing) {
                    existing.count += 1;
                    if (registrationValue !== undefined && registrationValue !== null) {
                      existing.registrationIds.push(registrationValue);
                    }
                    if (linkValue !== undefined && linkValue !== null) {
                      existing.linkIds.push(linkValue);
                    }
                    return;
                  }
                  groupMap.set(mapKey, {
                    key: mapKey,
                    name: displayName,
                    count: 1,
                    registrationIds:
                      registrationValue !== undefined && registrationValue !== null
                        ? [registrationValue]
                        : [],
                    linkIds:
                      linkValue !== undefined && linkValue !== null ? [linkValue] : []
                  });
                });
                return Array.from(groupMap.values());
              })()
              : [];
          const totalDirectCount = containerContents.length;
          const hasNestedContainers = childContainers.length > 0;
          const linkToParent =
            parentContainerId !== undefined ? item.container_link_id ?? undefined : undefined;
          const canRemoveFromParent = parentContainerId !== undefined && linkToParent !== undefined;
          const disableRemoveFromParent = parentIsBusy || isBusyContainer || isRemovingGear;
          const isCycle =
            registrationId !== undefined && ancestors.includes(registrationId);
          const nextAncestors =
            registrationId !== undefined ? [...ancestors, registrationId] : ancestors;
          const topActions = (
            <div className="gear-card-top-actions">
              {isContainer && <span className="gear-card-chip is-accent">Container</span>}
              {infoIcon}
              {registrationId !== undefined && (
                <button
                  type="button"
                  className="gear-card-remove"
                  aria-label={`Remove ${item.gear_name ?? `registration #${registrationId}`} from user inventory`}
                  title="Remove from user inventory"
                  disabled={isRemovingGear || isBusyContainer}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleRemoveUserGear(registrationId, item.gear_name);
                  }}
                >
                  <IconMinus />
                </button>
              )}
              {canRemoveFromParent && (
                <button
                  type="button"
                  className="gear-card-remove"
                  aria-label={`Remove ${item.gear_name ?? 'container'} from ${parentContainerLabel ?? 'parent container'}`}
                  disabled={disableRemoveFromParent || isRemovingGear}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (parentContainerId === undefined || linkToParent === undefined) return;
                    const itemLabel = item.gear_name ?? `Registration #${registrationId ?? '—'}`;
                    void handleContainerItemRemove(parentContainerId, linkToParent, itemLabel);
                  }}
                >
                  <IconMinus />
                </button>
              )}
            </div>
          );

          const handleDragStart = (event: DragEvent<HTMLLIElement>) => {
            if (!dragIdentifier) return;
            dragItemRegistryRef.current.set(dragIdentifier, item);
            event.dataTransfer.setData(DRAG_DATA_TYPE, dragIdentifier);
            event.dataTransfer.setData('text/plain', dragIdentifier);
            event.dataTransfer.effectAllowed = 'move';
          };

          const handleDragEnd = () => {
            if (dragIdentifier) {
              dragItemRegistryRef.current.delete(dragIdentifier);
            }
            setActiveContainerId(null);
          };

          const handleContainerDragEnter = () => {
            if (!isContainer || registrationId === undefined) return;
            const registry = dragItemRegistryRef.current;
            const activeSource = registry.size > 0 ? registry.values().next().value : undefined;
            if (!activeSource) return;
            if (activeSource.usergear_registration_id === registrationId) return;
            setActiveContainerId(registrationId);
          };

          const handleContainerDragLeave = (event: DragEvent<HTMLElement>) => {
            if (!isContainer || registrationId === undefined) return;
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setActiveContainerId((current) => (current === registrationId ? null : current));
            }
          };

          const handleContainerDragOver = (event: DragEvent<HTMLElement>) => {
            if (!isContainer || registrationId === undefined) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
          };

          const handleContainerDrop = async (event: DragEvent<HTMLElement>) => {
            if (!isContainer || registrationId === undefined) return;
            event.preventDefault();
            event.stopPropagation();
            setActiveContainerId(null);

            const identifier =
              event.dataTransfer.getData(DRAG_DATA_TYPE) || event.dataTransfer.getData('text/plain');

            if (!identifier) {
              showToast('Unable to identify dropped gear', 'error');
              return;
            }

            const sourceItem = dragItemRegistryRef.current.get(identifier);
            dragItemRegistryRef.current.delete(identifier);

            if (!sourceItem) {
              showToast('Unable to identify dropped gear', 'error');
              return;
            }

            const sourceRegistrationId = sourceItem.usergear_registration_id;

            if (sourceRegistrationId === undefined || sourceRegistrationId === null) {
              showToast('Dragged gear is missing a registration ID', 'error');
              return;
            }

            if (sourceRegistrationId === registrationId) {
              showToast('Cannot drop gear into itself', 'error');
              return;
            }

            if (
              registrationId !== undefined &&
              containerHasDescendant(sourceRegistrationId, registrationId)
            ) {
              const sourceLabel = sourceItem.gear_name ?? `Registration #${sourceRegistrationId}`;
              const targetLabel = item.gear_name ?? `Registration #${registrationId}`;
              showToast(
                `Cannot link ${sourceLabel} into ${targetLabel} because it would create a circular container relationship.`,
                'error'
              );
              return;
            }

            setContainerBusyMap((prev) => ({ ...prev, [registrationId]: true }));

            try {
              await containerInsertMutation.mutateAsync({
                user_container_id: registrationId,
                user_gear_registration_id: sourceRegistrationId
              });
              const sourceLabel = sourceItem.gear_name ?? `Registration #${sourceRegistrationId}`;
              const targetLabel = item.gear_name ?? `Registration #${registrationId}`;
              showToast(`${sourceLabel} linked to ${targetLabel}`);
              if (userId !== undefined) {
                queryClient.invalidateQueries({ queryKey: ['userGear', userId] });
              }
            } catch (error) {
              const message =
                error instanceof Error ? error.message : 'Failed to link gear to container';
              showToast(message, 'error');
            } finally {
              setContainerBusyMap((prev) => {
                const next = { ...prev };
                delete next[registrationId];
                return next;
              });
            }
          };

          const containerDragHandlers = isContainer
            ? {
              onDragEnter: handleContainerDragEnter,
              onDragLeave: handleContainerDragLeave,
              onDragOver: handleContainerDragOver,
              onDrop: handleContainerDrop
            }
            : undefined;

          if (isCycle) {
            const cycleClasses = [cardClasses, 'has-cycle'].join(' ');
            const cycleHint = parentContainerLabel
              ? `This container already lives within ${parentContainerLabel}. Remove it to break the loop.`
              : 'This container already exists earlier in the hierarchy. Remove it to break the loop.';
            return (
              <li key={listKey} className={cycleClasses} aria-label="Circular container reference">
                <div className="gear-card-topbar">
                  <span className="gear-card-glyph">{cardGlyph}</span>
                  <div className="gear-card-topline">
                    <strong className="gear-card-title">{item.gear_name ?? 'Circular link detected'}</strong>
                  </div>
                  {topActions}
                </div>
                <div className="gear-card-body">
                  <small className="gear-card-helper">{cycleHint}</small>
                </div>
              </li>
            );
          }

          return (
            <li
              key={listKey}
              className={cardClasses}
              draggable={Boolean(dragIdentifier)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              {...(containerDragHandlers ?? {})}
              aria-label={item.gear_name ?? 'Registered gear'}
            >
              <div className="gear-card-topbar">
                <span className="gear-card-glyph">{cardGlyph}</span>
                <div className="gear-card-topline">
                  <div className="gear-card-heading">
                    <strong className="gear-card-title">{item.gear_name ?? 'Unnamed gear'}</strong>
                    {categoryLabel && <span className="gear-card-chip">{categoryLabel}</span>}
                  </div>
                  {parentContainerLabel && (
                    <span className="gear-card-assist">Stored inside {parentContainerLabel}</span>
                  )}
                </div>
                {topActions}
              </div>
              <div className="gear-card-body">
                {manufacturerLabel && <span className="gear-card-pill">{manufacturerLabel}</span>}
                {totalWeightDisplay && (
                  <div className="gear-card-metric" aria-live="polite">
                    Total weight: {totalWeightDisplay}
                  </div>
                )}
                {isContainer ? (
                  <>
                    <div
                      className={slotClasses}
                      role="group"
                      aria-label={containerLabel ?? 'Container drop zone'}
                      aria-busy={isBusyContainer || undefined}
                      {...(containerDragHandlers ?? {})}
                    >
                      {isBusyContainer
                        ? 'Linking gear…'
                        : containerLabel ?? 'Drop gear here to link.'}
                    </div>
                    {totalDirectCount > 0 ? (
                      <div className="user-gear-container-contents" aria-live="polite">
                        <div className="user-gear-container-contents-header">
                          <small>Stored items</small>
                          <span className="user-gear-container-contents-total">
                            {totalDirectCount} item{totalDirectCount === 1 ? '' : 's'}
                          </span>
                        </div>
                        {childGearGroups.length > 0 && (
                          <ul className="user-gear-container-gear-list">
                            {childGearGroups.map((group) => {
                              const firstLinkId = group.linkIds[0];
                              const disableRemove =
                                isBusyContainer || !group.linkIds.length || registrationId === undefined;
                              return (
                                <li
                                  key={group.key}
                                  title={
                                    group.registrationIds.length
                                      ? `Registrations: ${group.registrationIds
                                        .map((id) => `#${id}`)
                                        .join(', ')}`
                                      : undefined
                                  }
                                >
                                  <span className="user-gear-container-item-name">{group.name}</span>
                                  {group.count > 1 ? (
                                    <span className="user-gear-container-item-count">×{group.count}</span>
                                  ) : null}
                                  <button
                                    type="button"
                                    className="user-gear-container-remove"
                                    aria-label={`Remove ${group.name} from container`}
                                    disabled={disableRemove}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (registrationId === undefined) return;
                                      void handleContainerItemRemove(registrationId, firstLinkId, group.name);
                                    }}
                                  >
                                    <IconMinus />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        {hasNestedContainers && (
                          <div className="user-gear-container-nested">
                            <small>Nested containers</small>
                            {renderGearList(childContainers, {
                              depth: depth + 1,
                              parentContainerId: registrationId,
                              parentContainerLabel: item.gear_name ?? `Registration #${registrationId}`,
                              ancestors: nextAncestors
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="gear-card-helper">
                        No gear linked yet. Drop gear to store it.
                      </span>
                    )}
                  </>
                ) : (
                  <span className="gear-card-helper">
                    Drag this gear onto a container to organize it.
                  </span>
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
                      <div key={`${listKey}-detail-${entryIndex}`}>
                        <dt>{entry.label}</dt>
                        <dd>{entry.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    );
    return listElement;
  };

  return (
    <>
      <PageHero
        title="Registration radar"
        subtitle="Track which explorers are paired with each piece of gear."
        badge="Ownership"
        metrics={[
          {
            label: 'Tracked user',
            value: trackedUserLabel,
            hint: trackedUserHint,
            tone: userId ? 'positive' : 'default'
          },
          {
            label: 'Registered gear',
            value: userId ? totalCount : '—',
            hint: userId ? `Showing ${currentPageCount} on this page` : 'Awaiting selection',
            tone: userId && totalCount > 0 ? 'positive' : 'default'
          },
          {
            label: 'Filters',
            value: filtersActive ? 'Active' : 'Idle',
            hint: filtersActive ? 'Extra filters shaping results' : 'Pagination only',
            tone: filtersActive ? 'warning' : 'default'
          }
        ]}
        actions={
          <button
            className="button ghost"
            type="button"
            onClick={() => {
              if (userId === undefined) return;
              listQueryResult.refetch();
            }}
            disabled={userId === undefined}
          >
            Refresh list
          </button>
        }
      >
        <span className="hero-chip">
          {isAdmin
            ? 'Search for an explorer to inspect their entire manifest — defaults to your own gear.'
            : 'You are viewing the gear currently registered to your account.'}
        </span>
      </PageHero>

      {toast && (
        <div className={`notice${toast.tone === 'error' ? ' notice-error' : ' notice-success'}`}>{toast.message}</div>
      )}

      {isAdmin && (
        <FilterBar
          title="Browse user gear"
          subtitle="Search by name or email to pivot between explorers, then refine by category or manufacturer."
          tone="highlight"
          actions={
            <button className="button ghost" type="button" onClick={() => setListQuery({ page: 1, limit: 30 })}>
              Reset filters
            </button>
          }
        >
          <div className="filter-chip">
            <label htmlFor="userSearch">Find user</label>
            <div className="user-suggest-container">
              <input
                id="userSearch"
                type="text"
                value={userSearchInput}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setUserSearchInput(event.target.value);
                  setSuggestionsOpen(true);
                }}
                onFocus={() => setSuggestionsOpen(true)}
                onBlur={() => setTimeout(() => setSuggestionsOpen(false), 120)}
                placeholder="Search by name, email, or ID"
              />
              {suggestionsOpen && normalizedSearchTerm.length >= 2 && (
                <div className="user-suggest-dropdown">
                  {userSearchQuery.isLoading && <div className="user-suggest-option">Searching…</div>}
                  {userSearchQuery.isError && (
                    <div className="user-suggest-option">Unable to fetch users. Try again.</div>
                  )}
                  {!userSearchQuery.isLoading && !userSearchQuery.isError && userSuggestions.length === 0 && (
                    <div className="user-suggest-option">No matches found</div>
                  )}
                  {userSuggestions.map((user, index) => (
                    <button
                      key={user.user_id ?? user.user_email ?? user.user_username ?? index}
                      type="button"
                      className="user-suggest-option"
                      onClick={() => handleSelectUser(user)}
                    >
                      <span>{formatUserOptionLabel(user)}</span>
                      <small>{user.user_email || user.user_username || 'No contact info'}</small>
                    </button>
                  ))}
                </div>
              )}
              {suggestionsOpen && normalizedSearchTerm.length < 2 && (
                <div className="user-suggest-dropdown">
                  <div className="user-suggest-option">Type at least two characters to search.</div>
                </div>
              )}
            </div>
          </div>
          <div className="filter-chip">
            <label htmlFor="userId">User ID</label>
            <input
              id="userId"
              type="number"
              value={userId ?? ''}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const value = event.target.value;
                if (!value) {
                  setUserId(undefined);
                } else {
                  const numeric = Number(value);
                  setUserId(Number.isNaN(numeric) ? undefined : numeric);
                }
                if (isAdmin) {
                  if (value) {
                    setSelectedUserLabel('');
                    setUserSearchInput(value);
                  } else {
                    setSelectedUserLabel('');
                    setUserSearchInput('');
                  }
                }
              }}
              placeholder="Required"
              disabled={!isAdmin}
            />
          </div>
          <div className="filter-chip">
            <label htmlFor="page">Page</label>
            <input id="page" name="page" type="number" value={listQuery.page ?? 1} onChange={handleListQueryChange} />
          </div>
          <div className="filter-chip">
            <label htmlFor="limit">Limit</label>
            <input id="limit" name="limit" type="number" value={listQuery.limit ?? 30} onChange={handleListQueryChange} />
          </div>
          <div className="filter-chip">
            <label htmlFor="topCategory">Top categories</label>
            <input
              id="topCategory"
              name="topCategory"
              placeholder="comma separated IDs"
              onChange={handleListQueryChange}
            />
          </div>
          <div className="filter-chip">
            <label htmlFor="category">Categories</label>
            <input id="category" name="category" placeholder="comma separated IDs" onChange={handleListQueryChange} />
          </div>
          <div className="filter-chip">
            <label htmlFor="manufacture">Manufacturers</label>
            <input
              id="manufacture"
              name="manufacture"
              placeholder="comma separated IDs"
              onChange={handleListQueryChange}
            />
          </div>
        </FilterBar>
      )}

      {userId === undefined && <div className="notice">Enter a user ID to load registered gear.</div>}
      {userId !== undefined && listQueryResult.isLoading && <div className="notice">Loading user gear…</div>}
      {userId !== undefined && listQueryResult.isError && (
        <div className="notice notice-error">
          {listQueryResult.error instanceof Error ? listQueryResult.error.message : 'Failed to load user gear'}
        </div>
      )}
      {userId !== undefined && listQueryResult.isSuccess && (
        <section className="user-gear-results" aria-label="Registered gear list">
          <div className="user-gear-results-header">
            <h2>Registered gear</h2>
            <span>
              {totalCount > 0
                ? `Displaying ${currentPageCount} of ${totalCount} registrations`
                : 'No registrations found for this user.'}
            </span>
          </div>
          {containerItems.length === 0 && standaloneItems.length === 0 ? (
            <div className="user-gear-empty">No registrations found for this user.</div>
          ) : (
            <>
              {containerItems.length > 0 && (
                <div className="user-gear-group">
                  <h3 className="user-gear-subheading">Container gear</h3>
                  {renderGearList(containerItems)}
                </div>
              )}
              {standaloneItems.length > 0 && (
                <div className="user-gear-group">
                  <div className="user-gear-group-header">
                    <h3 className="user-gear-subheading">Other gear</h3>
                    <div className="user-gear-search">
                      <input
                        id="otherGearSearch"
                        type="search"
                        value={otherGearFilter}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setOtherGearFilter(event.target.value)}
                        placeholder="Search by name, category, manufacturer, or ID"
                        aria-label="Search other gear"
                      />
                      {otherGearFilter && (
                        <button
                          type="button"
                          onClick={() => setOtherGearFilter('')}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  {normalizedOtherGearFilter && (
                    <div className="user-gear-search-meta" aria-live="polite">
                      Showing {filteredStandaloneItems.length} of {standaloneItems.length} items
                    </div>
                  )}
                  {filteredStandaloneItems.length > 0 ? (
                    renderGearList(filteredStandaloneItems)
                  ) : (
                    <div className="user-gear-empty">No gear matches your search.</div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      )}

    </>
  );
}

function formatAuthUserLabel(user?: AuthUser | null) {
  if (!user) return '';
  const idPart = user.id !== undefined ? `#${user.id}` : '';
  if (user.name) {
    return idPart ? `${user.name} (${idPart})` : user.name;
  }
  if (user.email) {
    return idPart ? `${user.email} (${idPart})` : user.email;
  }
  return idPart;
}

function formatUserOptionLabel(user: User) {
  const idPart = user.user_id !== undefined ? `#${user.user_id}` : '';
  const name = user.user_name?.trim() || user.user_username?.trim() || user.user_email?.trim();
  if (name) {
    return idPart ? `${name} (${idPart})` : name;
  }
  return idPart || 'Unknown user';
}
