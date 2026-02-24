import { createServerFn } from '@tanstack/react-start';

export const getApiBaseUrl = createServerFn({ method: 'GET' }).handler(() => {
  return process.env.VITE_API_BASE_URL || 'http://localhost:3000';
});
