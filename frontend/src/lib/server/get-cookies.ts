import { createServerFn } from '@tanstack/react-start';

export const getServerCookies = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getRequestHeader } = await import('@tanstack/react-start/server');
    return getRequestHeader('Cookie') ?? '';
  },
);
