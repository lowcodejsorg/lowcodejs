import { createFileRoute } from '@tanstack/react-router';

import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/_authentication/sign-up/')({
  head: createRouteHead({ title: 'Cadastro' }),
});
