import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_private/profile/')({
  head: () => ({ meta: [{ title: 'Perfil - LowCodeJS' }] }),
});
