import axios from 'axios';

import { getApiBaseUrl } from '@/lib/get-api-config';
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
  return config;
});

const PUBLIC_PATHS = ['/', '/sign-up', '/tables/'];

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (!PUBLIC_PATHS.includes(currentPath)) {
          useAuthStore.getState().clear();
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  },
);
