import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authentication/_sign-in/')({
  head: () => ({ meta: [{ title: 'Login - LowCodeJS' }] }),
});
