import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authentication/sign-up/')({
  head: () => ({ meta: [{ title: 'Cadastro - LowCodeJS' }] }),
});
