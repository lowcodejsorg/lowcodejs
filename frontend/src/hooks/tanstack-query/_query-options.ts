import type { UndefinedInitialDataOptions } from '@tanstack/react-query';
import { queryOptions } from '@tanstack/react-query';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type {
  IField,
  IGroup,
  IMenu,
  IPermission,
  IRow,
  ISetting,
  ITable,
  IUser,
  Paginated,
} from '@/lib/interfaces';
import type { BaseQueryPayload, TableQueryPayload } from '@/lib/payloads';

// ============== USERS ==============

export const userListOptions = (
  params: BaseQueryPayload,
): UndefinedInitialDataOptions<Paginated<IUser>> =>
  queryOptions({
    queryKey: queryKeys.users.list(params),
    queryFn: async () => {
      const response = await API.get<Paginated<IUser>>('/users/paginated', {
        params,
      });
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });

export const userDetailOptions = (
  userId: string,
): UndefinedInitialDataOptions<IUser> =>
  queryOptions({
    queryKey: queryKeys.users.detail(userId),
    queryFn: async () => {
      const response = await API.get<IUser>(`/users/${userId}`);
      return response.data;
    },
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000,
  });

// ============== GROUPS ==============

export const groupListOptions = (
  params: BaseQueryPayload,
): UndefinedInitialDataOptions<Paginated<IGroup>> =>
  queryOptions({
    queryKey: queryKeys.groups.list(params),
    queryFn: async () => {
      const response = await API.get<Paginated<IGroup>>(
        '/user-group/paginated',
        { params },
      );
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });

export const groupAllOptions = (): UndefinedInitialDataOptions<Array<IGroup>> =>
  queryOptions({
    queryKey: queryKeys.groups.all,
    queryFn: async () => {
      const response = await API.get<Array<IGroup>>('/user-group');
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });

export const groupDetailOptions = (
  groupId: string,
): UndefinedInitialDataOptions<IGroup> =>
  queryOptions({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: async () => {
      const response = await API.get<IGroup>(`/user-group/${groupId}`);
      return response.data;
    },
    enabled: Boolean(groupId),
    staleTime: 2 * 60 * 1000,
  });

// ============== MENUS ==============

export const menuListOptions = (
  params: BaseQueryPayload,
): UndefinedInitialDataOptions<Paginated<IMenu>> =>
  queryOptions({
    queryKey: queryKeys.menus.list(params),
    queryFn: async () => {
      const response = await API.get<Paginated<IMenu>>('/menu/paginated', {
        params,
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const menuAllOptions = (): UndefinedInitialDataOptions<Array<IMenu>> =>
  queryOptions({
    queryKey: queryKeys.menus.all,
    queryFn: async () => {
      const response = await API.get<Array<IMenu>>('/menu');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const menuDetailOptions = (
  menuId: string,
): UndefinedInitialDataOptions<IMenu> =>
  queryOptions({
    queryKey: queryKeys.menus.detail(menuId),
    queryFn: async () => {
      const response = await API.get<IMenu>(`/menu/${menuId}`);
      return response.data;
    },
    enabled: Boolean(menuId),
    staleTime: 5 * 60 * 1000,
  });

// ============== TABLES ==============

export const tableListOptions = (
  params: TableQueryPayload,
): UndefinedInitialDataOptions<Paginated<ITable>> =>
  queryOptions({
    queryKey: queryKeys.tables.list(params),
    queryFn: async () => {
      const response = await API.get<Paginated<ITable>>('/tables/paginated', {
        params,
      });
      return response.data;
    },
    staleTime: 60 * 1000,
  });

export const tableDetailOptions = (
  slug: string,
): UndefinedInitialDataOptions<ITable> =>
  queryOptions({
    queryKey: queryKeys.tables.detail(slug),
    queryFn: async () => {
      const response = await API.get<ITable>(`/tables/${slug}`);
      return response.data;
    },
    enabled: Boolean(slug),
    staleTime: 60 * 1000,
  });

// ============== ROWS ==============

export const rowListOptions = (
  slug: string,
  params: Record<string, unknown>,
): UndefinedInitialDataOptions<Paginated<IRow>> =>
  queryOptions({
    queryKey: queryKeys.rows.list(slug, params),
    queryFn: async () => {
      const response = await API.get<Paginated<IRow>>(
        `/tables/${slug}/rows/paginated`,
        { params },
      );
      return response.data;
    },
    enabled: Boolean(slug),
    staleTime: 30 * 1000,
  });

export const rowDetailOptions = (
  slug: string,
  rowId: string,
): UndefinedInitialDataOptions<IRow> =>
  queryOptions({
    queryKey: queryKeys.rows.detail(slug, rowId),
    queryFn: async () => {
      const response = await API.get<IRow>(`/tables/${slug}/rows/${rowId}`);
      return response.data;
    },
    enabled: Boolean(slug) && Boolean(rowId),
    staleTime: 30 * 1000,
  });

// ============== FIELDS ==============

export const fieldDetailOptions = (
  tableSlug: string,
  fieldId: string,
  groupSlug?: string,
): UndefinedInitialDataOptions<IField> =>
  queryOptions({
    queryKey: queryKeys.fields.detail(tableSlug, fieldId, groupSlug),
    queryFn: async () => {
      let route = `/tables/${tableSlug}/fields/${fieldId}`;
      if (groupSlug) {
        route = route.concat('?group=').concat(groupSlug);
      }
      const response = await API.get<IField>(route);
      return response.data;
    },
    enabled: Boolean(tableSlug) && Boolean(fieldId),
    staleTime: 60 * 1000,
  });

// ============== PROFILE ==============

export const profileDetailOptions = (): UndefinedInitialDataOptions<IUser> =>
  queryOptions({
    queryKey: queryKeys.profile.all,
    queryFn: async () => {
      const response = await API.get<IUser>('/profile');
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });

// ============== SETTINGS ==============

export const settingOptions = (): UndefinedInitialDataOptions<ISetting> =>
  queryOptions({
    queryKey: queryKeys.settings.all,
    queryFn: async () => {
      const response = await API.get<ISetting>('/setting');
      return response.data;
    },
    staleTime: Infinity,
  });

// ============== PERMISSIONS ==============

export const permissionOptions = (): UndefinedInitialDataOptions<
  Array<IPermission>
> =>
  queryOptions({
    queryKey: queryKeys.permissions.all,
    queryFn: async () => {
      const response = await API.get<Array<IPermission>>('/permissions');
      return response.data;
    },
    staleTime: Infinity,
  });

// ============== PAGES ==============

export const pageDetailOptions = (
  slug: string,
): UndefinedInitialDataOptions<IMenu> =>
  queryOptions({
    queryKey: queryKeys.pages.detail(slug),
    queryFn: async () => {
      const response = await API.get<IMenu>(`/pages/${slug}`);
      return response.data;
    },
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });

// ============== RELATIONSHIPS ==============

export const relationshipRowsOptions = (params: {
  tableSlug: string;
  fieldSlug: string;
  search?: string;
  page?: number;
  perPage?: number;
}): UndefinedInitialDataOptions<Paginated<IRow>> =>
  queryOptions({
    queryKey: queryKeys.relationships.rows(
      params.fieldSlug,
      params.tableSlug,
      params.search,
    ),
    queryFn: async () => {
      const response = await API.get<Paginated<IRow>>(
        `/tables/${params.tableSlug}/rows/paginated`,
        {
          params: {
            page: params.page ?? 1,
            perPage: params.perPage ?? 10,
            ...(params.search && { search: params.search }),
          },
        },
      );
      return response.data;
    },
    enabled: Boolean(params.tableSlug),
    staleTime: 30 * 1000,
  });
