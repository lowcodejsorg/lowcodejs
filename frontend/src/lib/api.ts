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
      baseUrlPromise = getApiBaseUrl();
    }
    resolvedBaseUrl = await baseUrlPromise;
  }
  config.baseURL = resolvedBaseUrl;

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
];

const isAuthEndpoint = (url: string | undefined): boolean => {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

let refreshPromise: Promise<void> | null = null;

const performRefresh = (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = API.post('/authentication/refresh-token')
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const handleSessionLost = (): void => {
  if (typeof window === 'undefined') return;
  const currentPath = window.location.pathname;
  if (isPublicPath(currentPath)) return;
  useAuthStore.getState().clear();
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

    try {
      await performRefresh();
      return API.request(config);
    } catch (refreshError) {
      handleSessionLost();
      return Promise.reject(refreshError);
    }
  },
);
