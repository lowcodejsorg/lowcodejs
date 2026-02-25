import { createServerFn } from '@tanstack/react-start';

import { Env } from '@/env';

export const getApiBaseUrl = createServerFn({ method: 'GET' }).handler(() => {
  return Env.VITE_API_BASE_URL;
});
