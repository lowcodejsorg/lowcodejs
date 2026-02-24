import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_private/dashboard/')({
  head: () => ({ meta: [{ title: 'Dashboard - LowCodeJS' }] }),
});
