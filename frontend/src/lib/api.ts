import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { getApiBaseUrl } from '@/lib/get-api-config';
import { getServerCookies } from '@/lib/server/get-cookies';
import { useAuthStore } from '@/stores/authentication';

let resolvedBaseUrl: string | null = null;
let baseUrlPromise: Promise<string> | null = null;

export const API = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use(async (config) => {
  if (!resolvedBaseUrl) {
    if (!baseUrlPromise) {
      if (typeof window === 'undefined' && process.env.SERVER_API_URL) {
        baseUrlPromise = Promise.resolve(process.env.SERVER_API_URL);
      } else {
        baseUrlPromise = getApiBaseUrl();
      }
    }
    resolvedBaseUrl = await baseUrlPromise;
  }
  config.baseURL = resolvedBaseUrl;

  // Só injeta o activeAccountId do store se a request NÃO trouxe um
  // X-Auth-Account-Id explícito. Fluxos de transição (add/switch) passam um
  // header próprio (vazio = usar cookie) para não serem poluídos pelo store
  // ainda stale.
  if (
    typeof window !== 'undefined' &&
    !config.headers.has('X-Auth-Account-Id')
  ) {
    const activeAccountId = useAuthStore.getState().activeAccountId;
    if (activeAccountId) {
      config.headers.set('X-Auth-Account-Id', activeAccountId);
    }
  }

  if (typeof window === 'undefined') {
    try {
      const cookies = await getServerCookies();
      if (cookies) config.headers.set('Cookie', cookies);
    } catch {
      /* not in request context */
    }
  }

  return config;
});

const isPublicPath = (path: string): boolean =>
  path === '/' ||
  path === '/sign-up' ||
  path.startsWith('/forgot-password') ||
  path.startsWith('/tables/');

const AUTH_ENDPOINTS = [
  '/authentication/sign-in',
  '/authentication/sign-up',
  '/authentication/sign-out',
  '/authentication/refresh-token',
  '/authentication/accounts',
  '/authentication/switch-account',
];

const isAuthEndpoint = (url: string | undefined): boolean => {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const refreshPromises = new Map<string, Promise<void>>();

const performRefresh = (accountId: string | null): Promise<void> => {
  const refreshKey = accountId ?? 'legacy';
  const existingPromise = refreshPromises.get(refreshKey);
  if (existingPromise) return existingPromise;

  const refreshPromise = API.post('/authentication/refresh-token', undefined, {
    headers: accountId ? { 'X-Auth-Account-Id': accountId } : undefined,
  })
    .then(() => undefined)
    .finally(() => {
      refreshPromises.delete(refreshKey);
    });

  refreshPromises.set(refreshKey, refreshPromise);
  return refreshPromise;
};

const handleSessionLost = (): void => {
  if (typeof window === 'undefined') return;
  const currentPath = window.location.pathname;
  if (isPublicPath(currentPath)) return;
  const activeAccountId = useAuthStore.getState().activeAccountId;
  if (activeAccountId) {
    useAuthStore.getState().removeAccount(activeAccountId);
  } else {
    useAuthStore.getState().clear();
  }
  window.location.href = '/';
};

API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const config = error.config as RetriableConfig | undefined;

    if (status !== 401 || !config) {
      return Promise.reject(error);
    }

    if (
      typeof window === 'undefined' ||
      isAuthEndpoint(config.url) ||
      config._retried
    ) {
      if (typeof window !== 'undefined' && !isAuthEndpoint(config.url)) {
        handleSessionLost();
      }
      return Promise.reject(error);
    }

    config._retried = true;
    const activeAccountId = useAuthStore.getState().activeAccountId;

    try {
      await performRefresh(activeAccountId);
      return API.request(config);
    } catch (refreshError) {
      handleSessionLost();
      return Promise.reject(refreshError);
    }
  },
);
