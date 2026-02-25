import { createServerFn } from '@tanstack/react-start';

export const getApiBaseUrl = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { Env } = await import('@/env');
    return Env.VITE_API_BASE_URL;
  },
);
