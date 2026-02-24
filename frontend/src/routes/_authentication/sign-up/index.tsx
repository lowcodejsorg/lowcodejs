import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authentication/sign-up/')({
  head: ({ matches }) => {
    const systemName =
      (matches[0]?.loaderData as { systemName?: string })?.systemName ||
      'LowCodeJs';
    return { meta: [{ title: `Cadastro - ${systemName}` }] };
  },
});
