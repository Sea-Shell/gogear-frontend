import { useQuery } from '@tanstack/react-query';
import { GearApi } from '../api/endpoints';

export function useGearList() {
  return useQuery({
    queryKey: ['gear', 'list', { limit: 200 }],
    queryFn: () => GearApi.list({ limit: 200 }),
    staleTime: 30_000,
  });
}
