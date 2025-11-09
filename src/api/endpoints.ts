import type {
  AuthResponse,
  FullGear,
  Gear,
  GearCategory,
  GearListItem,
  GearTopCategory,
  HealthResponse,
  Manufacture,
  ResponsePayload,
  StatusResponse,
  User,
  UserGear,
  UserGearLink,
  UserGearLinkNoID,
  UserContainerLinkNoID,
  UserWithPass
} from './types';
import { apiRequest } from './client';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface GearListQuery extends PaginationQuery {
  category?: string;
  topCategory?: string;
  manufacturer?: string;
  collection?: string[];
}

export type GearSearchType = 'contains' | 'startswith' | 'endswith';

export interface GearSearchQuery extends PaginationQuery {
  searchString: string;
  searchType: GearSearchType;
}

export interface CategoryListQuery extends PaginationQuery {
  category?: number | number[];
  topCategory?: number | number[];
}

export interface UserListQuery extends PaginationQuery {
  user?: string;
  username?: string;
}

export interface UserGearListQuery extends PaginationQuery {
  topCategory?: number[];
  category?: number[];
  manufacture?: number[];
}

export interface GoogleCredentialPayload {
  code?: string;
  id_token?: string;
  credential?: string;
  state?: string;
}

export const AuthApi = {
  login: (payload: GoogleCredentialPayload) =>
    apiRequest<AuthResponse>({
      method: 'POST',
      url: '/auth/google/callback',
      data: payload,
      usePrefix: false
    }),
  refresh: () =>
    apiRequest<AuthResponse>({
      method: 'POST',
      url: '/auth/refresh',
      usePrefix: false
    })
};

export const CategoryApi = {
  list: (params?: CategoryListQuery) =>
    apiRequest<ResponsePayload<GearCategory>>({
      method: 'GET',
      url: '/category/list',
      params
    }),
  insert: (payload: GearCategory) =>
    apiRequest<GearCategory>({
      method: 'PUT',
      url: '/category/insert',
      data: payload
    }),
  get: (categoryId: number) =>
    apiRequest<GearCategory>({
      method: 'GET',
      url: `/category/${categoryId}/get`
    }),
  update: (categoryId: number, payload: GearCategory) =>
    apiRequest<StatusResponse>({
      method: 'POST',
      url: `/category/${categoryId}/update`,
      data: payload
    }),
  remove: (categoryId: number) =>
    apiRequest<StatusResponse>({
      method: 'DELETE',
      url: `/category/${categoryId}/delete`
    })
};

export const TopCategoryApi = {
  list: (params?: PaginationQuery) =>
    apiRequest<ResponsePayload<GearTopCategory>>({
      method: 'GET',
      url: '/topCategory/list',
      params
    }),
  insert: (payload: GearTopCategory) =>
    apiRequest<StatusResponse>({
      method: 'PUT',
      url: '/topCategory/insert',
      data: payload
    }),
  get: (id: number) =>
    apiRequest<GearTopCategory>({
      method: 'GET',
      url: `/topCategory/${id}/get`
    }),
  update: (id: number, payload: GearTopCategory) =>
    apiRequest<StatusResponse>({
      method: 'POST',
      url: `/topCategory/${id}/update`,
      data: payload
    }),
  remove: (id: number) =>
    apiRequest<StatusResponse>({
      method: 'DELETE',
      url: `/topCategory/${id}/delete`
    })
};

export const GearApi = {
  search: (params: GearSearchQuery) =>
    apiRequest<ResponsePayload<GearListItem>>({
      method: 'GET',
      url: '/gear/search',
      params
    }),
  list: (params?: GearListQuery) =>
    apiRequest<ResponsePayload<GearListItem>>({
      method: 'GET',
      url: '/gear/list',
      params
    }),
  insert: (payload: Gear) =>
    apiRequest<Gear>({
      method: 'PUT',
      url: '/gear/insert',
      data: payload
    }),
  get: (gearId: number) =>
    apiRequest<FullGear>({
      method: 'GET',
      url: `/gear/${gearId}/get`
    }),
  update: (gearId: number, payload: Gear) =>
    apiRequest<StatusResponse>({
      method: 'POST',
      url: `/gear/${gearId}/update`,
      data: payload
    }),
  remove: (gearId: number) =>
    apiRequest<StatusResponse>({
      method: 'DELETE',
      url: `/gear/${gearId}/delete`
    })
};

export const ManufactureApi = {
  list: (params?: PaginationQuery & { manufacture?: string; manufacturename?: string }) =>
    apiRequest<ResponsePayload<Manufacture>>({
      method: 'GET',
      url: '/manufacture/list',
      params
    }),
  insert: (payload: Manufacture) =>
    apiRequest<Manufacture>({
      method: 'PUT',
      url: '/manufacture/insert',
      data: payload
    }),
  get: (id: number) =>
    apiRequest<Manufacture>({
      method: 'GET',
      url: `/manufacture/${id}/get`
    }),
  update: (id: number, payload: Manufacture) =>
    apiRequest<StatusResponse>({
      method: 'POST',
      url: `/manufacture/${id}/update`,
      data: payload
    }),
  remove: (id: number) =>
    apiRequest<StatusResponse>({
      method: 'DELETE',
      url: `/manufacture/${id}/delete`
    })
};

export const UsersApi = {
  list: (params?: UserListQuery) =>
    apiRequest<ResponsePayload<User>>({
      method: 'GET',
      url: '/users/list',
      params
    }),
  insert: (payload: UserWithPass) =>
    apiRequest<StatusResponse>({
      method: 'PUT',
      url: '/users/insert',
      data: payload
    }),
  get: (id: number) =>
    apiRequest<User>({
      method: 'GET',
      url: `/users/${id}/get`
    }),
  update: (id: number, payload: User) =>
    apiRequest<StatusResponse>({
      method: 'POST',
      url: `/users/${id}/update`,
      data: payload
    }),
  remove: (id: number) =>
    apiRequest<StatusResponse>({
      method: 'DELETE',
      url: `/users/${id}/delete`
    })
};

export const UserGearApi = {
  listByUser: (userId: number, params?: UserGearListQuery) =>
    apiRequest<ResponsePayload<UserGear>>({
      method: 'GET',
      url: `/usergear/${userId}/list`,
      params
    }),
  insert: (payload: UserGearLinkNoID) =>
    apiRequest<StatusResponse>({
      method: 'PUT',
      url: '/usergear/insert',
      data: payload
    }),
  get: (registrationId: number) =>
    apiRequest<UserGear>({
      method: 'GET',
      url: `/usergear/registration/${registrationId}/get`
    }),
  update: (registrationId: number, payload: UserGearLink) =>
    apiRequest<StatusResponse>({
      method: 'POST',
      url: `/usergear/registration/${registrationId}/update`,
      data: payload
    }),
  remove: (registrationId: number) =>
    apiRequest<StatusResponse>({
      method: 'DELETE',
      url: `/usergear/registration/${registrationId}/delete`
    })
};

export const ContainerApi = {
  insert: (payload: UserContainerLinkNoID) =>
    apiRequest<StatusResponse>({
      method: 'PUT',
      url: '/container/insert',
      data: payload
    }),
  remove: (registrationId: number) =>
    apiRequest<StatusResponse>({
      method: 'DELETE',
      url: `/container/${registrationId}/delete`
    })
};

export const HealthApi = {
  get: () =>
    apiRequest<HealthResponse>({
      method: 'GET',
      url: '/health',
      usePrefix: false
    })
};
